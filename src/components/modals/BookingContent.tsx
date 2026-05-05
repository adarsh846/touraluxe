"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import {
  Search,
  Calendar,
  Users,
  Check,
  ArrowLeft,
  ChevronRight,
  Plane,
  Command,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBooking } from "../BookingProvider";
import { supabase } from "@/lib/supabase";
import { useDiscovery } from "@/hooks/useDiscovery";

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
      if (discoveryPhase > (packageData ? 2 : 1)) {
        prevPhase();
        return true;
      }
      if (step === 2) {
        setStep(1);
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
    const timer = setTimeout(() => {
      search(destination);
    }, 150);
    return () => clearTimeout(timer);
  }, [destination, search]);

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
  const totalInvestment = React.useMemo(() => {
    const pkg = internalPackage || packageData;
    if (!pkg?.price) return "Quote on Request";
    const symbol = pkg.currency || "₹";
    const base = parseInt(pkg.price.replace(/[^0-9]/g, "")) || 0;
    const child = pkg.child_price
      ? parseInt(pkg.child_price.replace(/[^0-9]/g, ""))
      : 0;
    const infant = pkg.infant_price
      ? parseInt(pkg.infant_price.replace(/[^0-9]/g, ""))
      : 0;
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
    customerName.length > 2 && customerEmail.includes("@"),
  );

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
                            Consult Elite Concierge
                          </button>

                          <button
                            onClick={() => {
                              setDestination("");
                              clearSearch();
                            }}
                            className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors border-b border-white/10 pb-1"
                          >
                            Try another destiny
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
                      <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 drop-shadow-lg">
                        {internalPackage?.location || "Bespoke Experience"}
                      </span>
                      <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-2xl">
                        {internalPackage?.title || "Personalized Journey"}
                      </h3>
                    </div>
                  </div>

                  <div className="relative z-10 px-6 md:px-16 pb-40 -mt-10 bg-[#0a0a0b] rounded-t-[48px] flex flex-col items-center border-t border-white/[0.05]">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full my-8" />

                    <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      <div className="text-center space-y-4">
                        <div className="text-[7px] font-black uppercase tracking-[0.5em] text-white/60">
                          Phase 02 — Temporal Window
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight text-white/90">
                          Timeline Selection
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-10 rounded-[48px] bg-white/[0.04] border border-white/[0.1] space-y-5">
                          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">
                            Arrival Protocol
                          </span>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-transparent text-3xl font-bold focus:outline-none [color-scheme:dark] text-white/90"
                          />
                        </div>
                        <div
                          className={cn(
                            "p-10 rounded-[48px] bg-white/[0.04] border border-white/[0.1] space-y-5 transition-all duration-500",
                            isDurationFixed ? "opacity-80" : "opacity-100",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">
                              {isDurationFixed
                                ? "Return Protocol (Locked)"
                                : "Return Protocol"}
                            </span>
                            {isDurationFixed && (
                              <div className="text-[7px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                                {internalPackage.duration}
                              </div>
                            )}
                          </div>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) =>
                              !isDurationFixed && setEndDate(e.target.value)
                            }
                            readOnly={isDurationFixed}
                            className={cn(
                              "w-full bg-transparent text-3xl font-bold focus:outline-none [color-scheme:dark] text-white/90",
                              isDurationFixed
                                ? "cursor-not-allowed"
                                : "cursor-pointer",
                            )}
                          />
                        </div>
                      </div>
                      <button
                        onClick={nextPhase}
                        disabled={!startDate || !endDate}
                        className="w-full py-6 bg-white text-black rounded-[24px] font-bold uppercase tracking-widest text-[10px] shadow-2xl disabled:opacity-10 transition-all"
                      >
                        Establish Window
                      </button>
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
                      <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 drop-shadow-lg">
                        {internalPackage?.location || "Bespoke Experience"}
                      </span>
                      <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-2xl">
                        {internalPackage?.title || "Personalized Journey"}
                      </h3>
                    </div>
                  </div>

                  <div className="relative z-10 px-6 md:px-16 pb-40 -mt-10 bg-[#0a0a0b] rounded-t-[48px] flex flex-col items-center border-t border-white/[0.05]">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full my-8" />

                    <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      <div className="text-center space-y-4">
                        <div className="text-[7px] font-black uppercase tracking-[0.5em] text-white/60">
                          Phase 03 — Group Manifest
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight text-white/90">
                          Group Composition
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          {
                            label: "Adults",
                            count: adults,
                            set: setAdults,
                            min: 1,
                          },
                          {
                            label: "Children",
                            count: kids,
                            set: setKids,
                            min: 0,
                          },
                          {
                            label: "Infants",
                            count: infants,
                            set: setInfants,
                            min: 0,
                          },
                        ].map((t) => (
                          <div
                            key={t.label}
                            className="p-10 rounded-[56px] bg-white/[0.02] border border-white/[0.05] text-center space-y-8"
                          >
                            <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/60 block">
                              {t.label}
                            </span>
                            <div className="flex items-center justify-between bg-black/40 p-2 rounded-2xl border border-white/[0.05]">
                              <button
                                onClick={() =>
                                  t.set(Math.max(t.min, t.count - 1))
                                }
                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#f5f5f7] hover:text-black transition-all font-bold text-lg"
                              >
                                -
                              </button>
                              <span className="text-4xl font-bold italic text-white/90">
                                {t.count}
                              </span>
                              <button
                                onClick={() => t.set(t.count + 1)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#f5f5f7] hover:text-black transition-all font-bold text-lg"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={nextPhase}
                        className="w-full py-6 bg-white text-black rounded-[24px] font-bold uppercase tracking-widest text-[10px] shadow-2xl transition-all"
                      >
                        Confirm Manifest
                      </button>
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
                      <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 drop-shadow-lg">
                        {internalPackage?.location || "Bespoke Experience"}
                      </span>
                      <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-2xl">
                        {internalPackage?.title || "Personalized Journey"}
                      </h3>
                    </div>
                  </div>

                  <div className="relative z-10 px-6 md:px-16 pb-40 -mt-10 bg-[#0a0a0b] rounded-t-[48px] flex flex-col items-center border-t border-white/[0.05]">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full my-8" />

                    <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      <div className="text-center space-y-4">
                        <div className="text-[7px] font-black uppercase tracking-[0.5em] text-white/60">
                          Phase 04 — Final Verification
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight text-white/90">
                          Curation Details
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">
                              Primary Guest
                            </span>
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.08] p-6 rounded-[28px] text-lg font-semibold focus:border-white/20 transition-all text-white/90"
                              placeholder="Full Name"
                            />
                          </div>
                          <div className="space-y-3">
                            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">
                              Contact Email
                            </span>
                            <input
                              type="email"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.08] p-6 rounded-[28px] text-lg font-semibold focus:border-white/20 transition-all text-white/90"
                              placeholder="name@domain.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">
                            Special Requests
                          </span>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full h-full min-h-[160px] bg-white/[0.03] border border-white/[0.08] p-6 rounded-[32px] text-lg font-medium focus:border-white/20 transition-all resize-none text-white/90"
                            placeholder="Type custom requests..."
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => (canSubmit ? setStep(2) : null)}
                        className="w-full py-6 bg-white text-black rounded-[24px] font-bold uppercase tracking-widest text-[10px] transition-all shadow-2xl disabled:opacity-10"
                        disabled={!canSubmit}
                      >
                        Generate Protocol
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="w-full max-w-2xl space-y-12 animate-in zoom-in-95 duration-1000">
              <div className="text-center space-y-4">
                <h3 className="text-3xl font-bold tracking-tight text-white/90 uppercase">
                  Protocol Verification
                </h3>
                <p className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/60 italic">
                  TRX-SECURE TRANSMISSION
                </p>
              </div>
              <div className="p-12 rounded-[56px] bg-white/[0.01] border border-white/[0.05] space-y-12 backdrop-blur-3xl shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-sm font-medium">
                  <div className="space-y-2">
                    <span className="text-[7px] font-bold uppercase text-white/60 tracking-widest">
                      Guest
                    </span>
                    <p className="text-lg text-white/90">{customerName}</p>
                  </div>
                  <div className="space-y-2 md:text-right">
                    <span className="text-[7px] font-bold uppercase text-white/60 tracking-widest">
                      Horizon
                    </span>
                    <p className="text-lg text-white/90">
                      {internalPackage?.title || destination}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[7px] font-bold uppercase text-white/60 tracking-widest">
                      Dates
                    </span>
                    <p className="text-lg text-white/90">
                      {formatDateForDisplay(startDate)} —{" "}
                      {formatDateForDisplay(endDate)}
                    </p>
                  </div>
                  <div className="space-y-2 md:text-right">
                    <span className="text-[7px] font-bold uppercase text-white/60 tracking-widest">
                      Itinerary Cost
                    </span>
                    <p className="text-3xl font-bold font-mono text-white/90">
                      {totalInvestment}
                    </p>
                  </div>
                </div>
                <button
                  onClick={submitBooking}
                  disabled={isSubmitting}
                  className="w-full py-6 bg-[#f5f5f7] text-black rounded-[28px] font-bold uppercase tracking-widest text-[10px] shadow-2xl transition-all"
                >
                  {isSubmitting ? "Transmitting..." : "Activate Protocol"}
                </button>
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
                <p className="text-[9px] font-bold uppercase tracking-[0.6em] text-white/30 italic">
                  Reference TRX-{bookingId?.split("-")[0].toUpperCase()}
                </p>
              </div>
              <button
                onClick={startClosing}
                className="px-16 py-5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/50 hover:bg-[#f5f5f7] hover:text-black transition-all"
              >
                Close Consultation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. PRECISION PILL MANIFEST (PINNED) */}
      {step === 1 && discoveryPhase > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-10 z-[120] pointer-events-none flex justify-center animate-in slide-in-from-bottom-12 duration-[1.2s] cubic-bezier(0.23,1,0.32,1)">
          <div className="w-full max-w-4xl flex items-center justify-between bg-white/[0.04] backdrop-blur-3xl border border-white/[0.08] p-4 px-12 rounded-full pointer-events-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] group/pill transition-all duration-700">
            <div className="flex items-center gap-12">
              <div className="space-y-1">
                <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/40 group-hover/pill:text-white/60 transition-colors">
                  Itinerary Cost
                </span>
                <p className="text-2xl font-bold tracking-tight text-white/90 leading-none">
                  {totalInvestment}
                </p>
              </div>
              <div className="w-[1px] h-8 bg-white/[0.1] hidden md:block" />
              <div className="hidden lg:flex flex-col space-y-1">
                <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/40 group-hover/pill:text-white/60 transition-colors">
                  Travel Dates
                </span>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-tighter">
                  {startDate ? (
                    <span className="flex items-center gap-2">
                      {formatDateForDisplay(startDate)}{" "}
                      <ArrowRight size={10} className="text-white/20" />{" "}
                      {formatDateForDisplay(endDate)}
                    </span>
                  ) : (
                    "Awaiting Window"
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {discoveryPhase > 1 && (
                <button
                  onClick={nextPhase}
                  className="px-12 py-4 bg-white text-black rounded-full font-black uppercase tracking-[0.2em] text-[9px] hover:bg-[#f5f5f7] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  Continue
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
