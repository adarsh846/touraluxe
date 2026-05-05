"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import {
  Search,
  Calendar,
  Users,
  Check,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Plane,
  Command,
  X,
  ArrowRight,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBooking } from "../BookingProvider";
import { supabase } from "@/lib/supabase";
import { useDiscovery } from "@/hooks/useDiscovery";
import { Magnetic } from "@/components/Magnetic";

export const BookingContent = memo(function BookingContent({
  data: packageData,
  isActive,
  source: bookingSource,
  onScroll,
  startClosing,
  setInternalCanGoBack,
  registerBackHandler,
  openModal,
  onPhaseChange,
  onStepChange,
}: {
  data: any;
  isActive: boolean;
  source: string;
  onScroll: (scrolled: boolean) => void;
  startClosing: () => void;
  setInternalCanGoBack?: (can: boolean) => void;
  registerBackHandler?: (handler: (() => boolean) | null) => void;
  openModal?: (view: any, data?: any, source?: string) => void;
  onPhaseChange?: (phase: number) => void;
  onStepChange?: (step: number) => void;
}) {
  const { setError } = useBooking();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

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
  const [notes, setNotes] = React.useState("");
  const [additionalGuests, setAdditionalGuests] = React.useState<{ name: string; age?: string; type: 'adult' | 'child' }[]>([]);

  // Synchronize additionalGuests when traveler counts change
  React.useEffect(() => {
    const totalAdditional = (adults - 1) + kids;
    setAdditionalGuests(prev => {
      const next = [...prev];
      if (next.length > totalAdditional) {
        return next.slice(0, totalAdditional);
      }
      while (next.length < totalAdditional) {
        const index = next.length;
        const type = index < (adults - 1) ? 'adult' : 'child';
        next.push({ name: "", type });
      }
      return next;
    });
  }, [adults, kids]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ flag: "🇮🇳", code: "+91", name: "India", length: 10 });
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [taxRate, setTaxRate] = useState(0);
  const curationScrollRef = useRef<HTMLDivElement>(null);

  const handleCurationScroll = () => {
    if (curationScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = curationScrollRef.current;
      // Show if there is more than 20px of scrollable content remaining
      setShowScrollIndicator(scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 20);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetch("/api/settings", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (data.tax_percentage) setTaxRate(parseFloat(data.tax_percentage));
      })
      .catch(err => console.error("Settings fetch error:", err));

    // Real-time subscription for hyper-dynamic updates
    const channel = supabase
      .channel('site_settings_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'key=eq.tax_percentage' }, 
        (payload: any) => {
          if (payload.new && payload.new.value) {
            setTaxRate(parseFloat(payload.new.value));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    if (discoveryPhase === 4) {
      // Give the DOM a moment to settle before measuring
      const timer = setTimeout(handleCurationScroll, 100);
      return () => clearTimeout(timer);
    }
  }, [discoveryPhase]);

  // Discovery Architecture
  const {
    search,
    searchResults,
    isSearching,
    trending,
    manifest,
    clearSearch,
  } = useDiscovery<any>();
  const [searchFocused, setSearchFocused] = useState(false);

  // Navigation Logic
  const nextPhase = () => setDiscoveryPhase((prev) => Math.min(4, prev + 1));
  const prevPhase = () => setDiscoveryPhase((prev) => Math.max(1, prev - 1));
  const goToPhase = (phase: number) => {
    if (phase < discoveryPhase) setDiscoveryPhase(phase);
  };

  const handlePackageSelect = (pkg: any) => {
    // Open the full package details view instead of advancing phases
    openModal?.("PACKAGE", pkg, bookingSource);
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
    const canGoBackInternally =
      (packageData ? discoveryPhase > 2 : discoveryPhase > 1) || step === 2;
    setInternalCanGoBack?.(canGoBackInternally);

    registerBackHandler?.(() => {
      // Step 1: Step-level regression (Back from Verification/Success)
      if (step > 1) {
        setStep(1);
        return true;
      }
      // Step 2: Phase-level regression (Internal Discovery phases)
      if (discoveryPhase > (packageData ? 2 : 1)) {
        prevPhase();
        return true;
      }
      return false;
    });
  }, [
    discoveryPhase,
    step,
    registerBackHandler,
    setInternalCanGoBack,
    packageData,
  ]);

  useEffect(() => {
    onPhaseChange?.(discoveryPhase);
  }, [discoveryPhase, onPhaseChange]);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(destination);
    }, 150);
    return () => clearTimeout(timer);
  }, [destination, search]);

  const startInputRef = React.useRef<HTMLInputElement>(null);
  const endInputRef = React.useRef<HTMLInputElement>(null);

  // Temporal Intelligence: Auto-calculate return date for fixed-duration packages
  const isDurationFixed = Boolean(
    internalPackage?.duration?.match(/(\d+)\s*Night/i),
  );

  useEffect(() => {
    if (startDate && isDurationFixed) {
      const nightsMatch = internalPackage.duration.match(/(\d+)\s*Night/i);
      if (nightsMatch) {
        const nights = parseInt(nightsMatch[1]);
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + nights);
        setEndDate(end.toISOString().split("T")[0]);
      }
    }
  }, [startDate, internalPackage, isDurationFixed]);

  // Pricing Logic
  const pricing = React.useMemo(() => {
    const pkg = internalPackage || packageData;
    if (!pkg?.price) return { baseTotal: 0, taxAmount: 0, finalTotal: 0, symbol: "₹", isTaxApplied: false };
    
    const symbol = pkg.currency || "₹";
    const base = parseInt(String(pkg.price).replace(/[^0-9]/g, "")) || 0;
    const child = pkg.child_price
      ? parseInt(String(pkg.child_price).replace(/[^0-9]/g, ""))
      : 0;
    const infant = pkg.infant_price
      ? parseInt(String(pkg.infant_price).replace(/[^0-9]/g, ""))
      : 0;

    const subtotal = adults * base + kids * child + infants * infant;
    
    // Per-package tax toggle logic: Only apply if global taxRate > 0 AND package has tax enabled
    const isTaxApplied = taxRate > 0 && pkg.tax_status === "Inclusive of Taxes";
    const tax = isTaxApplied ? (subtotal * taxRate) / 100 : 0;
    
    return {
      baseTotal: subtotal,
      taxAmount: tax,
      finalTotal: subtotal + tax,
      symbol,
      isTaxApplied,
      activeTaxRate: isTaxApplied ? taxRate : 0
    };
  }, [adults, kids, infants, internalPackage, packageData, taxRate]);

  const totalInvestment = `${pricing.symbol}${pricing.finalTotal.toLocaleString()}`;

  const submitBooking = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: internalPackage?.id || packageData?.id,
          packageName:
            internalPackage?.title || destination || "Bespoke Journey",
          travelerCount: adults + kids + infants,
          customerName,
          customerEmail,
          customerPhone,
          specialRequests: `Dates: ${startDate} to ${endDate} | Notes: ${notes}`,
          bookingSource,
          totalAmount: parseInt(totalInvestment.replace(/[^0-9]/g, "")) || 0,
        }),
      });
      if (response.ok) {
        const res = await response.json();
        setBookingId(res.data?.[0]?.id);
        setStep(3);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  const canSubmit = Boolean(
    customerName.trim().length >= 3 && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) &&
    customerPhone.trim().length >= 8
  );

  const isPhaseValid = React.useMemo(() => {
    switch (discoveryPhase) {
      case 2:
        return Boolean(startDate && endDate);
      case 3:
        return adults > 0;
      case 4:
        return canSubmit;
      default:
        return true;
    }
  }, [discoveryPhase, startDate, endDate, adults, canSubmit, customerName, customerEmail, customerPhone]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const isScrolled = e.currentTarget.scrollTop > 30;
    setScrolled(isScrolled);
    onScroll(isScrolled);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0a0a0b] text-[#f5f5f7] selection:bg-white selection:text-black font-sans antialiased overflow-hidden">
      {/* 1. PROGRESS LINE (PINNED) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] z-[150] flex gap-px px-px">
        {[1, 2, 3, 4].map((p) => (
          <div
            key={p}
            className={cn(
              "flex-1 h-full transition-colors duration-1000",
              discoveryPhase >= p ? "bg-white/30" : "bg-white/5",
            )}
          />
        ))}
      </div>

      {/* 2. SOVEREIGN BLACK FOUNDATION (IMMERSIVE CONTEXT) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#0a0a0b]">
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-[3000ms] ease-in-out",
            internalPackage?.image ? "opacity-100" : "opacity-0",
          )}
        >
          {internalPackage?.image && (
            <img
              src={internalPackage.image}
              className="absolute inset-0 w-full h-full object-cover opacity-[0.15] blur-[80px] scale-110 saturate-[1.5]"
              alt="Atmosphere"
            />
          )}
        </div>
        {/* Subtle Vignette for Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0b]/60 to-[#0a0a0b]" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[140%] aspect-square bg-gradient-to-b from-white/[0.02] to-transparent rounded-full blur-[140px] opacity-20" />
      </div>

      {/* 3. VIEWPORT-LOCKED WORKSPACE */}
      <div className="flex-1 w-full relative z-10 flex flex-col overflow-hidden">
        <div className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden">
          {/* Unified Background Hero for Phases 02-04 */}
          {discoveryPhase > 1 && (
            <div className="absolute inset-0 w-full h-full animate-in fade-in duration-1000 z-0 overflow-hidden bg-[#0a0a0b]">
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                {internalPackage?.image && (
                  <img
                    src={internalPackage.image}
                    className="absolute inset-0 w-full h-full object-cover scale-[1.01] opacity-60"
                    alt={internalPackage.title}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#0a0a0b]" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="w-full h-full flex flex-col items-center justify-center px-6 md:px-12 relative">
              {/* PHASE 01: DESTINY (PAN-HORIZON) */}
              {discoveryPhase === 1 && (
                <div
                  className={cn(
                    "w-full h-full flex flex-col transition-all duration-[1.2s] cubic-bezier(0.23,1,0.32,1)",
                    searchResults.length > 0 && destination.length > 0
                      ? "pt-[clamp(3.5rem,10vh,5rem)]"
                      : "pt-[clamp(5rem,12vh,7rem)]",
                  )}
                >
                  <div
                    className={cn(
                      "w-full transition-all duration-1000 cubic-bezier(0.23,1,0.32,1) px-[clamp(1.5rem,6vw,4rem)]",
                      searchResults.length > 0 && destination.length > 0
                        ? "opacity-70 scale-[0.85] mb-[clamp(0.5rem,3vh,1.5rem)]"
                        : "opacity-100 scale-100 mb-[clamp(1rem,3vh,2rem)]",
                    )}
                  >
                    <h2 className="text-[clamp(1.2rem,6.5vw,7rem)] font-bold tracking-[-0.06em] text-white/90 leading-none mb-[clamp(0.8rem,3vh,1.2rem)] text-center whitespace-nowrap">
                      Explore{" "}
                      <span className="text-white/50 font-medium italic tracking-tight">
                        new horizons.
                      </span>
                    </h2>
                    <p
                      className={cn(
                        "text-[clamp(0.55rem,1.5vw,0.8rem)] font-medium uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/40 text-center transition-all duration-700 whitespace-nowrap",
                        searchResults.length > 0 && destination.length > 0
                          ? "opacity-0 h-0 overflow-hidden"
                          : "opacity-100 mb-[clamp(1.5rem,4vh,2.5rem)]",
                      )}
                    >
                      Search your destination
                    </p>

                    <div
                      className={cn(
                        "transition-all duration-1000 cubic-bezier(0.23,1,0.32,1) mx-auto",
                        searchResults.length > 0 && destination.length > 0
                          ? "max-w-md"
                          : "max-w-2xl",
                      )}
                    >
                      <div className="relative group/search">
                        <Search
                          className={cn(
                            "absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-500 z-10",
                            searchFocused ? "text-white/80" : "text-white/20",
                          )}
                          size={22}
                        />
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          onFocus={() => setSearchFocused(true)}
                          onBlur={() =>
                            setTimeout(() => setSearchFocused(false), 200)
                          }
                          placeholder="Type a Destiny..."
                          autoComplete="off"
                          className="w-full py-4 pl-14 pr-12 text-lg font-medium focus:outline-none transition-all duration-700 bg-white/[0.03] border border-white/[0.06] focus:border-white/20 rounded-2xl md:rounded-[32px] text-white placeholder:text-white/10 backdrop-blur-3xl shadow-sm"
                          autoFocus
                        />
                        {destination.length > 0 && (
                          <button
                            onClick={() => {
                              setDestination("");
                              clearSearch();
                            }}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full z-10"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SEARCH MANIFEST & STATUS BAR */}
                  <div
                    className={cn(
                      "w-full px-[clamp(1rem,6vw,3rem)] mb-6 md:mb-8 flex items-center justify-between transition-opacity duration-700",
                      searchResults.length > 0 && destination.length > 0
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none",
                    )}
                  >
                    <div className="flex items-center gap-6">
                      {searchResults.length > 0 && !isSearching && (
                        <div className="flex items-center gap-3 animate-in fade-in duration-700">
                          <div className="w-1 h-1 rounded-full bg-white/40" />
                          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/60">
                            {searchResults.length}{" "}
                            {searchResults.length === 1
                              ? "Manifest"
                              : "Manifests"}{" "}
                            Found
                          </span>
                        </div>
                      )}
                      {destination.length > 0 && (
                        <div className="hidden md:flex items-center gap-3 text-white/40 animate-in fade-in duration-1000">
                          <span className="text-[9px] font-medium tracking-widest uppercase italic">
                            Filtering for "{destination}"
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-[8px] font-bold uppercase tracking-[0.4em] text-white/40">
                      <span className="hidden sm:inline">
                        Encrypted Terminal
                      </span>
                      <div className="w-1 h-1 rounded-full bg-white/40" />
                      <span>Phase 01</span>
                    </div>
                  </div>

                  {/* ADAPTIVE KINETIC COLLECTION (HORIZONTAL) */}
                  <div className="w-full flex-1 flex flex-col overflow-y-hidden overflow-x-hidden scrollbar-hide min-h-0">
                    {isSearching ? (
                      <div className="w-full h-40 flex items-center justify-center gap-3 text-white/20">
                        <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
                          Consulting Archives
                        </span>
                      </div>
                    ) : searchResults.length > 0 && destination.length > 0 ? (
                      <div className="flex-1 flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide pt-6 pb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 min-h-0">
                        {/* Anti-Clip Spacer (Replaces padding to prevent scale clipping) */}
                        <div className="w-1 md:w-4 flex-shrink-0" />
                        
                        {searchResults.map((pkg) => (
                          <div
                            key={pkg.id}
                            onClick={() => handlePackageSelect(pkg)}
                            className="flex-shrink-0 snap-start w-[75vw] sm:w-[60vw] md:w-auto md:flex-1 md:min-w-[320px] md:max-w-[450px] h-full group/card relative z-[10] hover:z-[60] rounded-3xl overflow-hidden cursor-pointer border border-white/[0.05] hover:border-white/20 transition-all duration-700 shadow-2xl"
                          >
                            <div className="absolute inset-0">
                              <img
                                src={pkg.image}
                                className="w-full h-full object-cover transition-transform duration-[2s] group-hover/card:scale-110"
                                alt={pkg.title}
                              />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover/card:opacity-60 transition-opacity duration-700" />
                            
                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.4em] text-white/50 block">
                                    {pkg.location}
                                  </span>
                                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white/90">
                                    {pkg.title}
                                  </h3>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-white/10 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-lg md:text-xl font-bold text-white/90 italic">
                                      {pkg.duration}
                                    </p>
                                    <span className="text-[7px] font-bold uppercase tracking-widest text-white/30">
                                      Duration
                                    </span>
                                  </div>
                                  <div className="space-y-1 md:text-right">
                                    <p className="text-lg md:text-xl font-bold text-white/90">
                                      {(() => {
                                        if (pkg.price == null) return "On Request";
                                        const cleanStr = String(pkg.price).replace(/[^\d.-]/g, "");
                                        const num = Number(cleanStr);
                                        return !isNaN(num) && cleanStr !== ""
                                          ? new Intl.NumberFormat("en-IN", {
                                              style: "currency",
                                              currency: "INR",
                                              maximumFractionDigits: 0,
                                            }).format(num)
                                          : "On Request";
                                      })()}
                                    </p>
                                    <span className="text-[7px] font-bold uppercase tracking-widest text-white/30">
                                      Per Person
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Visual Spacer for Horizontal End */}
                        <div className="flex-shrink-0 w-8 md:w-32 h-1" />
                      </div>
                    ) : destination.length > 0 &&
                      !isSearching &&
                      searchResults.length === 0 &&
                      destination
                        .split(/\s+/)
                        .some(
                          (w) =>
                            w.length >= 3 &&
                            ![
                              "i",
                              "want",
                              "to",
                              "go",
                              "find",
                              "show",
                              "me",
                              "a",
                              "the",
                              "for",
                              "my",
                              "trip",
                              "travel",
                              "holiday",
                              "vacation",
                              "wan",
                              "look",
                              "looking",
                              "need",
                              "needs",
                              "place",
                              "places",
                            ].includes(w.toLowerCase()),
                        ) ? (
                      <div className="w-full h-[40vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-1000">
                        <div className="w-12 h-[1px] bg-white/20 mb-10" />
                        <div className="space-y-4 max-w-sm">
                          <p className="text-white/60 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] leading-relaxed">
                            Destiny Not Found
                          </p>
                          <p className="text-white/30 text-[9px] md:text-[10px] font-medium tracking-widest leading-relaxed">
                            We couldn't find a record for "
                            <span className="text-white/60">{destination}</span>
                            ". Our inventory is vast, but your destiny might
                            require custom orchestration.
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-6 mt-12">
                          <button
                            onClick={() => {
                              const customPkg = {
                                id: `custom-${Date.now()}`,
                                title:
                                  destination.charAt(0).toUpperCase() +
                                  destination.slice(1),
                                location: "Tailored Experience",
                                duration: "Custom Duration",
                                price: 0, // Indicate that price is on request
                                image:
                                  "https://images.unsplash.com/photo-1578922746465-3a805228b223?auto=format&fit=crop&q=80&w=2000",
                              };
                              setInternalPackage(customPkg);
                              setDiscoveryPhase(2);
                            }}
                            className="px-8 py-3 bg-white/5 border border-white/10 hover:border-white/30 rounded-full text-[9px] font-bold uppercase tracking-[0.3em] text-white/80 hover:text-white transition-all duration-500 shadow-2xl backdrop-blur-xl"
                          >
                            Craft Your Own Journey
                          </button>

                          <button
                            onClick={() => {
                              setDestination("");
                              clearSearch();
                            }}
                            className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors border-b border-white/10 pb-1"
                          >
                            Explore Alternative Destinations
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex-1 flex flex-col animate-in fade-in duration-1000 min-h-0">
                        <div className="flex items-center gap-4 px-5 md:px-[clamp(2rem,6vw,4rem)] mb-6 md:mb-10 flex-shrink-0">
                          <span className="text-[9px] font-bold uppercase tracking-[0.6em] text-white/70 whitespace-nowrap">
                            {destination.length > 0
                              ? "Awaiting your intent..."
                              : "Suggested Destinies"}
                          </span>
                          <div className="h-[1px] w-full bg-white/[0.08]" />
                        </div>

                        <div
                          className={cn(
                            "flex-1 flex gap-4 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide pt-6 pb-8 transition-all duration-1000 min-h-0",
                            destination.length > 0
                              ? "opacity-30 blur-sm scale-[0.98] pointer-events-none"
                              : "opacity-100 blur-0 scale-100",
                          )}
                        >
                          {/* Anti-Clip Spacer */}
                          <div className="w-1 md:w-4 flex-shrink-0" />

                          {trending.map((pkg) => (
                            <button
                              key={pkg.id}
                              onClick={() => handlePackageSelect(pkg)}
                              className="flex-shrink-0 snap-start w-[75vw] sm:w-[60vw] md:w-auto md:flex-1 md:min-w-[280px] md:max-w-[420px] h-full relative z-[10] hover:z-[60] rounded-[32px] overflow-hidden border border-white/[0.08] hover:border-white/30 hover:scale-[1.03] transition-all duration-700 group/mini shadow-2xl"
                            >
                              <img
                                src={pkg.image}
                                className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover/mini:grayscale-0 transition-all duration-700"
                                alt=""
                              />
                              <div className="absolute inset-0 bg-black/60 group-hover/mini:bg-black/30 transition-colors" />
                              <div className="absolute inset-0 flex items-center justify-center p-8">
                                <span className="text-[clamp(14px,5vw,18px)] font-bold uppercase tracking-[0.4em] text-white text-center opacity-90 group-hover/mini:opacity-100 leading-relaxed drop-shadow-2xl italic">
                                  {pkg.title}
                                </span>
                              </div>
                            </button>
                          ))}
                          {/* Visual Spacer for Horizontal End */}
                          <div className="flex-shrink-0 w-8 md:w-32 h-1" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* DISCOVERY PHASES 02-04: CONTENT ORCHESTRATION */}
              {discoveryPhase > 1 && (
                <div className="absolute inset-0 w-full h-full z-[200] overflow-hidden pointer-events-none">
                  <div className="flex-1 w-full flex flex-col justify-between p-8 md:p-20 lg:p-24 pb-28 md:pb-20 relative z-20 h-full pointer-events-auto">
                    {/* Top Section: Title (Hidden in Phase 04 to avoid duplication) */}
                    <div className={cn(
                      "max-w-4xl space-y-3 px-4 md:px-0 transition-all duration-1000",
                      discoveryPhase === 4 ? "opacity-0 -translate-y-8 pointer-events-none h-0" : "mt-20 md:mt-24"
                    )}>
                      <h3 className="text-[clamp(2.5rem,10vw,6rem)] font-bold tracking-tighter text-white drop-shadow-2xl leading-[0.9] max-w-[90vw] md:max-w-full animate-in fade-in slide-in-from-top-4 duration-700">
                        {internalPackage?.title || "Journey"}
                      </h3>
                      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.6em] text-white/40 drop-shadow-lg leading-relaxed">
                          {internalPackage?.location || "Bespoke"}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section: Discovery Hub (Centered) */}
                    <div className="flex-1 flex flex-col justify-center items-center">
                      <div className="w-full max-w-5xl min-h-[160px] h-auto relative flex items-center justify-center">
                        
                        <div className={cn("absolute inset-0 transition-all duration-700 transform-gpu flex flex-col justify-center", discoveryPhase === 2 ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 -translate-x-8 pointer-events-none")}>
                          <div className="w-full flex justify-center px-6 md:px-0">
                            <div 
                              className={cn(
                                "relative w-full max-w-[280px] sm:max-w-md md:max-w-4xl h-auto md:h-[120px] transition-all duration-700 bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[32px] md:rounded-2xl flex flex-col md:flex-row items-stretch overflow-hidden group/bar shadow-2xl hover:border-white/40",
                                isDurationFixed && "md:max-w-xl"
                              )}
                            >
                              {/* LEFT: DEPARTURE */}
                              <div 
                                onClick={() => startInputRef.current?.showPicker()}
                                className="flex-1 relative flex flex-col items-center justify-center gap-2 py-8 md:py-0 cursor-pointer hover:bg-white/[0.05] active:bg-white/[0.08] transition-all group/arrival border-b md:border-b-0 md:border-r border-white/10 md:border-transparent"
                              >
                                <span className="text-[7px] font-black uppercase tracking-[0.5em] text-white/40 group-hover/arrival:text-white/70 transition-colors">
                                  Departure
                                </span>
                              <div className="flex flex-col items-center">
                                {startDate ? (
                                  <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <span className="text-2xl font-light tracking-tight text-white">
                                      {new Date(startDate).toLocaleDateString('default', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                    {/* Spacer to match Return side's badge rhythm */}
                                    <div className="h-[14px] opacity-0" />
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 group-hover/arrival:text-white/50 transition-colors">
                                    Set Date
                                  </span>
                                )}
                              </div>
                              {/* Selection Indicator */}
                              <div className={cn(
                                "absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-white/60 transition-all duration-700",
                                startDate ? "w-12 opacity-100" : "w-0 opacity-0"
                              )} />

                              <input
                                ref={startInputRef}
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-20"
                              />
                            </div>

                            {/* DIVIDER (HIDDEN ON MOBILE DUE TO BORDER) */}
                            <div className="hidden md:block w-[1px] h-8 my-auto bg-white/20" />

                            {/* RIGHT: RETURN */}
                            <div 
                              onClick={() => !isDurationFixed && endInputRef.current?.showPicker()}
                              className={cn(
                                "flex-1 relative flex flex-col items-center justify-center gap-2 py-8 md:py-0 transition-all group/return",
                                isDurationFixed ? "cursor-default bg-white/[0.02]" : "cursor-pointer hover:bg-white/[0.05] active:bg-white/[0.08]"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[7px] font-black uppercase tracking-[0.5em] transition-colors",
                                  isDurationFixed ? "text-white/20" : "text-white/40 group-hover/return:text-white/70"
                                )}>
                                  Return
                                </span>
                                {isDurationFixed && <Lock size={8} className="text-white/20" />}
                              </div>
                              <div className="flex flex-col items-center">
                                {endDate ? (
                                    <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                      <span className={cn(
                                        "text-2xl font-light tracking-tight transition-colors",
                                        isDurationFixed ? "text-white/30" : "text-white"
                                      )}>
                                        {new Date(endDate).toLocaleDateString('default', { day: '2-digit', month: 'long', year: 'numeric' })}
                                      </span>
                                      
                                      {/* Subtle Duration Badge */}
                                      <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 opacity-60">
                                        <span className="text-[6px] font-black uppercase tracking-widest text-white/40">
                                          {Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate ? startDate : endDate).getTime()) / (1000 * 60 * 60 * 24)))} Nights
                                        </span>
                                        <div className="w-[1px] h-1.5 bg-white/10" />
                                        <span className="text-[6px] font-black uppercase tracking-widest text-white/40">
                                          {Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate ? startDate : endDate).getTime()) / (1000 * 60 * 60 * 24))) + 1} Days
                                        </span>
                                      </div>
                                    </div>
                                ) : (
                                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 group-hover/return:text-white/50 transition-colors">
                                    {isDurationFixed ? "Awaiting Arrival" : "Set Date"}
                                  </span>
                                )}
                              </div>
                              {/* Selection Indicator */}
                              {!isDurationFixed && (
                                <div className={cn(
                                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-white/60 transition-all duration-700",
                                  endDate ? "w-12 opacity-100" : "w-0 opacity-0"
                                )} />
                              )}

                              {!isDurationFixed && (
                                <input
                                  ref={endInputRef}
                                  type="date"
                                  value={endDate}
                                  onChange={(e) => setEndDate(e.target.value)}
                                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-20"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Phase 03: Group */}
                      <div className={cn("absolute inset-0 transition-all duration-700 transform-gpu flex flex-col justify-center", discoveryPhase === 3 ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-8 pointer-events-none")}>
                        <div className="w-full flex justify-center px-6 md:px-0">
                          <div className="relative w-full max-w-[280px] sm:max-w-md md:max-w-4xl h-auto md:h-[120px] transition-all duration-700 bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[32px] md:rounded-2xl flex flex-col md:flex-row items-stretch overflow-hidden group/bar shadow-2xl hover:border-white/40">
                            {[
                              { id: 'adults', label: "Adults", count: adults, set: setAdults, min: 1 },
                              { id: 'kids', label: "Children", count: kids, set: setKids, min: 0 },
                              { id: 'infants', label: "Infants", count: infants, set: setInfants, min: 0 },
                            ].map((t, idx) => (
                              <React.Fragment key={t.id}>
                                <div className="flex-1 relative flex flex-col items-center justify-center gap-2 py-8 md:py-0 group/segment transition-all">
                                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.5em] text-white/40 group-hover/segment:text-white/70 transition-colors">
                                    {t.label}
                                  </span>
                                  <div className="flex items-center gap-6 md:gap-8">
                                    <button
                                      onClick={() => t.set(Math.max(t.min, t.count - 1))}
                                      className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:bg-white hover:text-black hover:border-white transition-all text-xs font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="text-2xl md:text-3xl font-light tracking-tight text-white tabular-nums">
                                      {t.count}
                                    </span>
                                    <button
                                      onClick={() => t.set(t.count + 1)}
                                      className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:bg-white hover:text-black hover:border-white transition-all text-xs font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                {idx < 2 && (
                                  <>
                                    {/* Mobile Divider */}
                                    <div className="block md:hidden h-[1px] w-12 mx-auto bg-white/10" />
                                    {/* Desktop Divider */}
                                    <div className="hidden md:block w-[1px] h-8 my-auto bg-white/20" />
                                  </>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Phase 04: Curation */}
                      <div className={cn("absolute inset-0 transition-all duration-700 transform-gpu flex flex-col justify-center", discoveryPhase === 4 ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-8 pointer-events-none")}>
                          <div className="w-full flex flex-col items-center gap-10 px-6 md:px-0 mt-32 md:mt-24">
                            
                            {/* Phase 04 Destination Title & Location (Sovereign Style - Synchronized with Global Color) */}
                            <div className="text-center space-y-1 animate-in fade-in slide-in-from-top-2 duration-1000">
                              <h2 className="text-[1.5rem] md:text-[2.2rem] font-black tracking-[1.2em] text-white drop-shadow-2xl uppercase leading-none pl-[1.2em]">
                                {internalPackage?.title || "Journey"}
                              </h2>
                              <div className="flex items-center justify-center gap-4 pt-1">
                                <div className="w-12 h-[1px] bg-white/10" />
                                <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.8em] text-white/40 pl-[0.8em]">
                                  {internalPackage?.location || "Bespoke"}
                                </span>
                                <div className="w-12 h-[1px] bg-white/10" />
                              </div>
                            </div>

                            <div className="relative w-full max-w-[280px] sm:max-w-md md:max-w-5xl transition-all duration-700 bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[32px] md:rounded-2xl flex flex-col shadow-2xl hover:border-white/40 overflow-visible group/instrument">
                            
                              {/* Scrollable Protocol Area */}
                              <div 
                                ref={curationScrollRef}
                                onScroll={handleCurationScroll}
                                className="w-full max-h-[400px] md:max-h-[500px] overflow-y-auto scrollbar-hide p-6 md:p-10 space-y-12"
                              >
                                
                                {/* Section 1: Primary Identification */}
                                <div className="space-y-10">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                                      Lead Traveler
                                    </span>
                                    <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">
                                      Step 04 / 04
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 items-start">
                                    <div className="space-y-4 group/id">
                                      <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 group-hover/id:text-white/80 transition-colors">
                                        Full Name
                                      </span>
                                      <div className="h-10 flex items-end pb-1 border-b border-white/20 focus-within:border-white/50 transition-all">
                                        <input
                                          type="text"
                                          value={customerName}
                                          onChange={(e) => setCustomerName(e.target.value)}
                                          placeholder="Enter your name"
                                          className="w-full bg-transparent text-sm md:text-base font-light text-white placeholder:text-white/30 focus:outline-none transition-all"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-4 group/contact">
                                      <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 group-hover/contact:text-white/80 transition-colors">
                                        Contact Information
                                      </span>
                                      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-end">
                                        <div className="flex-1 h-10 flex items-end pb-1 border-b border-white/20 focus-within:border-white/50 transition-all w-full">
                                          <input
                                            type="email"
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder="Email address"
                                            className="w-full bg-transparent text-sm md:text-base font-light text-white placeholder:text-white/30 focus:outline-none transition-all"
                                          />
                                        </div>
                                        
                                        {/* Contact Number with Country Selector */}
                                        <div className="flex-1 flex items-center gap-3 h-10 border-b border-white/20 group/phone focus-within:border-white/50 transition-all relative w-full">
                                          <div className="relative mb-1">
                                            <div 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCountryMenuOpen(!countryMenuOpen);
                                              }}
                                              className="flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-white/10 rounded-lg transition-all active:scale-95 bg-white/5"
                                            >
                                              <span className="text-xs">{selectedCountry.flag}</span>
                                              <span className="text-[10px] md:text-xs font-bold text-white/60 group-focus-within/phone:text-white/90">{selectedCountry.code}</span>
                                            </div>
                                            {countryMenuOpen && (
                                              <div className="absolute top-full left-0 mt-2 w-48 max-h-40 overflow-y-auto bg-[#121214] backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-[150] animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 scrollbar-none">
                                                {[
                                                  { flag: "🇮🇳", code: "+91", name: "India", length: 10 },
                                                  { flag: "🇺🇸", code: "+1", name: "USA", length: 10 },
                                                  { flag: "🇬🇧", code: "+44", name: "UK", length: 10 },
                                                  { flag: "🇦🇪", code: "+971", name: "UAE", length: 9 },
                                                  { flag: "🇸🇬", code: "+65", name: "Singapore", length: 8 },
                                                  { flag: "🇦🇺", code: "+61", name: "Australia", length: 9 },
                                                ].map((c) => (
                                                  <div key={c.name} onClick={() => { setSelectedCountry(c); setCustomerPhone(""); setCountryMenuOpen(false); }} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/10 cursor-pointer transition-colors group/item">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-xs">{c.flag}</span>
                                                      <span className="text-[10px] font-bold text-white/70 group-hover/item:text-white">{c.name}</span>
                                                    </div>
                                                    <span className="text-[9px] font-black text-white/30 group-hover/item:text-white/50">{c.code}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          <input
                                            type="tel"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ""))}
                                            maxLength={selectedCountry.length}
                                            placeholder="Phone number"
                                            onFocus={() => setCountryMenuOpen(false)}
                                            className="flex-1 bg-transparent mb-1 text-sm md:text-base font-light text-white placeholder:text-white/30 focus:outline-none transition-all"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 2: Group Manifesto (If > 1 Guest) */}
                                {(adults > 1 || kids > 0) && (
                                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                                        Travelers
                                      </span>
                                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                                        {adults} ADULTS • {kids} CHILDREN
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 md:gap-x-16 gap-y-12">
                                      {/* Additional Adults */}
                                      {Array.from({ length: adults - 1 }).map((_, i) => (
                                        <div key={`adult-${i}`} className="space-y-4 group/guest animate-in fade-in zoom-in-95 duration-500">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] text-white/40 group-hover/guest:text-white/70 transition-colors">
                                              Guest {i + 2} <span className="text-[7px] text-white/20 pl-1">(Adult)</span>
                                            </span>
                                          </div>
                                          <div className="border-b border-white/10 pb-2 focus-within:border-white/40 transition-all">
                                            <input
                                              type="text"
                                              placeholder="Full name"
                                              value={additionalGuests[i]?.name || ""}
                                              onChange={(e) => {
                                                const next = [...additionalGuests];
                                                if (next[i]) next[i].name = e.target.value;
                                                setAdditionalGuests(next);
                                              }}
                                              className="w-full bg-transparent text-xs md:text-sm font-light text-white placeholder:text-white/20 focus:outline-none transition-all"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                      
                                      {/* Children */}
                                      {Array.from({ length: kids }).map((_, i) => {
                                        const guestIdx = (adults - 1) + i;
                                        return (
                                          <div key={`child-${i}`} className="space-y-4 group/guest animate-in fade-in zoom-in-95 duration-500">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] text-white/40 group-hover/guest:text-white/70 transition-colors">
                                                Guest {adults + i + 1} <span className="text-[7px] text-white/20 pl-1">(Child)</span>
                                              </span>
                                            </div>
                                            <div className="flex gap-4 border-b border-white/10 pb-2 focus-within:border-white/40 transition-all">
                                              <input
                                                type="text"
                                                placeholder="Full name"
                                                value={additionalGuests[guestIdx]?.name || ""}
                                                onChange={(e) => {
                                                  const next = [...additionalGuests];
                                                  if (next[guestIdx]) next[guestIdx].name = e.target.value;
                                                  setAdditionalGuests(next);
                                                }}
                                                className="flex-[2] bg-transparent text-xs md:text-sm font-light text-white placeholder:text-white/20 focus:outline-none transition-all"
                                              />
                                              <div className="w-[1px] h-3 bg-white/10 my-auto" />
                                              <input
                                                type="text"
                                                placeholder="Age"
                                                value={additionalGuests[guestIdx]?.age || ""}
                                                onChange={(e) => {
                                                  const next = [...additionalGuests];
                                                  if (next[guestIdx]) next[guestIdx].age = e.target.value;
                                                  setAdditionalGuests(next);
                                                }}
                                                className="w-10 bg-transparent text-xs md:text-sm font-light text-white placeholder:text-white/20 focus:outline-none transition-all text-center"
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Section 3: Protocol Refinements */}
                                <div className="space-y-6 group/notes pb-32">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                                      Special Requests <span className="text-[8px] md:text-[10px] opacity-40 ml-1">(Optional)</span>
                                    </span>
                                  </div>
                                  <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any special desire? Tell us!"
                                    className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-xs md:text-sm font-light tracking-wide text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all resize-none scrollbar-none shadow-inner"
                                  />
                                </div>
                              </div>

                              {/* Sovereign Scroll Indicator (Smooth Ease Fade) */}
                              <div className={cn(
                                "absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-[130] transition-all duration-700 cubic-bezier(0.23,1,0.32,1)",
                                (showScrollIndicator && discoveryPhase === 4) 
                                  ? "opacity-100 translate-y-0" 
                                  : "opacity-0 translate-y-4"
                              )}>
                                <span className="text-[8px] md:text-[9px] font-black tracking-[0.4em] text-white/70 uppercase pl-[0.4em] animate-pulse drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]">
                                  Scroll
                                </span>
                                <div className="relative flex items-center justify-center">
                                  <ChevronDown size={14} strokeWidth={3} className="text-white/60 animate-bounce relative z-10" />
                                  <div className="absolute w-6 h-6 bg-white/20 blur-xl rounded-full animate-pulse opacity-40" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div 
              onScroll={handleScroll}
              className="w-full h-full relative z-[210] flex flex-col items-center justify-start md:justify-center p-[clamp(1rem,4vh,2.5rem)] pt-[clamp(4rem,12vh,6rem)] pb-40 md:py-[clamp(1rem,4vh,2.5rem)] overflow-y-auto scrollbar-hide animate-in fade-in duration-1000 transform-gpu"
            >
              <div className="w-full max-w-5xl space-y-[clamp(1.5rem,4vh,3rem)] flex flex-col items-center shrink-0">
                
                {/* Unified Title Segment */}
                <div className="text-center space-y-1 md:space-y-3 shrink-0">
                  <h3 className="text-[clamp(1.2rem,5vw,2.5rem)] font-bold tracking-tighter text-white/90 uppercase drop-shadow-2xl leading-none">
                    Review Your Journey
                  </h3>
                  <p className="text-[clamp(7px,1vw,9px)] font-black uppercase tracking-[0.6em] text-white/40 italic pl-[0.6em]">
                    Final verification before secure transmission
                  </p>
                </div>

                {/* Primary Manifest Instrument (Unified Horizontal Logic) */}
                <div className="relative w-full max-w-4xl h-auto transition-all duration-700 bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[28px] md:rounded-2xl flex flex-col md:flex-row items-stretch overflow-hidden shadow-2xl hover:border-white/40 group/manifest">
                  {/* Segment 1: Lead Traveler */}
                  <div className="flex-1 relative flex flex-col items-center justify-center gap-1.5 py-4 md:py-8 border-b md:border-b-0 md:border-r border-white/10 px-6">
                    <span className="text-[7px] font-black uppercase tracking-[0.5em] text-white/60">
                      Lead Traveler
                    </span>
                    <div className="flex flex-col items-center text-center space-y-0.5">
                      <span className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">{customerName}</span>
                      <div className="flex flex-col gap-0">
                        <span className="text-[9px] md:text-[10px] font-medium text-white/80 uppercase tracking-widest">{customerEmail}</span>
                        <span className="text-[9px] md:text-[10px] font-medium text-white/80 uppercase tracking-widest">{selectedCountry.code} {customerPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Segment 2: Destination */}
                  <div className="flex-1 relative flex flex-col items-center justify-center gap-1.5 py-4 md:py-8 border-b md:border-b-0 md:border-r border-white/10 px-6">
                    <span className="text-[7px] font-black uppercase tracking-[0.5em] text-white/60">
                      Destination
                    </span>
                    <div className="flex flex-col items-center text-center space-y-0.5">
                      <span className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">{internalPackage?.title || destination}</span>
                      <div className="flex flex-col gap-0">
                        <span className="text-[9px] md:text-[10px] font-medium text-white/80 uppercase tracking-widest">{internalPackage?.location || destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Segment 3: Travel Dates */}
                  <div className="flex-1 relative flex flex-col items-center justify-center gap-1.5 py-4 md:py-8 border-b md:border-b-0 md:border-r border-white/10 px-6">
                    <span className="text-[7px] font-black uppercase tracking-[0.5em] text-white/60">
                      Travel Dates
                    </span>
                    <div className="flex flex-col items-center text-center space-y-1.5 md:space-y-2">
                      <div className="flex flex-col items-center">
                        <span className="text-xs md:text-sm font-bold text-white tracking-tight leading-tight">
                          {formatDateForDisplay(startDate)} — {formatDateForDisplay(endDate)}
                        </span>
                        <span className="text-[9px] md:text-[10px] font-medium text-white/80 uppercase tracking-widest">
                          {Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))} Nights / {Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} Days
                        </span>
                      </div>
                      <div className="flex items-center justify-center px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/15 shadow-sm">
                        <span className="text-[9px] font-bold text-white/70 uppercase tracking-[0.2em] leading-none text-center">
                          {adults} {adults > 1 ? "ADULTS" : "ADULT"} {kids > 0 && `• ${kids} ${kids > 1 ? "CHILDREN" : "CHILD"}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Segment 4: Itinerary Cost */}
                  <div className="flex-1 relative flex flex-col items-center justify-center gap-1.5 py-4 md:py-8 px-6 bg-white/[0.03]">
                    <span className="text-[7px] font-black uppercase tracking-[0.5em] text-white/60">
                      Itinerary Cost
                    </span>
                    <div className="flex flex-col items-center text-center space-y-0.5">
                      <span className="text-2xl md:text-3xl font-bold text-white tabular-nums tracking-tighter leading-none">{totalInvestment}</span>
                      <div className="flex flex-col gap-0">
                        <span className="text-[8px] font-bold text-white/60 uppercase tracking-[0.3em]">
                          {pricing.isTaxApplied ? "Inclusive of Taxes" : "Excluding Taxes"}
                        </span>
                        {pricing.isTaxApplied && (
                          <div className="flex flex-col gap-0.5 mt-1.5">
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-[0.15em] leading-none">Base: {pricing.symbol}{pricing.baseTotal.toLocaleString()}</span>
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-[0.15em] leading-none">Tax ({pricing.activeTaxRate}%): {pricing.symbol}{pricing.taxAmount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Manifesto Area (Guest List & Notes) */}
                <div className={cn(
                  "w-full max-w-4xl gap-8 items-start",
                  additionalGuests.filter(g => g.name).length > 0 && notes ? "grid grid-cols-1 md:grid-cols-2" : "flex flex-col items-center"
                )}>
                  {/* Guest Manifesto List - Only shown if additional guests exist */}
                  {additionalGuests.filter(g => g.name).length > 0 && (
                    <div className="space-y-4 w-full">
                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30 pl-4">
                        Guest Manifesto
                      </span>
                      <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto scrollbar-hide pr-2">
                        {additionalGuests.filter(g => g.name).map((guest, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <span className="text-[9px] font-medium text-white/40 uppercase tracking-widest">
                              Guest {i + 2} {guest.type === 'child' ? `(Child${guest.age ? `, ${guest.age}y` : ''})` : '(Adult)'}
                            </span>
                            <span className="text-xs font-bold text-white/80">{guest.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Requests Section */}
                  {notes && (
                    <div className={cn("space-y-4", additionalGuests.filter(g => g.name).length === 0 ? "w-full max-w-2xl" : "w-full")}>
                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30 pl-4">
                        Special Requests
                      </span>
                      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 h-fit">
                        <p className="text-xs font-light text-white/60 leading-relaxed italic border-l border-white/20 pl-4 py-1">
                          "{notes}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center space-y-12 animate-in zoom-in-95 duration-1000">
              <div className="w-20 h-20 rounded-full bg-[#f5f5f7] text-black flex items-center justify-center shadow-2xl">
                <Check size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-5xl font-bold tracking-tight text-white/90 uppercase">
                  Established
                </h3>
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80 pl-[0.4em]">
                    Reference ID: TRX-{bookingId?.split("-")[0].toUpperCase()}
                  </p>
                  <div className="h-[1px] w-12 bg-white/20" />
                </div>
              </div>
              <button
                onClick={startClosing}
                className="px-20 py-5 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white/90 hover:bg-[#f5f5f7] hover:text-black transition-all shadow-lg"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. PROGRESSIVE BOTTOM MASK (MIRRORED iOS STYLE) */}
      {step === 1 && discoveryPhase > 1 && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 md:h-48 transition-all duration-1000 backdrop-blur-sm z-[110] transform-gpu will-change-[opacity,backdrop-filter] animate-in fade-in duration-1000"
          style={{
            opacity: 0.95,
            background:
              "linear-gradient(to top, #0a0a0b 0%, #0a0a0b 40%, rgba(10,10,11,0.8) 65%, rgba(10,10,11,0) 100%)",
            maskImage:
              "linear-gradient(to top, black 0%, black 40%, rgba(0,0,0,0.8) 70%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, black 40%, rgba(0,0,0,0.8) 70%, transparent 100%)",
          }}
        />
      )}

      {/* 5. PRECISION PILL MANIFEST (DYNAMIC ISLAND) */}
      {((step === 1 && discoveryPhase > 1) || step === 2) && (
        <div className="absolute bottom-4 md:bottom-0 left-0 right-0 p-6 md:p-10 z-[120] pointer-events-none flex justify-center animate-in slide-in-from-bottom-12 duration-[1.2s] cubic-bezier(0.23,1,0.32,1)">
          <div className={cn(
            "w-full flex items-center bg-white/[0.08] backdrop-blur-3xl border border-white/[0.12] p-2.5 px-6 md:p-4 rounded-full pointer-events-auto shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)] group/pill transition-all duration-[1000ms] cubic-bezier(0.23,1,0.32,1)",
            discoveryPhase >= 3 || step === 2 ? "max-w-screen-lg md:px-10" :
            discoveryPhase === 2 ? "max-w-3xl md:px-10" : "max-w-xl md:px-6"
          )}>
            {/* Expansive Horizontal Layout with Morphing Logic */}
            <div className="flex flex-1 items-center justify-between gap-4 md:gap-6">
              
              {/* Segment 1: Itinerary Cost (Always Visible) */}
              <div className="flex flex-col space-y-1.5 items-start min-w-fit pl-2">
                <span className="text-[6px] md:text-[7px] font-black uppercase tracking-[0.4em] text-white/40 group-hover/pill:text-white/60 transition-colors whitespace-nowrap">
                  Itinerary Cost
                </span>
                <div className="flex items-center gap-3">
                  <p className="text-[clamp(1.1rem,2.5vw,1.6rem)] font-bold tracking-tight text-white/90 leading-none tabular-nums whitespace-nowrap">
                    {totalInvestment}
                  </p>
                  <div className="px-1.5 py-0.5 rounded-[4px] bg-white/[0.03] border border-white/10 flex items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
                    <span className="text-[5px] md:text-[6px] font-black uppercase tracking-[0.2em] text-white/30 whitespace-nowrap">
                      {pricing.isTaxApplied ? "Incl. Tax" : "Excl. Tax"}
                    </span>
                  </div>
                </div>
              </div>

              {discoveryPhase > 2 && <div className="hidden md:block w-[1px] h-8 bg-white/[0.12] shrink-0 animate-in fade-in duration-1000" />}

              {/* Segment 2: Dynamic Guest Manifest (Phase 03/04 Transition) */}
              {discoveryPhase > 2 && (
                <div className={cn(
                  "hidden md:flex flex-col space-y-1 items-center min-w-fit transition-all duration-1000 animate-in fade-in slide-in-from-bottom-2 px-4",
                  discoveryPhase === 3 ? "opacity-60 scale-95" : "opacity-100 scale-100"
                )}>
                  <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/40 whitespace-nowrap">
                    {Number(adults) + Number(kids) === 1 ? "Guest" : "Guests"} Manifest
                  </span>
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <span className="text-[11px] md:text-[12px] font-bold text-white/80 tracking-tight leading-none uppercase">
                      {adults} {Number(adults) === 1 ? "Adult" : "Adults"}
                    </span>
                    {Number(kids) > 0 && (
                      <>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <span className="text-[11px] md:text-[12px] font-bold text-white/80 tracking-tight leading-none uppercase">
                          {kids} {Number(kids) === 1 ? "Child" : "Kids"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="hidden md:block w-[1px] h-8 bg-white/[0.12] shrink-0" />

              {/* Segment 3: Travel Dates (Contextual Reveal) */}
              <div className={cn(
                "hidden md:flex flex-col space-y-1 items-center min-w-fit px-4 transition-all duration-700",
                discoveryPhase === 2 ? "flex-shrink" : "flex-1"
              )}>
                <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/40 group-hover/pill:text-white/60 transition-colors whitespace-nowrap">
                  Travel Dates
                </span>
                {startDate && endDate && (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-4 whitespace-nowrap">
                      <span className="text-[11px] md:text-[12px] font-bold text-white/90 uppercase tracking-tighter tabular-nums">
                        {formatDateForDisplay(startDate)}
                      </span>
                      <div className="w-4 h-[1px] bg-white/20" />
                      <span className="text-[11px] md:text-[12px] font-bold text-white/90 uppercase tracking-tighter tabular-nums">
                        {formatDateForDisplay(endDate)}
                      </span>
                    </div>
                    {discoveryPhase > 2 && (
                      <div className="flex items-center gap-1 bg-white/[0.05] border border-white/10 px-2.5 py-0.5 rounded-full animate-in zoom-in-95 duration-700">
                        <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" />
                        <span className="text-[6px] font-black uppercase tracking-[0.2em] text-white/60 pl-0.5 whitespace-nowrap">
                          {Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))} Nights / {Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} Days
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile-Only Unified Readout */}
              <div className="flex md:hidden flex-col gap-1.5 animate-in fade-in slide-in-from-left-2 duration-700">
                {startDate && endDate && (
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-tighter">
                      {formatDateForDisplay(startDate)}
                    </span>
                    <ArrowRight size={8} className="text-white/20" />
                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-tighter">
                      {formatDateForDisplay(endDate)}
                    </span>
                  </div>
                )}
                {discoveryPhase > 3 && (
                  <div className="flex items-center gap-2 bg-white/[0.05] px-2 py-0.5 rounded-full w-fit">
                    <div className="w-0.5 h-0.5 rounded-full bg-white/40 animate-pulse" />
                    <span className="text-[6px] font-black uppercase tracking-[0.2em] text-white/60">
                      {adults}A {kids > 0 ? `• ${kids}C` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Action Button Area */}
              <div className="flex items-center justify-end pl-2 md:pl-8 border-l border-white/10 ml-2 md:ml-6 shrink-0 pr-2">
                {discoveryPhase > 1 && (
                  <Magnetic>
                    <button
                      onClick={() => {
                        if (!isPhaseValid || isSubmitting) return;
                        if (step === 2) {
                          submitBooking();
                        } else if (discoveryPhase === 4) {
                          setStep(2);
                        } else {
                          nextPhase();
                        }
                      }}
                      disabled={isSubmitting || !isPhaseValid}
                      className={cn(
                        "group/btn relative overflow-hidden h-10 md:h-14 rounded-full transition-all duration-700 active:scale-95",
                        isPhaseValid 
                          ? "bg-white text-black shadow-[0_15px_40px_-10px_rgba(255,255,255,0.4)] hover:shadow-[0_20px_50px_-10px_rgba(255,255,255,0.5)] opacity-100" 
                          : "bg-white/10 text-white/20 cursor-not-allowed border border-white/5 opacity-50",
                        discoveryPhase === 2 ? "px-6 md:px-8" : 
                        discoveryPhase === 3 ? "px-7 md:px-10" : "px-8 md:px-12"
                      )}
                    >
                      <div className="relative z-10 flex items-center gap-2.5">
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap animate-in fade-in duration-700">
                          {step === 2 ? (isSubmitting ? "Sending Request" : "Confirm & Send") : 
                           discoveryPhase === 4 ? "Review Booking" : 
                           discoveryPhase === 3 ? "Continue" : "Next"}
                        </span>
                        <ChevronRight 
                          size={14} 
                          strokeWidth={3} 
                          className="text-black group-hover/btn:translate-x-1 transition-transform shrink-0" 
                        />
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                  </Magnetic>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
