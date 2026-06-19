"use client";

import { useEffect, useRef, useState, memo, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronRight, Clock, Users, Compass, ShieldCheck, Sparkles, Plane, ArrowRight, X, FileDown } from "lucide-react";
import { Magnetic } from "../Magnetic";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePricing } from "@/hooks/usePricing";
import { PackageBadges } from "@/components/ui/PackageBadges";

gsap.registerPlugin(ScrollTrigger);

// --- HELPER: SCRUB TEXT ANIMATION ---
const ScrubText = ({ 
  text, 
  className, 
  scroller,
  start,
  end
}: { 
  text: string; 
  className?: string; 
  scroller?: HTMLElement | null;
  start?: string | (() => string);
  end?: string | (() => string);
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || !scroller) return;
    const words = containerRef.current.querySelectorAll('.scrub-word');
    
    // Default to the top edge of the floating bottom dynamic island
    const finalStart = start || (() => {
      const islandHeight = window.innerWidth < 768 ? 76 : 92;
      return `top bottom-=${islandHeight}`;
    });
    
    // Complete the animation relative to the container scroll trigger
    const finalEnd = end || (() => {
      const islandHeight = window.innerWidth < 768 ? 76 : 92;
      return `bottom bottom-=${islandHeight + 80}`;
    });

    const ctx = gsap.context(() => {
      gsap.fromTo(words, 
        { opacity: 0.15, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            scroller: scroller,
            trigger: containerRef.current,
            start: finalStart,
            end: finalEnd,
            scrub: 0.5,
          }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [text, scroller, start, end]);

  return (
    <div ref={containerRef} className={cn("flex flex-wrap gap-x-[0.25em] gap-y-[0.1em]", className)}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="scrub-word inline-block">{word}</span>
      ))}
    </div>
  );
};

// --- HELPER: ITINERARY DAY ACCORDION ---
const ItineraryDay = ({ day, index }: { day: any, index: number }) => {
  const [isOpen, setIsOpen] = useState(index === 1); 

  return (
    <div className="group/accordion bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/10 rounded-[2rem] overflow-hidden transition-all duration-500">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 md:p-8 flex items-center gap-4 md:gap-6 text-left"
      >
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] md:text-xs font-black uppercase tracking-widest text-white/70">
          D{index}
        </div>
        <h4 className="flex-1 text-lg md:text-2xl font-bold text-white tracking-tight">{day.title}</h4>
        <div className={cn("w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 transition-transform duration-500 shrink-0", isOpen ? "bg-white/10 text-white" : "")}>
          <ChevronRight size={16} className={cn("transition-transform duration-500", isOpen ? "-rotate-90" : "rotate-90")} />
        </div>
      </button>
      <div 
        onTransitionEnd={(e) => {
          if (e.propertyName === 'max-height') {
            ScrollTrigger.refresh();
          }
        }}
        className={cn("px-6 md:px-8 overflow-hidden transition-all duration-500 ease-in-out", isOpen ? "max-h-[1000px] pb-8 opacity-100" : "max-h-0 opacity-0")}
      >
        <div className="pl-[3.5rem] md:pl-[4.5rem] flex flex-col gap-6">
          {day.image && (
            <div className="relative w-full h-48 md:h-72 rounded-2xl md:rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 shrink-0">
              <Image src={day.image} alt={day.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          )}
          <div className="flex flex-col gap-4">
            {day.description?.split('\n').filter((line: string) => line.trim() !== '').map((point: string, idx: number) => (
              <div key={idx} className="flex items-start gap-4 group/point">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/30 group-hover/point:bg-amber-400 mt-2.5 shrink-0 transition-all duration-300 group-hover/point:shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                <p className="text-white/60 group-hover/point:text-white/90 leading-relaxed font-medium transition-colors duration-300">
                  {point.trim()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PackageContent = memo(({ 
  data: experience, 
  isActive, 
  source,
  onScroll, 
  openModal 
}: { 
  data: any, 
  isActive: boolean, 
  source: string,
  onScroll: (scrolled: boolean) => void, 
  openModal: any 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { computePrice } = usePricing();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollerEl, setScrollerEl] = useState<HTMLElement | null>(null);


  const pillRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const jellyRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  const pricing = useMemo(() => computePrice(experience), [experience, computePrice]);

  const pdfUrl = useMemo(() => {
    try {
      const anchor = experience?.itinerary_url;
      if (anchor) {
        if (anchor.startsWith('{')) {
          const parsed = JSON.parse(anchor);
          return parsed.pdf_url || "";
        }
        return anchor;
      }
    } catch (e) {
      console.warn("Error parsing itinerary_url for PDF:", e);
    }
    return "";
  }, [experience]);
  const isPdf = useMemo(() => {
    if (!pdfUrl) return false;
    return pdfUrl.toLowerCase().split('?')[0].endsWith('.pdf');
  }, [pdfUrl]);

  const destinationsCovered = useMemo(() => {
    if (experience?.destinations_covered) {
      return experience.destinations_covered.split(",").map((d: string) => d.trim()).filter(Boolean);
    }
    try {
      const anchor = experience?.itinerary_url;
      if (anchor && anchor.startsWith('{')) {
        const parsed = JSON.parse(anchor);
        if (parsed.destinations_covered) {
          return parsed.destinations_covered
            .split(",")
            .map((d: string) => d.trim())
            .filter(Boolean);
        }
      }
    } catch (e) {
      console.warn("Error parsing destinations_covered:", e);
    }
    return [];
  }, [experience]);
  const handleGlowMove = useCallback((clientX: number, clientY: number) => {
    if (!pillRef.current || !glowRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    glowRef.current.style.background = `
      radial-gradient(ellipse 300px 180px at ${x}px ${y}px, rgba(255,251,240,0.15), rgba(255,255,255,0.02) 60%, transparent 100%),
      radial-gradient(ellipse 500px 300px at ${x}px ${y}px, rgba(255,255,255,0.03), transparent 70%),
      radial-gradient(ellipse 800px 500px at ${x}px ${y}px, rgba(255,255,255,0.01), transparent 80%)
    `;
    glowRef.current.style.opacity = '1';
    pillRef.current.style.borderColor = 'rgba(255,255,255,0.35)';
  }, []);

  const handleGlowLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = '0';
    if (pillRef.current) pillRef.current.style.borderColor = 'rgba(255,255,255,0.2)';
  }, []);

  // ═══ JELLY INTERACTION ENGINE ═══
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (!jellyRef.current) return;

    gsap.killTweensOf(jellyRef.current, "scaleX,scaleY");
    gsap.to(jellyRef.current, {
      scaleY: 0.82, scaleX: 1.08, duration: 0.1, ease: "power2.out",
      onComplete: () => {
        gsap.to(jellyRef.current, {
          scaleY: 1, scaleX: 1, duration: 0.8, ease: "elastic.out(1, 0.3)",
          clearProps: "scaleX,scaleY"
        });
      }
    });
  }, [pricing.finalTotal]);
  
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const top = scrollRef.current.scrollTop;
      onScroll(top > 50);
    }
  }, [onScroll]);

  // Set the scroller element once mounted and perform staged ScrollTrigger refreshes
  useEffect(() => {
    if (scrollRef.current) {
      setScrollerEl(scrollRef.current);
    }
    
    if (!isActive) return;

    // Refresh immediately to capture initial DOM heights
    ScrollTrigger.refresh();

    // Staged refreshes to handle modal transitions & rendering delays on all devices
    const t1 = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    const t2 = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 450); // Mid-transition

    const t3 = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 850); // Post-transition settlement

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isActive]);

  const heroMediaRef = useRef<HTMLDivElement>(null);
  
  // Hero Parallax Effect
  useEffect(() => {
    if (!scrollerEl) return;
    const ctx = gsap.context(() => {
      if (heroMediaRef.current) {
        gsap.to(heroMediaRef.current, {
          yPercent: 20,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: {
            scroller: scrollerEl,
            trigger: heroMediaRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          }
        });
      }
    }, scrollerEl);
    return () => ctx.revert();
  }, [scrollerEl]);

  // Lightbox keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight' && experience?.gallery) {
        setCurrentImageIndex(prev => prev < experience.gallery.length - 1 ? prev + 1 : 0);
      }
      if (e.key === 'ArrowLeft' && experience?.gallery) {
        setCurrentImageIndex(prev => prev > 0 ? prev - 1 : experience.gallery.length - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, experience?.gallery]);

  if (!experience) return null;

  return (
    <>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide selection:bg-amber-400/20 selection:text-amber-100 bg-[#080808]"
      >
        {/* Ambient Travel/Leisure Background Glows */}
        <div className="fixed top-0 right-0 w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] bg-sky-500/10 rounded-full blur-[130px] pointer-events-none -translate-y-1/2 translate-x-1/3 mix-blend-screen z-0" />
        <div className="fixed bottom-0 left-0 w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none translate-y-1/3 -translate-x-1/3 mix-blend-screen z-0" />

        {/* 1. HERO SECTION (Immersive Edge-to-Edge) */}
        <section className="relative w-full h-[100svh] flex flex-col items-center justify-center overflow-hidden">
          <div ref={heroMediaRef} className="absolute inset-0 z-0 origin-top">
             <Image src={experience.image} alt={experience.title} fill className="object-cover opacity-90" priority sizes="100vw" />
          </div>
          
          {/* Static Gradient Mask for Seamless Bottom Blend */}
          <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/10 via-black/40 to-[#0a0a0a]" />
          
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full max-w-5xl">
             <h1 className="text-[clamp(2.5rem,8vw,6.5rem)] font-bold tracking-tight text-white leading-[0.9] drop-shadow-2xl text-balance mb-6 animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out">
               {experience.title}
             </h1>
             <div className="flex flex-col items-center gap-6 md:gap-10 pt-8 animate-in fade-in duration-1000 delay-300">
               <div className="flex items-center gap-3 md:gap-4">
                 <div className="w-8 md:w-12 h-[1px] bg-white/10" />
                 <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] text-white/30 whitespace-nowrap">Best For</span>
                 <div className="w-8 md:w-12 h-[1px] bg-white/10" />
               </div>
               
               <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full max-w-5xl px-6">
                 {experience.category?.map((cat: string, i: number) => (
                   <Magnetic key={i} intensity={0.2}>
                     <button 
                       onClick={() => {
                         const { SERVICES } = require('../sections/Services');
                         const matchingService = SERVICES.find((s: any) => s.title === cat);
                         if (matchingService) openModal('SERVICES', matchingService);
                       }}
                       className="group/badge relative text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/70 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-700 hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 whitespace-nowrap overflow-hidden"
                     >
                       <span className="relative z-10">{cat}</span>
                     </button>
                   </Magnetic>
                 ))}
               </div>
             </div>
          </div>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-50">
             <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/50 drop-shadow-md">Scroll</span>
             <ChevronRight size={16} className="text-white/40 rotate-90" strokeWidth={2.5} />
          </div>
        </section>

        {/* CONTENT WRAPPER */}
        <div className="relative z-20 bg-[#0a0a0a] w-full mx-auto flex flex-col gap-24 md:gap-32 pb-32">
          
          {/* 2. THE VISION (Scrub Text Animation) */}
          <section className="max-w-5xl mx-auto text-center px-6 md:px-12 pt-16 md:pt-24">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-8 block animate-pulse">The Vision</span>
            <ScrubText 
              text={experience.description || "A breathtaking sanctuary curated for the discerning traveler."} 
              className="justify-center text-[clamp(1.5rem,4vw,3.5rem)] text-white/90 leading-tight font-medium" 
              scroller={scrollerEl} 
            />
          </section>

          {/* 3. BENTO BOX OVERVIEW */}
          <section className="px-4 md:px-8 max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 auto-rows-min">
              
              {/* Top Row: Quick Stats */}
              <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                 {experience.duration && (
                   <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 flex flex-col gap-2 hover:bg-white/[0.04] transition-colors">
                     <Clock className="text-white/40 mb-1" size={22} />
                     <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/40">Duration</span>
                     <span className="text-sm md:text-base font-bold text-white tracking-tight">{experience.duration}</span>
                   </div>
                 )}
                 {experience.season && (
                   <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 flex flex-col gap-2 hover:bg-white/[0.04] transition-colors">
                     <Compass className="text-white/40 mb-1" size={22} />
                     <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/40">Season</span>
                     <span className="text-sm md:text-base font-bold text-white tracking-tight">{experience.season}</span>
                   </div>
                 )}
                 {experience.guests && (
                   <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 flex flex-col gap-2 hover:bg-white/[0.04] transition-colors">
                     <Users className="text-white/40 mb-1" size={22} />
                     <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/40">Ideal For</span>
                     <span className="text-sm md:text-base font-bold text-white tracking-tight">{experience.guests}</span>
                   </div>
                 )}
                 <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 flex flex-col gap-2 hover:bg-white/[0.04] transition-colors">
                     <Plane className="text-blue-400/50 mb-1" size={22} />
                     <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/40">Flights</span>
                     <span className="text-sm md:text-base font-bold text-white tracking-tight">
                       {experience.flights_status === 'included' ? "Included" : experience.flights_status === 'on_request' ? "On Request" : "Excluded"}
                     </span>
                 </div>
              </div>

              {/* Middle Row: Highlights & Inclusions */}
              {experience.highlights && experience.highlights.length > 0 && (
                <div className="md:col-span-7 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 mb-6 block">Highlights</span>
                  <ul className="space-y-4">
                    {experience.highlights.map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="mt-[8px] md:mt-[10px] w-[6px] h-[6px] rounded-full bg-gradient-to-br from-white/60 to-white/20 flex-shrink-0" />
                        <span className="text-base md:text-xl font-medium text-white/90 leading-tight tracking-tight">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="md:col-span-5 flex flex-col gap-3 md:gap-4">
                 {experience.inclusions && experience.inclusions.length > 0 && (
                   <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 md:p-8 flex flex-col">
                     <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-5 block">Inclusions</span>
                     <div className="flex flex-wrap gap-2">
                       {experience.inclusions.map((inc: string, i: number) => (
                         <span key={i} className="text-[11px] md:text-xs font-semibold text-white/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-[0_0_15px_rgba(52,211,153,0.05)]">
                           <ShieldCheck size={12} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" /> {inc}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
                 {experience.exclusions && experience.exclusions.length > 0 && (
                   <div className="flex-1 bg-red-500/[0.02] border border-red-500/[0.05] rounded-[2rem] p-6 md:p-8 flex flex-col">
                     <span className="text-[9px] font-black uppercase tracking-[0.4em] text-red-400/80 mb-5 block">Exclusions</span>
                     <div className="flex flex-wrap gap-2">
                       {experience.exclusions.map((exc: string, i: number) => (
                         <span key={i} className="text-[11px] md:text-xs font-semibold text-white/70 bg-red-500/5 border border-red-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-[0_0_15px_rgba(251,113,133,0.05)]">
                           <X size={12} className="text-red-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.5)]" /> {exc}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
            </div>
          </section>

          {/* Destinations Covered (Route Timeline) */}
          {destinationsCovered.length > 0 && (
            <section className="px-4 md:px-8 max-w-7xl mx-auto w-full">
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent opacity-50 pointer-events-none" />
                <div className="relative z-10 space-y-8">
                  <div className="text-center md:text-left">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 mb-3 block">The Route</span>
                    <h3 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-none">Destinations Covered</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-4">
                    {destinationsCovered.map((dest: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 px-5 py-3 rounded-2xl transition-all duration-300">
                          <div className="w-6 h-6 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-sm md:text-base font-bold text-white/90">{dest}</span>
                        </div>
                        {idx < destinationsCovered.length - 1 && (
                          <div className="flex items-center justify-center text-white/20 select-none">
                            <ArrowRight size={18} className="animate-pulse" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 4. ITINERARY (Sticky Split-Screen / Accordion Timeline) */}
          {((experience.itinerary && experience.itinerary.length > 0) || pdfUrl) && (
            <section className="px-4 md:px-8 max-w-7xl mx-auto w-full">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
                 <div className="text-center md:text-left">
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-3 block">The Chronicle</span>
                   <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold text-white tracking-tight leading-none">Day by Day Plan.</h2>
                 </div>
                 {pdfUrl && (
                   <a 
                     href={pdfUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="self-center md:self-auto px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-lg shrink-0 cursor-pointer"
                   >
                     <FileDown size={14} className="text-amber-400" />
                     {isPdf ? "Download Itinerary (PDF)" : "View Itinerary Flyer"}
                   </a>
                 )}
               </div>

               {experience.itinerary && experience.itinerary.length > 0 && (
                 <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
                    {experience.itinerary.map((day: any, i: number) => (
                      <ItineraryDay key={i} day={day} index={i + 1} />
                    ))}
                 </div>
               )}
            </section>
          )}

          {/* 5. GALLERY (Masonry Grid & Lightbox Trigger) */}
          {experience.gallery && experience.gallery.length > 0 && (
            <section className="px-4 md:px-8 max-w-7xl mx-auto w-full">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                 <div>
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-3 block">Visuals</span>
                   <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold text-white tracking-tight leading-none">Gallery.</h2>
                 </div>
                 <button 
                   onClick={() => setIsLightboxOpen(true)} 
                   className="hidden md:flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95"
                 >
                   View All Photos <ChevronRight size={16} />
                 </button>
               </div>

               {/* Grid Layout */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 rounded-[2.5rem] overflow-hidden">
                  {experience.gallery.slice(0, 5).map((img: string, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => { setCurrentImageIndex(i); setIsLightboxOpen(true); }} 
                      className={cn("relative aspect-square cursor-pointer group bg-white/5 overflow-hidden", i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "")}
                    >
                      <Image src={img} alt={`Gallery ${i}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 33vw" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      {i === 4 && experience.gallery.length > 5 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 transition-all hover:bg-black/70">
                          <span className="text-white font-medium text-2xl">+{experience.gallery.length - 5}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">More</span>
                        </div>
                      )}
                    </div>
                  ))}
               </div>
               
               <button 
                 onClick={() => setIsLightboxOpen(true)} 
                 className="md:hidden mt-4 flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-white/10 text-xs font-black uppercase tracking-widest text-white w-full active:scale-95 transition-transform"
               >
                 View All Photos
               </button>
            </section>
          )}

          {/* 6. PRICING (Clean Tabular Layout) */}
          <section className="px-4 md:px-8 max-w-7xl mx-auto w-full">
             <div className="text-center md:text-left mb-10 md:mb-12">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-3 block">Investment</span>
               <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold text-white tracking-tight leading-none">Pricing Details.</h2>
             </div>

             <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] p-6 md:p-12 w-full flex flex-col md:flex-row items-center gap-10 md:gap-16">
                <div className="flex-1 flex flex-col gap-2 w-full text-center md:text-left">
                   <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                     {pricing.hasSavings && (
                       <span className="text-white/30 font-bold line-through text-lg">{pricing.symbol}{pricing.originalTotal.toLocaleString()}</span>
                     )}
                     {pricing.hasSavings && (
                       <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">Save {pricing.discountPercent}%</span>
                     )}
                   </div>
                   <span className="text-[clamp(3.5rem,8vw,5.5rem)] font-bold text-white tracking-tighter leading-none tabular-nums">
                     {pricing.formattedFinal}
                   </span>
                   <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/40 mt-3 block">
                     Per Person · {pricing.taxLabel}
                   </span>
                </div>

                {/* Receipt Card Breakdown */}
                <div className="w-full md:w-[360px] shrink-0 bg-black/40 rounded-[2rem] p-6 md:p-8 border border-white/[0.08] space-y-5 shadow-2xl">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-5 border-b border-white/10 pb-4">Manifest Breakdown</h4>
                  
                  <div className="flex justify-between items-center text-sm text-white/90 font-medium">
                    <span>Base (Land)</span>
                    <span className="tabular-nums font-bold tracking-tight">{pricing.symbol}{(pricing.breakdown?.landBase || 0).toLocaleString()}</span>
                  </div>
                  
                  {(pricing.breakdown?.flightNet || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm text-blue-400 font-medium">
                      <span className="flex items-center gap-2"><Plane size={14} /> Flights</span>
                      <span className="tabular-nums font-bold tracking-tight">+{pricing.symbol}{(pricing.breakdown?.flightNet || 0).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-emerald-400/80 font-medium pb-5 border-b border-white/10">
                    <span>Taxes (GST {pricing.taxRate}%)</span>
                    <span className="tabular-nums font-bold tracking-tight">+{pricing.symbol}{(pricing.breakdown?.taxAmount || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-end text-xl text-white font-black pt-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total</span>
                    <span className="tabular-nums tracking-tighter">{pricing.formattedFinal}</span>
                  </div>
                </div>
             </div>
          </section>

          {/* 7. BEGIN YOUR JOURNEY (Scrub Text Call to Action) */}
          <section className="text-center pt-10 pb-4 md:pb-8 px-6">
            <div className="w-16 md:w-24 h-[1px] bg-white/20 mx-auto mb-16" />
            <ScrubText 
              text="Your journey begins here. A fully tailored, immersive sanctuary crafted entirely for your desires." 
              className="justify-center text-[clamp(1.75rem,5vw,4rem)] text-white/90 leading-tight font-medium tracking-tight max-w-5xl mx-auto" 
              scroller={scrollerEl} 
            />
            
            <div className="mt-24 flex flex-col items-center">
              <Magnetic intensity={0.2}>
                <button 
                  onClick={() => openModal('BOOKING', experience)}
                  className="group/btn flex flex-col items-center gap-6"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-black flex items-center justify-center group-hover/btn:scale-110 transition-all duration-700 shadow-[0_0_40px_rgba(255,255,255,0.15)] group-hover/btn:shadow-[0_0_60px_rgba(255,255,255,0.3)]">
                    <ChevronRight size={32} strokeWidth={2} className="group-hover/btn:translate-x-1 transition-transform duration-500" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover/btn:text-white group-hover/btn:tracking-[0.6em] transition-all duration-700">
                    Reserve This Journey
                  </span>
                </button>
              </Magnetic>
            </div>
          </section>
        </div>
      </div>



      {isActive && (
        <>
          <svg className="hidden">
            <defs>
              <filter id="pill-goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>
            </defs>
          </svg>

          <div className="fixed bottom-4 md:bottom-8 left-0 right-0 px-4 md:px-10 z-[120] pointer-events-none flex justify-center animate-in slide-in-from-bottom-12 duration-[1.2s] cubic-bezier(0.23,1,0.32,1)">
        <div 
          ref={pillRef}
          onMouseMove={(e) => handleGlowMove(e.clientX, e.clientY)}
          onMouseEnter={(e) => handleGlowMove(e.clientX, e.clientY)}
          onMouseLeave={handleGlowLeave}
          onTouchStart={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleGlowLeave}
          className="relative flex items-center justify-between rounded-full pointer-events-auto mx-auto transform-gpu will-change-[width,transform] w-full md:w-fit max-w-[calc(100vw-32px)] md:max-w-[calc(100vw-80px)] overflow-hidden"
        >
          {/* ════ PHYSICAL JELLY SHELL ════ */}
          <div 
            ref={jellyRef}
            className="relative flex items-center justify-between py-2.5 pl-6 pr-3 md:p-2 transform-gpu w-full"
          >
            {/* Background Layer */}
            <div className="absolute inset-0 bg-black/95 backdrop-blur-[40px] border border-white/20 rounded-full shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-[border-color] duration-300 pointer-events-none" />

            {/* iOS 26 Pointer-Tracking Glow Overlay */}
            <div 
              ref={glowRef}
              className="absolute inset-0 rounded-full pointer-events-none z-[1] transition-opacity duration-300"
              style={{ opacity: 0, mixBlendMode: 'screen' }}
            />

            {/* Content Container (Wrapped in Jelly) */}
            <div className="relative z-10 flex items-center justify-between w-full h-full gap-2 md:gap-4 lg:gap-6">

              {/* ── MOBILE LAYOUT (< md): Full info + icon-only Reserve ── */}
              <div className="flex md:hidden items-center gap-3 flex-1 min-w-0">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  {/* Label */}
                  <span className="text-[7px] font-black uppercase tracking-[0.35em] text-white/30 leading-none">Investment</span>
                  
                  {/* Primary Price Area */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[1.35rem] font-black text-white leading-none tabular-nums tracking-tighter">
                      {pricing.formattedFinal}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40 border-l border-white/10 pl-2 leading-none">
                      / Person
                    </span>
                  </div>
                  
                  {/* Info Row: savings + flight + tax */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {pricing.hasSavings && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-medium text-white/25 line-through tabular-nums">{pricing.symbol}{pricing.originalTotal.toLocaleString()}</span>
                        <span className="text-[7px] font-black uppercase text-emerald-400">−{pricing.discountPercent}%</span>
                      </div>
                    )}
                    {(experience.flights_status === 'included' || experience.flights_status === 'on_request') && (
                      <div className="flex items-center gap-1 text-blue-400">
                        <Plane size={8} />
                        <span className="text-[7px] font-black uppercase tracking-wide">
                          {experience.flights_status === 'included' ? 'Flights Incl.' : 'On Request'}
                        </span>
                      </div>
                    )}
                    {(pricing.taxLabel) && (
                      <span className="text-[7px] font-bold text-white/25 uppercase tracking-wide">{pricing.taxLabel}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── DESKTOP LAYOUT (md+): Full metadata stack ── */}
              <div className="hidden md:flex items-center min-w-0" ref={segmentsRef}>
                <div className="flex items-center justify-center px-2 md:px-6 gap-3 md:gap-4">
                  
                  {/* Primary Price */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="font-black uppercase text-white/50 whitespace-nowrap text-center mb-0.5 text-[7px] tracking-[0.4em]">
                      Investment
                    </span>
                    <p className="font-bold tracking-tighter text-white/90 leading-none tabular-nums whitespace-nowrap text-[clamp(1.25rem,5vw,2rem)]">
                      {pricing.formattedFinal}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-8 bg-white/10 shrink-0" />

                  {/* Secondary Metadata */}
                  <div className="flex flex-col items-start justify-center gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider text-white/40 leading-none whitespace-nowrap text-[8px]">
                        / Person
                      </span>
                      {pricing.hasSavings && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium tracking-tight text-white/30 line-through whitespace-nowrap text-[10px]">
                            {pricing.symbol}{pricing.originalTotal.toLocaleString()}
                          </span>
                          <span className="font-black uppercase tracking-wider text-emerald-400 leading-none whitespace-nowrap text-[8px]">
                            Save {pricing.discountPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {(experience.flights_status === 'included' || experience.flights_status === 'on_request') && (
                        <div className="flex items-center gap-1 text-blue-400">
                          <Plane size={9} />
                          <span className="text-[7px] font-black uppercase tracking-wider">
                            {experience.flights_status === 'included' ? 'Flights Incl.' : 'Flights Req.'}
                          </span>
                          <div className="w-px h-2 bg-white/20" />
                        </div>
                      )}
                      {(pricing.shouldAddTaxLabel || pricing.isInclusive) && (
                        <span className="font-bold uppercase tracking-wider text-white/40 leading-none whitespace-nowrap text-[7px]">
                          {pricing.taxLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Button — icon-only on mobile, full on desktop */}
              <div ref={actionRef} className="flex items-center justify-end shrink-0 pl-1 md:pl-3">
                <Magnetic intensity={0.3}>
                  <button 
                    onClick={() => openModal('BOOKING', experience)}
                    className="group/btn relative overflow-hidden rounded-full bg-white text-black transition-all duration-700 active:scale-95 flex items-center justify-center
                      h-10 w-10 md:h-12 md:w-auto md:px-10"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-1.5">
                      {/* Mobile: icon only */}
                      <ChevronRight strokeWidth={2.5} className="text-black group-hover/btn:translate-x-0.5 transition-transform shrink-0 w-4 h-4 md:hidden" />
                      {/* Desktop: text + icon */}
                      <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                        Reserve
                      </span>
                      <ChevronRight strokeWidth={2.5} className="text-black hidden md:block group-hover/btn:translate-x-1 transition-transform shrink-0 w-[18px] h-[18px]" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  </button>
                </Magnetic>
              </div>
            </div>
          </div>
          </div>
      </div>
      </>
      )}

      {/* 9. FULLSCREEN LIGHTBOX */}
      {isLightboxOpen && experience?.gallery?.[currentImageIndex] && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300"
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[410] bg-gradient-to-b from-black/60 to-transparent">
            <div className="text-white/60 font-bold text-sm tabular-nums tracking-widest">
              {String(currentImageIndex + 1).padStart(2, '0')} / {String(experience.gallery.length).padStart(2, '0')}
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
            >
              <X size={20} />
            </button>
          </div>

          {/* Centered Image */}
          <div className="relative w-full h-full flex items-center justify-center p-0 md:p-12">
            <Image
              src={experience.gallery[currentImageIndex]}
              alt={`${experience.title} full view`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          
          {/* Navigation Controls */}
          {experience.gallery.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : experience.gallery.length - 1)}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/20 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 z-[410]"
              >
                <ChevronRight size={28} className="rotate-180" strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setCurrentImageIndex(prev => prev < experience.gallery.length - 1 ? prev + 1 : 0)}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/20 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 z-[410]"
              >
                <ChevronRight size={28} strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
});
