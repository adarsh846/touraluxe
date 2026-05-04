"use client";

import React, { useEffect, useRef, useState, memo, useCallback } from "react";
import gsap from "gsap";
import Image from "next/image";
import { X, Calendar, Users, CreditCard, ChevronRight, CheckCircle2, AlertCircle, Plane, Map, ShieldCheck, ArrowLeft } from "lucide-react";
import { Magnetic } from "../Magnetic";

import { useBooking } from "../BookingProvider";

export const BookingContent = memo(function BookingContent({ 
  data: packageData, 
  isActive, 
  source: bookingSource, 
  onScroll, 
  startClosing,
  setInternalCanGoBack,
  registerBackHandler
}: { 
  data: any, 
  isActive: boolean, 
  source: string, 
  onScroll: (scrolled: boolean) => void, 
  startClosing: () => void,
  setInternalCanGoBack?: (can: boolean) => void,
  registerBackHandler?: (handler: (() => boolean) | null) => void
}) {
  const { setError } = useBooking();
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    if (!dateStr.includes("-")) return dateStr;
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };


  
  const isHoneymoon = bookingSource?.includes("HONEYMOON");

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Form State
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  // Country Selector State
  const COUNTRIES = [
    { name: "United States", code: "US", dial: "+1", flag: "🇺🇸", len: 10 },
    { name: "United Kingdom", code: "GB", dial: "+44", flag: "🇬🇧", len: 10 },
    { name: "India", code: "IN", dial: "+91", flag: "🇮🇳", len: 10 },
    { name: "United Arab Emirates", code: "AE", dial: "+971", flag: "🇦🇪", len: 9 },
    { name: "Australia", code: "AU", dial: "+61", flag: "🇦🇺", len: 9 },
    { name: "France", code: "FR", dial: "+33", flag: "🇫🇷", len: 9 },
    { name: "Germany", code: "DE", dial: "+49", flag: "🇩🇪", len: 11 },
    { name: "Japan", code: "JP", dial: "+81", flag: "🇯🇵", len: 10 },
    { name: "Singapore", code: "SG", dial: "+65", flag: "🇸🇬", len: 8 },
    { name: "Canada", code: "CA", dial: "+1", flag: "🇨🇦", len: 10 },
    { name: "Switzerland", code: "CH", dial: "+41", flag: "🇨🇭", len: 9 },
    { name: "Maldives", code: "MV", dial: "+960", flag: "🇲🇻", len: 7 },
    { name: "Indonesia", code: "ID", dial: "+62", flag: "🇮🇩", len: 11 },
    { name: "Thailand", code: "TH", dial: "+66", flag: "🇹🇭", len: 9 },
    { name: "Italy", code: "IT", dial: "+39", flag: "🇮🇹", len: 10 },
    { name: "Spain", code: "ES", dial: "+34", flag: "🇪🇸", len: 9 },
  ];

  const hasFixedDuration = Boolean(packageData?.duration && packageData?.duration?.match(/\d+\s*Night/i));

  useEffect(() => {
    if (isActive) {
      setStep(1);
      setError(null);
      setIsSubmitting(false);
      setBookingId(null);
    }
  }, [packageData?.id, bookingSource, isActive]);

  useEffect(() => {
    if (startDate && packageData?.duration) {
      const nightsMatch = packageData?.duration?.match(/(\d+)\s*Night/i);
      if (nightsMatch) {
        const nights = parseInt(nightsMatch[1]);
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + nights);
        setEndDate(end.toISOString().split('T')[0]);
      }
    }
  }, [startDate, packageData?.duration]);

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[2]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [coTravelers, setCoTravelers] = useState<{ id: string; name: string; age?: string; type: 'adult' | 'child'; isExiting?: boolean }[]>([]);

  // Persistence Key
  const STORAGE_KEY = `toura_booking_${packageData?.id || 'bespoke'}`;

  // Hydrate State
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setAdults(data.adults || 1);
        setKids(data.kids || 0);
        setStartDate(data.startDate || "");
        setEndDate(data.endDate || "");
        setDestination(data.destination || "");
        setNotes(data.notes || "");
        setCustomerName(data.customerName || "");
        setCustomerEmail(data.customerEmail || "");
        setCustomerPhone(data.customerPhone || "");
        if (data.coTravelers) setCoTravelers(data.coTravelers);
      } catch (e) {
        console.error("Hydration error:", e);
      }
    }
  }, [STORAGE_KEY]);

  // Persist State
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = { adults, kids, startDate, endDate, destination, notes, customerName, customerEmail, customerPhone, coTravelers };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 1000);
    return () => clearTimeout(timer);
  }, [adults, kids, startDate, endDate, destination, notes, customerName, customerEmail, customerPhone, coTravelers, STORAGE_KEY]);

  // Dynamic Pricing Engine
  const totalInvestment = React.useMemo(() => {
    const symbol = packageData?.currency || "₹";
    const base = packageData?.price ? parseInt(packageData.price.replace(/[^0-9]/g, "")) : 5025;
    const childBase = packageData?.child_price ? parseInt(packageData.child_price.replace(/[^0-9]/g, "")) : (base * 0.5);
    const total = ((adults * base) + (kids * childBase)).toLocaleString();
    return `${symbol}${total}`;
  }, [adults, kids, packageData]);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCoTravelers(prev => {
      // 1. Separate current active items from those already exiting
      const active = prev.filter(t => !t.isExiting);
      const existingExits = prev.filter(t => t.isExiting);
      
      const extraAdultsCount = adults - 1;
      
      // 2. Separate active adults and children
      let currentAdults = active.filter(t => t.type === 'adult');
      let currentKids = active.filter(t => t.type === 'child');
      let newExits: typeof prev = [];

      // 3. Reconcile Adults
      if (currentAdults.length < extraAdultsCount) {
        for (let i = currentAdults.length; i < extraAdultsCount; i++) {
          currentAdults.push({ id: Math.random().toString(36).substr(2, 9), name: "", type: 'adult' });
        }
      } else if (currentAdults.length > extraAdultsCount) {
        const itemsToExit = currentAdults.slice(extraAdultsCount).map(t => ({ ...t, isExiting: true }));
        currentAdults = currentAdults.slice(0, extraAdultsCount);
        newExits = [...newExits, ...itemsToExit];
      }

      // 4. Reconcile Kids
      if (currentKids.length < kids) {
        for (let i = currentKids.length; i < kids; i++) {
          currentKids.push({ id: Math.random().toString(36).substr(2, 9), name: "", age: "", type: 'child' });
        }
      } else if (currentKids.length > kids) {
        const itemsToExit = currentKids.slice(kids).map(t => ({ ...t, isExiting: true }));
        currentKids = currentKids.slice(0, kids);
        newExits = [...newExits, ...itemsToExit];
      }

      // 5. Combine and schedule cleanup
      const finalExits = [...existingExits, ...newExits];
      if (newExits.length > 0) {
        setTimeout(() => {
          setCoTravelers(current => current.filter(t => !t.isExiting));
        }, 500);
      }

      return [...currentAdults, ...currentKids, ...finalExits];
    });
  }, [adults, kids]);


  useEffect(() => {
    if (packageData) {
      setDestination(packageData.title);
    } else {
      setDestination("");
    }
  }, [packageData]);

  useEffect(() => {
    if (isActive) {
      if (isHoneymoon) {
        setAdults(2);
        setKids(0);
      } else {
        // If not honeymoon, default to 1 adult and 0 kids
        // This ensures that even if we came from a honeymoon session for the same package, 
        // the normal view starts at 1.
        setAdults(1);
        setKids(0);
      }
    }
  }, [isActive, isHoneymoon]);

  useEffect(() => {
    if (adults > 1 || kids > 0) {
      const tl = gsap.timeline();
      tl.to(".animate-manifest-reveal", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power4.out"
      }).to(".manifest-item", {
        opacity: 1,
        x: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power4.out"
      }, "-=0.4");
    }
  }, [adults, kids]);



  const submitBooking = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: packageData?.id,
          packageName: packageData?.title,
          travelerCount: adults + kids,
          customerName,
          customerEmail,
          customerPhone: `${selectedCountry.dial}${customerPhone}`,
          specialRequests: `Dates: ${startDate} to ${endDate} | Destination: ${destination || 'Not Specified'} | Adults: ${adults} | Kids: ${kids} | Co-Travelers: ${JSON.stringify(coTravelers)} | Source: ${bookingSource} | Notes: ${notes}`,
          bookingSource,
          totalAmount: (() => {
            if (!packageData?.price) return 0;
            const base = parseInt(packageData.price.replace(/[^0-9]/g, "")) || 0;
            const childBase = packageData?.child_price ? parseInt(packageData.child_price.replace(/[^0-9]/g, "")) : (base * 0.5);
            return (adults * base) + (kids * childBase);
          })()
        }),
      });

      if (!response.ok) throw new Error("Booking failed");
      
      const resData = await response.json();
      if (resData.data && resData.data[0]) {
        setBookingId(resData.data[0].id);
      }
      
      setStep(3);
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to confirm booking. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const missingFields = [];
      if (!customerName.trim()) missingFields.push("Name");
      if (!customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) missingFields.push("Email");
      if (!customerPhone || customerPhone.length < selectedCountry.len) missingFields.push("Phone");
      if (!startDate || !endDate) missingFields.push("Dates");
      
      const incompleteTraveler = coTravelers.some((t, idx) => {
        const isChild = idx >= (adults - 1);
        return !t.name.trim() || (isChild && !t.age);
      });
      if (incompleteTraveler) missingFields.push("All Guest Details");

      if (missingFields.length > 0) {
        setError(`Information Required: ${missingFields.join(", ")}`);
        return;
      }
    }

    if (step === 2) {
      submitBooking();
      return;
    }

    gsap.to(contentRef.current, {
      opacity: 0,
      x: -20,
      duration: 0.2,
      onComplete: () => {
        setStep(step + 1);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        gsap.fromTo(contentRef.current, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.3 });
      }
    });
  };

  const handleBack = useCallback(() => {
    if (step > 1 && step < 3) {
      gsap.to(contentRef.current, {
        opacity: 0,
        x: 20,
        duration: 0.2,
        onComplete: () => {
          setStep(step - 1);
          if (scrollRef.current) scrollRef.current.scrollTop = 0;
          gsap.fromTo(contentRef.current, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3 });
        }
      });
      return true;
    }
    return false;
  }, [step]);

  useEffect(() => {
    if (isActive) {
      registerBackHandler?.(handleBack);
      setInternalCanGoBack?.(step > 1 && step < 3);
    }
    return () => {
      if (isActive) {
        registerBackHandler?.(null);
        setInternalCanGoBack?.(false);
      }
    };
  }, [isActive, step, handleBack, registerBackHandler, setInternalCanGoBack]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Country Selection Portal - High Z-Index Overlay */}
      {isSelectorOpen && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 transform-gpu">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsSelectorOpen(false)} />
          <div className="relative w-full max-w-[340px] bg-[#1c1c1e] border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white italic">Select Region</h4>
              </div>
              <button onClick={() => setIsSelectorOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search countries..." className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all" />
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2" data-lenis-prevent>
              {COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.dial.includes(searchQuery)).map((country) => (
                <button key={country.code} type="button" onClick={() => { setSelectedCountry(country); setIsSelectorOpen(false); setSearchQuery(""); }} className="w-full p-4 flex items-center justify-between hover:bg-white/5 rounded-2xl transition-all text-left group">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl leading-none group-hover:scale-110 transition-transform">{country.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white/80">{country.name}</span>
                      <span className="text-[9px] text-white/30 uppercase tracking-widest">{country.code}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-white/40 group-hover:text-white/60 transition-colors">{country.dial}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Scroller */}
      <div 
        ref={scrollRef} 
        onScroll={(e) => onScroll(e.currentTarget.scrollTop > 30)}
        className="flex-1 w-full overflow-y-auto scrollbar-hide overscroll-behavior-contain transform-gpu"
        data-lenis-prevent
      >
        <div 
          className={`w-full flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu ${isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'}`}
        >
            {/* Hero Section */}
            <div className="relative w-full h-[35vh] md:h-[50vh] shrink-0">
              <img 
                src={packageData?.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2000"} 
                alt={packageData?.title || "Custom Journey"} 
                className="object-cover w-full h-full opacity-60 grayscale-[0.2]" 
              />
              {/* Hyper-Smooth Progressive Blend */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1c1c1e]" />
              <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#1c1c1e] via-[#1c1c1e]/80 to-transparent" />
              
              <div className="absolute bottom-0 left-6 md:left-16 right-6 pb-8 md:pb-12">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white uppercase italic leading-tight mb-4 drop-shadow-2xl">
                  {packageData?.title ? `${packageData.title}` : "Plan Your Journey"}
                </h2>
                <p className="text-[10px] md:text-xs tracking-[0.3em] text-white/60 uppercase font-bold drop-shadow-md">
                  {packageData?.location || "Complete your booking details below"}
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div ref={contentRef} className="px-6 md:px-16 pb-4">
              {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
                  {/* Trip Summary Column */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] tracking-[0.2em] text-white/60 uppercase block">Trip Summary</label>
                      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden group border border-white/5 bg-[#1c1c1e] shadow-2xl">
                        <img 
                          src={packageData?.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2000"} 
                          alt={packageData?.title || "Custom Journey"} 
                          className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105 opacity-80" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute bottom-8 left-8 right-8">
                          <h3 className="text-3xl font-bold text-white italic tracking-tighter mb-2">
                            {packageData?.title || "Bespoke Journey"}
                          </h3>
                          <p className="text-xs text-white/60 uppercase tracking-[0.2em]">
                            {packageData?.location || "Exclusive Escape"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-8 border-t border-white/[0.08] mt-8 animate-in fade-in duration-1000">
                      <label className="text-[10px] tracking-[0.2em] text-white/60 uppercase block font-black">Booking Details</label>
                      <div className="p-6 md:p-8 rounded-[32px] bg-white/[0.03] border border-white/[0.08] space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-md group/protocol transition-all duration-1000 hover:bg-white/[0.04]">
                        {/* Ambient Glows */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/[0.02] rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/[0.01] rounded-full blur-[80px] pointer-events-none" />

                        {/* Contact Information Section */}
                        <div className="space-y-5">
                          <div className="flex justify-between items-end py-1 group/row transition-all duration-500">
                            <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] group-hover/row:text-white/50 transition-colors">Lead Guest</span>
                            <span className="text-xs font-bold text-white/80 italic group-hover/row:text-white transition-colors">{customerName || "Pending Identification"}</span>
                          </div>
                          <div className="flex justify-between items-end py-1 group/row transition-all duration-500">
                            <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] group-hover/row:text-white/50 transition-colors">Email Address</span>
                            <span className="text-[10px] font-bold text-white/80 italic truncate ml-4 group-hover/row:text-white transition-colors">{customerEmail || "Pending"}</span>
                          </div>
                          <div className="flex justify-between items-end py-1 group/row transition-all duration-500">
                            <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] group-hover/row:text-white/50 transition-colors">Contact Number</span>
                            <span className="text-[10px] font-bold text-white/80 italic group-hover/row:text-white transition-colors">{customerPhone ? `${selectedCountry.dial} ${customerPhone}` : "Pending"}</span>
                          </div>
                        </div>

                        {/* Divider Line */}
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                        {/* Journey Stats Section */}
                        <div className="space-y-5">
                          <div className="flex justify-between items-end py-1 group/row transition-all duration-500">
                            <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] group-hover/row:text-white/50 transition-colors">Selected Journey</span>
                            <span className="text-xs font-bold text-white/80 italic group-hover/row:text-white transition-colors">{packageData?.title || "Bespoke Journey"}</span>
                          </div>
                          <div className="flex justify-between items-end py-1 group/row transition-all duration-500">
                            <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] group-hover/row:text-white/50 transition-colors">Travel Window</span>
                            <span className="text-[10px] font-bold text-white/80 italic group-hover/row:text-white transition-colors">
                              {formatDate(startDate) || "---"} <span className="mx-2 text-white/20 not-italic">to</span> {formatDate(endDate) || "---"}
                            </span>
                          </div>
                          <div className="flex justify-between items-end py-1 group/row transition-all duration-500">
                            <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] group-hover/row:text-white/50 transition-colors">Total Travelers</span>
                            <span className="text-xs font-bold text-white/80 flex items-center group-hover/row:text-white transition-colors">
                              <span>{String(adults).padStart(2, '0')} {adults === 1 ? 'Adult' : 'Adults'}</span>
                              {kids > 0 && <span>{` / ${String(kids).padStart(2, '0')} ${kids === 1 ? 'Child' : 'Children'}`}</span>}
                            </span>
                          </div>
                        </div>

                        {/* Additional Guests Manifest Section */}
                        {(() => {
                          const activeGuests = coTravelers.filter(t => !t.isExiting);
                          if (activeGuests.length === 0) return null;
                          return (
                            <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] tracking-[0.3em] text-white/40 uppercase font-black">
                                  {activeGuests.length === 1 ? 'Additional Guest' : 'Additional Guests'}
                                </span>
                                <div className="h-[1px] flex-1 bg-white/[0.05]" />
                              </div>
                              <div className="space-y-4 pl-4 border-l border-white/[0.08]">
                                {activeGuests.map((t, idx, arr) => {
                                  const adultsList = arr.filter(p => p.type === 'adult');
                                  const kidsList = arr.filter(p => p.type === 'child');
                                  const label = t.type === 'adult' 
                                    ? `Adult ${adultsList.indexOf(t) + 2}` 
                                    : `Child ${kidsList.indexOf(t) + 1}`;
                                  
                                  return (
                                    <div key={t.id} className="flex justify-between items-baseline group/manifest">
                                      <span className="text-[9px] text-white/30 uppercase tracking-[0.15em] group-hover/manifest:text-white/60 transition-colors">{label}</span>
                                      <span className="text-xs font-bold text-white/90 italic group-hover/manifest:text-white transition-colors">
                                        {t.name || "---"}
                                        {t.type === 'child' && t.age && <span className="ml-2 not-italic text-[10px] text-white/30 font-mono">[{t.age}Y]</span>}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Est Total Section inside protocol for unity */}
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pt-2" />
                        <div className="pt-2 flex justify-between items-end">
                          <span className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Total Est. Cost</span>
                          <div className="text-right">
                            <span className="text-2xl font-mono font-bold text-white leading-none">
                              {(() => {
                                if (!packageData?.price) return "Quote on Request";
                                const symbol = packageData?.currency || "₹";
                                const base = parseInt(packageData.price.replace(/[^0-9]/g, "")) || 0;
                                const childBase = packageData?.child_price ? parseInt(packageData.child_price.replace(/[^0-9]/g, "")) : (base * 0.5);
                                const total = ((adults * base) + (kids * childBase)).toLocaleString();
                                return `${symbol}${total}`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details Column */}
                  <div className="lg:col-span-3 space-y-12">
                    <div className="space-y-6">
                      <label className="text-[10px] tracking-[0.2em] text-white/60 uppercase block">Contact Details</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name" className="w-full bg-white/[0.07] border border-white/20 rounded-2xl p-5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all h-[64px]" />
                        <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email Address" className="w-full bg-white/[0.07] border border-white/20 rounded-2xl p-5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all h-[64px]" />
                        <div className="md:col-span-2 flex gap-4">
                          <button type="button" onClick={() => setIsSelectorOpen(true)} className="bg-white/[0.07] border border-white/20 rounded-2xl px-6 flex items-center gap-3 hover:bg-white/[0.05] transition-all min-w-[120px] h-[64px]">
                            <span className="text-2xl">{selectedCountry.flag}</span>
                            <span className="text-sm font-bold text-white/80">{selectedCountry.dial}</span>
                          </button>
                          <input type="tel" value={customerPhone} maxLength={selectedCountry.len} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))} placeholder="Phone Number" className="flex-1 bg-white/[0.07] border border-white/20 rounded-2xl p-5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all h-[64px]" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[10px] tracking-[0.2em] text-white/60 uppercase block">Preferred Dates</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div onClick={() => startInputRef.current?.showPicker()} className="p-5 bg-white/[0.07] border border-white/20 rounded-2xl space-y-2 cursor-pointer hover:bg-white/[0.05] transition-all h-[90px] flex flex-col justify-center">
                          <p className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Departure Date</p>
                          <p className="text-sm font-bold">{formatDate(startDate) !== "---" ? formatDate(startDate) : "Select Date"}</p>
                          <input ref={startInputRef} type="date" className="sr-only" onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div onClick={() => !hasFixedDuration && endInputRef.current?.showPicker()} className={`p-5 bg-white/[0.07] border border-white/20 rounded-2xl space-y-2 h-[90px] flex flex-col justify-center transition-all ${hasFixedDuration ? 'opacity-60 cursor-not-allowed grayscale-[0.3]' : 'cursor-pointer hover:bg-white/[0.05]'}`}>
                          <p className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Return Date</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold">{formatDate(endDate) !== "---" ? formatDate(endDate) : "Select Date"}</p>
                            {hasFixedDuration && <span className="text-[8px] bg-white/10 text-white/60 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-white/5">{packageData?.duration}</span>}
                          </div>
                          <input ref={endInputRef} type="date" className="sr-only" min={startDate} onChange={(e) => setEndDate(e.target.value)} disabled={hasFixedDuration} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[10px] tracking-[0.2em] text-white/60 uppercase block">Travelers</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/[0.07] border border-white/20 rounded-[24px] flex items-center justify-between group hover:bg-white/[0.05] transition-all duration-700">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all duration-500">
                              <Users size={18} />
                            </div>
                            <div className="space-y-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Adults</span>
                                <div className="w-[1px] h-2 bg-white/10" />
                                <span className="text-[8px] font-medium text-white/30 italic">12+ Years</span>
                              </div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-mono font-bold text-white leading-none tracking-tighter">{String(adults).padStart(2, '0')}</span>
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Guests</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10 shadow-lg">
                            <button 
                              onClick={() => setAdults(Math.max(isHoneymoon ? 2 : 1, adults - 1))} 
                              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white text-white/60 hover:text-black transition-all duration-500 text-lg font-medium"
                            >-</button>
                            <button 
                              onClick={() => setAdults(Math.min(20, adults + 1))} 
                              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white text-white/60 hover:text-black transition-all duration-500 text-lg font-medium"
                            >+</button>
                          </div>
                        </div>
                        {!isHoneymoon && (
                          <div className="p-4 bg-white/[0.07] border border-white/20 rounded-[24px] flex items-center justify-between group hover:bg-white/[0.05] transition-all duration-700">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all duration-500">
                                <Users size={18} className="opacity-50" />
                              </div>
                              <div className="space-y-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Children</span>
                                  <div className="w-[1px] h-2 bg-white/10" />
                                  <span className="text-[8px] font-medium text-white/30 italic">0-12 Years</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-2xl font-mono font-bold text-white leading-none tracking-tighter">{String(kids).padStart(2, '0')}</span>
                                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Guests</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10 shadow-lg">
                              <button onClick={() => setKids(Math.max(0, kids - 1))} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white text-white/60 hover:text-black transition-all duration-500 text-lg font-medium">-</button>
                              <button onClick={() => setKids(Math.min(20, kids + 1))} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white text-white/60 hover:text-black transition-all duration-500 text-lg font-medium">+</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {coTravelers.length > 0 && (
                        <div className="space-y-6 pt-6">
                          <div className="space-y-1">
                            <label className="text-[10px] tracking-[0.2em] text-white/60 uppercase block">Who's Joining You?</label>
                            <p className="text-[10px] text-white/40 uppercase tracking-[0.1em]">Enter details for additional guests</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {coTravelers.map((traveler, i) => {
                              const isChild = traveler.type === 'child';
                              return (
                                <div 
                                  key={traveler.id} 
                                  className={`group relative flex gap-3 p-1 rounded-[22px] bg-white/[0.08] border border-white/20 hover:border-white/40 hover:bg-white/[0.12] transition-all duration-500 shadow-xl ${traveler.isExiting ? 'animate-out fade-out zoom-out-95 slide-out-to-top-2 pointer-events-none' : 'animate-in fade-in zoom-in-95 slide-in-from-top-2'}`}
                                >
                                  <div className="flex-1 relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/80 transition-colors">
                                      {isChild ? <Users size={14} className="opacity-70" /> : <Users size={14} />}
                                    </div>
                                    <input 
                                      type="text" 
                                      value={traveler.name} 
                                      onChange={(e) => {
                                        const next = [...coTravelers];
                                        next[i].name = e.target.value;
                                        setCoTravelers(next);
                                      }} 
                                      placeholder={isChild ? `Child ${coTravelers.filter((t, idx) => t.type === 'child' && !t.isExiting && idx <= i).length} Name` : `Adult ${coTravelers.filter((t, idx) => t.type === 'adult' && !t.isExiting && idx <= i).length + 1} Name`}
                                      className="w-full bg-transparent pl-12 pr-5 py-5 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all h-[60px]" 
                                    />
                                  </div>
                                  {isChild && (
                                    <div className="w-24 relative border-l border-white/10">
                                      <input 
                                        type="text" 
                                        value={traveler.age} 
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/\D/g, "");
                                          const numVal = parseInt(val);
                                          const next = [...coTravelers];
                                          next[i].age = numVal > 12 ? "12" : val;
                                          setCoTravelers(next);
                                        }} 
                                        placeholder="Age"
                                        className="w-full bg-transparent px-4 py-5 text-sm text-white text-center placeholder:text-white/40 focus:outline-none transition-all h-[60px]" 
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <label className="text-[10px] tracking-[0.2em] text-white/60 uppercase block">Special Desire? Tell us!</label>
                      <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any specific requirements, celebration details, or requests..." className="w-full bg-white/[0.07] border border-white/20 rounded-2xl p-6 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="max-w-2xl mx-auto space-y-10 pt-10 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="text-center space-y-4">
                    <h3 className="text-4xl font-bold italic tracking-tight uppercase">Booking Confirmation</h3>
                    <p className="text-white/60 uppercase tracking-[0.3em] text-[10px]">Please review your journey details</p>
                  </div>
                  <div className="p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1 shadow-2xl">
                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                      <span className="text-white/60 uppercase tracking-widest text-[10px]">Journey</span>
                      <span className="text-sm font-bold italic text-right">{packageData?.title || "Bespoke Journey"}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start py-6 border-b border-white/5 gap-4">
                      <span className="text-white/60 uppercase tracking-widest text-[10px] sm:pt-1">Primary Traveler</span>
                      <div className="text-left sm:text-right space-y-1 w-full sm:w-auto">
                        <p className="text-sm font-bold italic">{customerName || "---"}</p>
                        <p className="text-[10px] text-white/40 truncate">{customerEmail}</p>
                        <p className="text-[10px] text-white/40 font-mono tracking-tighter">{selectedCountry.dial} {customerPhone}</p>
                      </div>
                    </div>
                    {(() => {
                      const activeGuests = coTravelers.filter(t => !t.isExiting);
                      if (activeGuests.length === 0) return null;
                      return (
                        <div className="flex flex-col sm:flex-row justify-between items-start py-6 border-b border-white/5 gap-4">
                          <span className="text-white/60 uppercase tracking-widest text-[10px] sm:pt-1">
                            {activeGuests.length === 1 ? 'Additional Guest' : 'Additional Guests'}
                          </span>
                          <div className="text-left sm:text-right space-y-2 w-full sm:w-auto">
                            {activeGuests.map((t, idx, arr) => {
                              const adultsList = arr.filter(p => p.type === 'adult');
                              const kidsList = arr.filter(p => p.type === 'child');
                              const label = t.type === 'adult' 
                                ? `Adult ${adultsList.indexOf(t) + 2}` 
                                : `Child ${kidsList.indexOf(t) + 1}`;
                              return (
                                <p key={t.id} className="text-[11px] font-bold italic text-white/80">
                                  <span className="text-[9px] text-white/20 uppercase not-italic mr-2 font-black">{label}</span>
                                  {t.name || "---"} {t.type === 'child' && t.age && <span className="ml-1 text-[10px] text-white/30 not-italic font-mono">[{t.age}Y]</span>}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                      <span className="text-white/60 uppercase tracking-widest text-[10px]">Dates</span>
                      <span className="text-sm font-bold italic text-right">{formatDate(startDate)} — {formatDate(endDate)}</span>
                    </div>
                    <div className="flex flex-col gap-3 py-5 border-b border-white/5">
                      <span className="text-white/60 uppercase tracking-widest text-[10px]">Special Desire</span>
                      <p className="text-[11px] text-white/80 italic leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/[0.05]">
                        {notes.trim() || "N/A"}
                      </p>
                    </div>
                    <div className="flex justify-between items-center py-5 border-b border-white/5">
                      <span className="text-white/60 uppercase tracking-widest text-[10px]">Total Est. Cost</span>
                      <div className="text-right">
                        <span className="text-3xl font-mono font-bold text-white">
                          {totalInvestment}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4 pt-6 text-center">
                      <button onClick={submitBooking} disabled={isSubmitting} className="w-full flex items-center justify-center gap-4 p-6 bg-white text-black rounded-full hover:bg-white/90 transition-all font-bold uppercase tracking-[0.2em] text-xs">
                        <CreditCard className="w-5 h-5" />
                        {isSubmitting ? "Processing..." : "Proceed to Payment"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-10 py-12">
                  <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center bg-white/5 animate-in zoom-in duration-700">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase italic">Booking Received</h3>
                    {bookingId && (
                      <div className="inline-block px-6 py-3 border border-white/20 bg-white/[0.07] rounded-2xl shadow-xl">
                        <span className="text-[10px] text-white/60 uppercase tracking-[0.2em]">Booking ID: </span>
                        <span className="text-sm font-mono font-bold text-white tracking-widest ml-2">TRX-{bookingId.split('-')[0].toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full max-w-xl mx-auto p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1 shadow-2xl text-left animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                      <span className="text-white/60 uppercase tracking-widest text-[10px]">Journey</span>
                      <span className="text-sm font-bold italic text-right">{packageData?.title || "Bespoke Journey"}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start py-6 border-b border-white/5 gap-4">
                      <span className="text-white/60 uppercase tracking-widest text-[10px] sm:pt-1">Primary Traveler</span>
                      <div className="text-left sm:text-right space-y-1 w-full sm:w-auto">
                        <p className="text-sm font-bold italic">{customerName || "---"}</p>
                        <p className="text-[10px] text-white/40 truncate">{customerEmail}</p>
                        <p className="text-[10px] text-white/40 font-mono tracking-tighter">{selectedCountry.dial} {customerPhone}</p>
                      </div>
                    </div>
                    {(() => {
                      const activeGuests = coTravelers.filter(t => !t.isExiting);
                      if (activeGuests.length === 0) return null;
                      return (
                        <div className="flex flex-col sm:flex-row justify-between items-start py-6 border-b border-white/5 gap-4">
                          <span className="text-white/60 uppercase tracking-widest text-[10px] sm:pt-1">
                            {activeGuests.length === 1 ? 'Additional Guest' : 'Additional Guests'}
                          </span>
                          <div className="text-left sm:text-right space-y-2 w-full sm:w-auto">
                            {activeGuests.map((t, idx, arr) => {
                              const adultsList = arr.filter(p => p.type === 'adult');
                              const kidsList = arr.filter(p => p.type === 'child');
                              const label = t.type === 'adult' 
                                ? `Adult ${adultsList.indexOf(t) + 2}` 
                                : `Child ${kidsList.indexOf(t) + 1}`;
                              return (
                                <p key={t.id} className="text-[11px] font-bold italic text-white/80">
                                  <span className="text-[9px] text-white/20 uppercase not-italic mr-2 font-black">{label}</span>
                                  {t.name || "---"} {t.type === 'child' && t.age && <span className="ml-1 text-[10px] text-white/30 not-italic font-mono">[{t.age}Y]</span>}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                      <span className="text-white/60 uppercase tracking-widest text-[10px]">Dates</span>
                      <span className="text-sm font-bold italic text-right">{formatDate(startDate)} — {formatDate(endDate)}</span>
                    </div>
                    <div className="flex flex-col gap-3 py-5 border-b border-white/5">
                      <span className="text-white/60 uppercase tracking-widest text-[10px]">Special Desire</span>
                      <p className="text-[11px] text-white/50 italic leading-relaxed">{notes.trim() || "N/A"}</p>
                    </div>
                    <div className="flex justify-between items-center py-5">
                      <span className="text-white/60 uppercase tracking-widest text-[10px]">Total Est. Cost</span>
                      <div className="text-right">
                        <span className="text-2xl font-mono font-bold text-white">
                          {totalInvestment}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <p className="text-white/60 uppercase tracking-[0.2em] text-[10px] max-w-md mx-auto leading-loose">
                      Thank you for choosing TouraLuxe. Our concierge team will contact you shortly to finalize your itinerary.
                    </p>
                    <Magnetic>
                      <button onClick={() => startClosing()} className="px-12 py-4 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-full hover:bg-white/90 transition-all">Return Home</button>
                    </Magnetic>
                  </div>
                </div>
              )}

              {/* CTA */}
              {step < 3 && (
                <div className="mt-12 pt-8 border-t border-white/[0.1] flex flex-col items-center gap-8 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] w-8 bg-white/10" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Step 0{step} / 02</span>
                    <div className="h-[1px] w-8 bg-white/10" />
                  </div>
                  <Magnetic>
                    <button
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="flex flex-col items-center gap-4 group/btn"
                    >
                      <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center group-hover/btn:scale-110 transition-all duration-700 shadow-[0_0_40px_rgba(255,255,255,0.15)] group-hover/btn:shadow-[0_0_60px_rgba(255,255,255,0.25)]">
                        <ChevronRight size={28} strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover/btn:text-white group-hover/btn:tracking-[0.5em] transition-all duration-700 mt-2">
                        {step === 1 ? 'Review Journey Details' : 'Finalize Booking'}
                      </span>
                    </button>
                  </Magnetic>
                </div>
              )}
            </div>
          </div>
      </div>

    </div>
  );
});
