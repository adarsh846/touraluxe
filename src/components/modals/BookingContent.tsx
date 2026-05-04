"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { Search, Calendar, Users, Check, ArrowLeft, ChevronRight, Plane, Command, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBooking } from "../BookingProvider";
import { supabase } from "@/lib/supabase";

export const BookingContent = memo(function BookingContent({ 
  data: packageData, 
  isActive, 
  source: bookingSource, 
  onScroll, 
  startClosing,
  setInternalCanGoBack,
  registerBackHandler,
  openModal
}: { 
  data: any, 
  isActive: boolean, 
  source: string, 
  onScroll: (scrolled: boolean) => void, 
  startClosing: () => void,
  setInternalCanGoBack?: (can: boolean) => void,
  registerBackHandler?: (handler: (() => boolean) | null) => void,
  openModal?: (view: any, data?: any, source?: string) => void
}) {
  const { setError } = useBooking();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Flow State
  const [step, setStep] = useState(1);
  const [discoveryPhase, setDiscoveryPhase] = useState(packageData ? 2 : 1); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Form Data
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [infants, setInfants] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [internalPackage, setInternalPackage] = useState(packageData);
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Search UI State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [trendingPackages, setTrendingPackages] = useState<any[]>([]);

  // Navigation Logic
  const nextPhase = () => setDiscoveryPhase(prev => Math.min(4, prev + 1));
  const prevPhase = () => setDiscoveryPhase(prev => Math.max(1, prev - 1));

  const handlePackageSelect = (pkg: any) => {
    // Open the full package details view instead of advancing phases
    openModal?.('PACKAGE', pkg, bookingSource);
  };

  // Sync state with props (Essential for seamless flow between Discovery and Details)
  useEffect(() => {
    if (packageData) {
      setInternalPackage(packageData);
      setDiscoveryPhase(2);
    } else {
      setDiscoveryPhase(1);
    }
  }, [packageData]);

  useEffect(() => {
    // If we have packageData, our "internal start" is Phase 2.
    // Going back from Phase 2 should respect global history (taking us back to Details).
    const canGoBackInternally = (packageData ? discoveryPhase > 2 : discoveryPhase > 1) || step === 2;
    setInternalCanGoBack?.(canGoBackInternally);
    
    registerBackHandler?.(() => {
      if (discoveryPhase > (packageData ? 2 : 1)) { prevPhase(); return true; }
      if (step === 2) { setStep(1); return true; }
      return false;
    });
  }, [discoveryPhase, step, registerBackHandler, setInternalCanGoBack, packageData]);

  // Search Functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('packages')
        .select('*')
        .or(`location.ilike.%${query}%,title.ilike.%${query}%,category.cs.{${query}}`)
        .eq('is_published', true)
        .limit(10);
      setSearchResults(data || []);
    } finally { setIsSearching(false); }
  };

  useEffect(() => {
    const fetchTrending = async () => {
      const { data } = await supabase
        .from('packages')
        .select('*')
        .eq('is_published', true)
        .order('price', { ascending: false })
        .limit(4);
      if (data) setTrendingPackages(data);
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (destination.length > 0) handleSearch(destination);
      else setSearchResults([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [destination]);

  // Temporal Intelligence: Auto-calculate return date for fixed-duration packages
  const isDurationFixed = Boolean(internalPackage?.duration?.match(/(\d+)\s*Night/i));

  useEffect(() => {
    if (startDate && isDurationFixed) {
      const nightsMatch = internalPackage.duration.match(/(\d+)\s*Night/i);
      if (nightsMatch) {
        const nights = parseInt(nightsMatch[1]);
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + nights);
        setEndDate(end.toISOString().split('T')[0]);
      }
    }
  }, [startDate, internalPackage, isDurationFixed]);

  // Pricing Logic
  const totalInvestment = React.useMemo(() => {
    const pkg = internalPackage || packageData;
    if (!pkg?.price) return "Quote on Request";
    const symbol = pkg.currency || "₹";
    const base = parseInt(pkg.price.replace(/[^0-9]/g, "")) || 0;
    const child = pkg.child_price ? parseInt(pkg.child_price.replace(/[^0-9]/g, "")) : 0;
    const infant = pkg.infant_price ? parseInt(pkg.infant_price.replace(/[^0-9]/g, "")) : 0;
    return `${symbol}${(adults * base + kids * child + infants * infant).toLocaleString()}`;
  }, [adults, kids, infants, internalPackage, packageData]);

  const submitBooking = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: internalPackage?.id || packageData?.id,
          packageName: internalPackage?.title || destination || "Bespoke Journey",
          travelerCount: adults + kids + infants,
          customerName,
          customerEmail,
          customerPhone,
          specialRequests: `Dates: ${startDate} to ${endDate} | Notes: ${notes}`,
          bookingSource,
          totalAmount: parseInt(totalInvestment.replace(/[^0-9]/g, "")) || 0
        }),
      });
      if (response.ok) {
        const res = await response.json();
        setBookingId(res.data?.[0]?.id);
        setStep(3);
      }
    } finally { setIsSubmitting(false); }
  };

  const canSubmit = Boolean(customerName.length > 2 && customerEmail.includes("@"));

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0a0a0b] text-[#f5f5f7] selection:bg-white selection:text-black font-sans antialiased overflow-hidden">
      
      {/* 1. PROGRESS LINE (PINNED) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] z-[150] flex gap-px px-px">
        {[1, 2, 3, 4].map((p) => (
          <div key={p} className={cn("flex-1 h-full transition-colors duration-1000", discoveryPhase >= p ? "bg-white/30" : "bg-white/5")} />
        ))}
      </div>

      {/* 2. ATMOSPHERIC CANVAS (IMMERSIVE CONTEXT) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn(
          "absolute inset-0 transition-opacity duration-[2000ms] ease-in-out",
          internalPackage?.image ? "opacity-100" : "opacity-0"
        )}>
          {internalPackage?.image && (
            <img 
              src={internalPackage.image} 
              className="absolute inset-0 w-full h-full object-cover opacity-50 blur-[60px] scale-110 saturate-[2.5]" 
              alt="Atmosphere"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b]/40 to-[#0a0a0b] via-[#0a0a0b]/80" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[140%] aspect-square bg-gradient-to-b from-white/[0.04] to-transparent rounded-full blur-[140px] opacity-30" />
      </div>

      {/* 3. VIEWPORT-LOCKED WORKSPACE */}
      <div className="flex-1 w-full relative z-10 flex flex-col overflow-hidden">
        
        <div className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden">
          
          {step === 1 && (
            <div className="w-full h-full flex flex-col items-center justify-center px-6 md:px-12 relative">
              
              {/* PHASE 01: DESTINY (PAN-HORIZON) */}
              {discoveryPhase === 1 && (
                <div className="w-full flex flex-col items-center justify-center space-y-8 md:space-y-10">
                  
                  {/* Dynamic Header & Search Container */}
                  <div className="w-full flex flex-col items-center text-center">
                    
                    {/* The Headline (Subtle Whisper on Search) */}
                    <div className={cn(
                      "space-y-4 transition-all duration-1000 cubic-bezier(0.23,1,0.32,1) origin-top",
                      searchResults.length > 0 ? "opacity-70 scale-[0.85] mb-4" : "opacity-100 scale-100 mb-8"
                    )}>
                      <div className="inline-flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.4em] text-white/60">
                        <Command size={10} />
                        <span>Phase 01 — Discovery Hub</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-[#f5f5f7] leading-tight">Where shall we craft<br/><span className="text-white/60">your private experience?</span></h2>
                    </div>

                    {/* The Search Input (Morphs to subtle on Search) */}
                    <div className={cn(
                      "w-full relative group transition-all duration-1000",
                      searchResults.length > 0 ? "max-w-md scale-95" : "max-w-2xl scale-100"
                    )}>
                      <div className="relative group/search max-w-2xl w-full mx-auto">
                        <Search className={cn("absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-500 z-10", searchFocused ? "text-white/80" : "text-white/30")} size={20} />
                        <input 
                          type="text" value={destination} 
                          onChange={(e) => setDestination(e.target.value)} 
                          onFocus={() => setSearchFocused(true)}
                          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                          placeholder="Type a Destiny..." 
                          className={cn(
                            "w-full py-5 pl-14 pr-12 text-xl font-medium focus:outline-none transition-all duration-1000 text-center relative z-0",
                            searchResults.length > 0 
                              ? "bg-white/[0.03] border border-white/[0.1] text-white/80 placeholder:text-white/20 hover:bg-white/[0.05] hover:border-white/20 focus:text-white focus:bg-white/[0.05] focus:border-white/30 rounded-full" 
                              : "bg-black/40 backdrop-blur-3xl border border-white/[0.15] rounded-[32px] text-white focus:bg-black/60 focus:border-white/40 focus:scale-[1.02] placeholder:text-white/40 shadow-2xl"
                          )}
                          autoFocus
                        />
                        {destination.length > 0 && (
                          <button 
                            onClick={() => setDestination('')}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-all p-1.5 hover:bg-white/10 rounded-full z-10 animate-in fade-in zoom-in-50 duration-300"
                          >
                            <X size={16} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ADAPTIVE HORIZONTAL REEL (VIEWPORT-LOCKED) */}
                  <div className="w-full relative min-h-[100px] md:min-h-[150px] flex flex-col items-center justify-center">
                    {searchResults.length > 0 && !isSearching && (
                      <div className="flex items-center gap-4 text-[7px] font-bold uppercase tracking-[0.6em] text-white/30 mb-6 animate-in fade-in slide-in-from-top-2 duration-1000">
                        <div className="h-[1px] w-6 bg-white/10" />
                        <span>{searchResults.length} {searchResults.length === 1 ? 'Unique Horizon' : 'Curated Horizons'}</span>
                        <div className="h-[1px] w-6 bg-white/10" />
                      </div>
                    )}
                    {isSearching ? (
                      <div className="flex items-center gap-3 opacity-20">
                        <div className="w-3 h-3 border-t border-white rounded-full animate-spin" />
                        <span className="text-[7px] font-bold uppercase tracking-[0.4em]">Consulting Archives</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="w-full overflow-x-auto scrollbar-hide pb-8 flex items-center px-[10vw]">
                        <div className="flex gap-6 mx-auto">
                          {searchResults.map((pkg) => (
                            <div 
                              key={pkg.id}
                              onClick={() => handlePackageSelect(pkg)}
                              className={cn(
                                "relative rounded-[48px] overflow-hidden border transition-all duration-700 group/card cursor-pointer flex-shrink-0 w-[clamp(280px,30vw,380px)] h-[clamp(320px,48vh,480px)]",
                                internalPackage?.id === pkg.id 
                                  ? "border-white/40 bg-white/[0.05] shadow-2xl scale-[0.98]" 
                                  : "border-white/[0.12] hover:border-white/40 hover:scale-[1.02] hover:shadow-2xl"
                              )}
                            >
                              <div className="absolute inset-0 overflow-hidden">
                                <img src={pkg.image} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover/card:grayscale-0 transition-all duration-[1.5s] group-hover/card:scale-110" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent transition-opacity duration-700" />
                              </div>

                              <div className="absolute bottom-0 left-0 right-0 p-10 space-y-6 z-20 transition-transform duration-700 group-hover/card:-translate-y-2">
                                <div className="space-y-1.5">
                                  <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/50 block">{pkg.location}</span>
                                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">{pkg.title}</h3>
                                </div>
                                
                                <div className="flex items-center justify-between pt-6 border-t border-white/15 opacity-85 group-hover/card:opacity-100 transition-opacity duration-500">
                                   <div className="flex items-start gap-2.5">
                                      <span className="text-3xl font-bold text-white tracking-tight leading-none">
                                        {new Intl.NumberFormat('en-IN', {
                                          style: 'currency',
                                          currency: 'INR',
                                          maximumFractionDigits: 0
                                        }).format(parseInt(pkg.price.toString().replace(/[^0-9]/g, '')) || 0)}
                                      </span>
                                      <div className="flex flex-col gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 leading-none">/ Person</span>
                                        <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-white/50 leading-none">Excluding of Taxes</span>
                                      </div>
                                   </div>
                                   <div className="flex flex-col items-end gap-1.5 text-right">
                                      <span className="text-[11px] font-bold text-white/90 tracking-[0.2em] uppercase leading-tight">{pkg.duration || 'Bespoke'}</span>
                                      <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-white/70 leading-none">Duration Period</span>
                                   </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : destination.length === 0 ? (
                      <div className="w-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-1000 mt-4">
                        <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/60">Curated Horizons</span>
                        <div className="flex flex-wrap justify-center gap-6 w-full max-w-5xl">
                          {trendingPackages.map(pkg => (
                            <button 
                              key={pkg.id} 
                              onClick={() => handlePackageSelect(pkg)} 
                              className="relative overflow-hidden w-52 h-32 rounded-3xl border border-white/[0.15] hover:border-white/50 hover:scale-105 transition-all duration-700 group/mini flex-shrink-0 shadow-2xl"
                            >
                              <img src={pkg.image} className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover/mini:grayscale-0 transition-all duration-1000 group-hover/mini:scale-110" alt="" />
                              <div className="absolute inset-0 bg-black/60 group-hover/mini:bg-black/30 transition-all duration-500" />
                              <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                                <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-2xl">{pkg.title}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-5 opacity-80">
                        <p className="text-sm font-medium uppercase tracking-[0.6em] italic text-white/50">Horizon Not Found</p>
                        <button onClick={nextPhase} className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/80 hover:text-white transition-colors underline underline-offset-8 decoration-white/20">Proceed with Custom Plan →</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PHASE 02: TIMELINE (UNIFIED MODAL STYLE) */}
              {discoveryPhase === 2 && (
                <div 
                  ref={scrollRef}
                  onScroll={(e) => onScroll(e.currentTarget.scrollTop > 30)}
                  className="absolute inset-0 w-full h-full overflow-y-auto scrollbar-hide overscroll-behavior-contain animate-in fade-in duration-1000 z-[200]"
                  data-lenis-prevent
                >
                  {/* Hero Cover (Dynamic Selection) */}
                  <div className="relative w-full aspect-[16/9] md:aspect-[2.4/1] overflow-hidden bg-[#0a0a0b]">
                    {internalPackage?.image && (
                      <img 
                        src={internalPackage.image} 
                        className="absolute inset-0 w-full h-full object-cover scale-[1.01] opacity-70"
                        alt={internalPackage.title}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0a0b]" />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
                    
                    <div className="absolute bottom-12 left-8 md:left-16 space-y-3">
                       <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 drop-shadow-lg">{internalPackage?.location || 'Bespoke Experience'}</span>
                       <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-2xl">{internalPackage?.title || 'Personalized Journey'}</h3>
                    </div>
                  </div>

                  <div className="relative z-10 px-6 md:px-16 pb-40 -mt-10 bg-[#0a0a0b] rounded-t-[48px] flex flex-col items-center border-t border-white/[0.05]">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full my-8" />
                    
                    <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      <div className="text-center space-y-4">
                        <div className="text-[7px] font-black uppercase tracking-[0.5em] text-white/60">Phase 02 — Temporal Window</div>
                        <h2 className="text-4xl font-bold tracking-tight text-white/90">Timeline Selection</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-10 rounded-[48px] bg-white/[0.04] border border-white/[0.1] space-y-5">
                          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">Arrival Protocol</span>
                          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-transparent text-3xl font-bold focus:outline-none [color-scheme:dark] text-white/90" />
                        </div>
                        <div className={cn(
                          "p-10 rounded-[48px] bg-white/[0.04] border border-white/[0.1] space-y-5 transition-all duration-500",
                          isDurationFixed ? "opacity-80" : "opacity-100"
                        )}>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">
                              {isDurationFixed ? "Return Protocol (Locked)" : "Return Protocol"}
                            </span>
                            {isDurationFixed && <div className="text-[7px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-white/10 text-white/70">{internalPackage.duration}</div>}
                          </div>
                          <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => !isDurationFixed && setEndDate(e.target.value)} 
                            readOnly={isDurationFixed}
                            className={cn(
                              "w-full bg-transparent text-3xl font-bold focus:outline-none [color-scheme:dark] text-white/90",
                              isDurationFixed ? "cursor-not-allowed" : "cursor-pointer"
                            )} 
                          />
                        </div>
                      </div>
                      <button onClick={nextPhase} disabled={!startDate || !endDate} className="w-full py-6 bg-white text-black rounded-[24px] font-bold uppercase tracking-widest text-[10px] shadow-2xl disabled:opacity-10 transition-all">Establish Window</button>
                    </div>
                  </div>
                </div>
              )}

              {/* PHASE 03: THE PARTY (UNIFIED MODAL STYLE) */}
              {discoveryPhase === 3 && (
                <div 
                  ref={scrollRef}
                  onScroll={(e) => onScroll(e.currentTarget.scrollTop > 30)}
                  className="absolute inset-0 w-full h-full overflow-y-auto scrollbar-hide overscroll-behavior-contain animate-in fade-in duration-1000 z-[200]"
                  data-lenis-prevent
                >
                  {/* Hero Cover (Dynamic Selection) */}
                  <div className="relative w-full aspect-[16/9] md:aspect-[2.4/1] overflow-hidden bg-[#0a0a0b]">
                    {internalPackage?.image && (
                      <img 
                        src={internalPackage.image} 
                        className="absolute inset-0 w-full h-full object-cover scale-[1.01] opacity-70"
                        alt={internalPackage.title}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0a0b]" />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
                    
                    <div className="absolute bottom-12 left-8 md:left-16 space-y-3">
                       <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 drop-shadow-lg">{internalPackage?.location || 'Bespoke Experience'}</span>
                       <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-2xl">{internalPackage?.title || 'Personalized Journey'}</h3>
                    </div>
                  </div>

                  <div className="relative z-10 px-6 md:px-16 pb-40 -mt-10 bg-[#0a0a0b] rounded-t-[48px] flex flex-col items-center border-t border-white/[0.05]">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full my-8" />
                    
                    <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      <div className="text-center space-y-4">
                        <div className="text-[7px] font-black uppercase tracking-[0.5em] text-white/60">Phase 03 — Group Manifest</div>
                        <h2 className="text-4xl font-bold tracking-tight text-white/90">Group Composition</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { label: "Adults", count: adults, set: setAdults, min: 1 },
                          { label: "Children", count: kids, set: setKids, min: 0 },
                          { label: "Infants", count: infants, set: setInfants, min: 0 }
                        ].map((t) => (
                          <div key={t.label} className="p-10 rounded-[56px] bg-white/[0.02] border border-white/[0.05] text-center space-y-8">
                            <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/60 block">{t.label}</span>
                            <div className="flex items-center justify-between bg-black/40 p-2 rounded-2xl border border-white/[0.05]">
                              <button onClick={() => t.set(Math.max(t.min, t.count - 1))} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#f5f5f7] hover:text-black transition-all font-bold text-lg">-</button>
                              <span className="text-4xl font-bold italic text-white/90">{t.count}</span>
                              <button onClick={() => t.set(t.count + 1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#f5f5f7] hover:text-black transition-all font-bold text-lg">+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={nextPhase} className="w-full py-6 bg-white text-black rounded-[24px] font-bold uppercase tracking-widest text-[10px] shadow-2xl transition-all">Confirm Manifest</button>
                    </div>
                  </div>
                </div>
              )}

              {/* PHASE 04: CURATION (UNIFIED MODAL STYLE) */}
              {discoveryPhase === 4 && (
                <div 
                  ref={scrollRef}
                  onScroll={(e) => onScroll(e.currentTarget.scrollTop > 30)}
                  className="absolute inset-0 w-full h-full overflow-y-auto scrollbar-hide overscroll-behavior-contain animate-in fade-in duration-1000 z-[200]"
                  data-lenis-prevent
                >
                  {/* Hero Cover (Dynamic Selection) */}
                  <div className="relative w-full aspect-[16/9] md:aspect-[2.4/1] overflow-hidden bg-[#0a0a0b]">
                    {internalPackage?.image && (
                      <img 
                        src={internalPackage.image} 
                        className="absolute inset-0 w-full h-full object-cover scale-[1.01] opacity-70"
                        alt={internalPackage.title}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0a0b]" />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
                    
                    <div className="absolute bottom-12 left-8 md:left-16 space-y-3">
                       <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 drop-shadow-lg">{internalPackage?.location || 'Bespoke Experience'}</span>
                       <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-2xl">{internalPackage?.title || 'Personalized Journey'}</h3>
                    </div>
                  </div>

                  <div className="relative z-10 px-6 md:px-16 pb-40 -mt-10 bg-[#0a0a0b] rounded-t-[48px] flex flex-col items-center border-t border-white/[0.05]">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full my-8" />
                    
                    <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      <div className="text-center space-y-4">
                        <div className="text-[7px] font-black uppercase tracking-[0.5em] text-white/60">Phase 04 — Final Verification</div>
                        <h2 className="text-4xl font-bold tracking-tight text-white/90">Curation Details</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">Primary Guest</span>
                            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] p-6 rounded-[28px] text-lg font-semibold focus:border-white/20 transition-all text-white/90" placeholder="Full Name" />
                          </div>
                          <div className="space-y-3">
                            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">Contact Email</span>
                            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] p-6 rounded-[28px] text-lg font-semibold focus:border-white/20 transition-all text-white/90" placeholder="name@domain.com" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">Special Requests</span>
                          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-full min-h-[160px] bg-white/[0.03] border border-white/[0.08] p-6 rounded-[32px] text-lg font-medium focus:border-white/20 transition-all resize-none text-white/90" placeholder="Type custom requests..." />
                        </div>
                      </div>
                      <button onClick={() => canSubmit ? setStep(2) : null} className="w-full py-6 bg-white text-black rounded-[24px] font-bold uppercase tracking-widest text-[10px] transition-all shadow-2xl disabled:opacity-10" disabled={!canSubmit}>Generate Protocol</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {step === 2 && (
            <div className="w-full max-w-2xl space-y-12 animate-in zoom-in-95 duration-1000">
              <div className="text-center space-y-4">
                <h3 className="text-3xl font-bold tracking-tight text-white/90 uppercase">Protocol Verification</h3>
                <p className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/60 italic">TRX-SECURE TRANSMISSION</p>
              </div>
              <div className="p-12 rounded-[56px] bg-white/[0.01] border border-white/[0.05] space-y-12 backdrop-blur-3xl shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-sm font-medium">
                  <div className="space-y-2"><span className="text-[7px] font-bold uppercase text-white/60 tracking-widest">Guest</span><p className="text-lg text-white/90">{customerName}</p></div>
                  <div className="space-y-2 md:text-right"><span className="text-[7px] font-bold uppercase text-white/60 tracking-widest">Horizon</span><p className="text-lg text-white/90">{internalPackage?.title || destination}</p></div>
                  <div className="space-y-2"><span className="text-[7px] font-bold uppercase text-white/60 tracking-widest">Dates</span><p className="text-lg text-white/90">{startDate} — {endDate}</p></div>
                  <div className="space-y-2 md:text-right"><span className="text-[7px] font-bold uppercase text-white/60 tracking-widest">Investment</span><p className="text-3xl font-bold font-mono text-white/90">{totalInvestment}</p></div>
                </div>
                <button onClick={submitBooking} disabled={isSubmitting} className="w-full py-6 bg-[#f5f5f7] text-black rounded-[28px] font-bold uppercase tracking-widest text-[10px] shadow-2xl transition-all">{isSubmitting ? "Transmitting..." : "Activate Protocol"}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center space-y-12 animate-in zoom-in-95 duration-1000">
              <div className="w-20 h-20 rounded-full bg-[#f5f5f7] text-black flex items-center justify-center shadow-2xl"><Check size={32} /></div>
              <div className="space-y-4">
                <h3 className="text-5xl font-bold tracking-tight text-white/90 uppercase">Established</h3>
                <p className="text-[9px] font-bold uppercase tracking-[0.6em] text-white/30 italic">Reference TRX-{bookingId?.split('-')[0].toUpperCase()}</p>
              </div>
              <button onClick={startClosing} className="px-16 py-5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/50 hover:bg-[#f5f5f7] hover:text-black transition-all">Close Consultation</button>
            </div>
          )}

        </div>
      </div>

      {/* 4. PRECISION PILL MANIFEST (PINNED) */}
      {step === 1 && discoveryPhase > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-8 z-[120] pointer-events-none flex justify-center animate-in slide-in-from-bottom-10 duration-1000 cubic-bezier(0.23,1,0.32,1)">
          <div className="w-full max-w-4xl flex items-center justify-between bg-black/60 backdrop-blur-3xl border border-white/[0.08] p-5 px-10 rounded-full pointer-events-auto shadow-2xl transition-all duration-700">
            <div className="flex items-center gap-10">
              <div className="space-y-1.5">
                <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-white/40">Investment</span>
                <p className="text-2xl font-mono font-bold leading-none text-white/90">{totalInvestment}</p>
              </div>
              <div className="w-px h-10 bg-white/[0.08] hidden md:block" />
              <div className="hidden lg:flex flex-col space-y-1.5">
                <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-white/40">Manifest Window</span>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">{startDate ? `${startDate} / ${endDate}` : 'Awaiting Window'}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              {discoveryPhase > 1 && (
                <button onClick={nextPhase} className="px-10 py-4 bg-[#f5f5f7] text-black rounded-2xl font-bold uppercase tracking-widest text-[9px] hover:bg-white transition-all flex items-center gap-2 shadow-xl shadow-white/5">
                  Continue
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
});
