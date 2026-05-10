"use client";

import { useEffect, useRef, useState, memo, useMemo, useCallback, useLayoutEffect } from "react";
import Image from "next/image";
import { ChevronRight, Clock, Users, Compass, ShieldCheck, MapPin, Sparkles, Calendar } from "lucide-react";
import { Magnetic } from "../Magnetic";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import gsap from "gsap";

const TAX_INCLUSIVE_LABEL = "Inclusive of Taxes";
const TAX_EXCLUSIVE_LABEL = "Exclusive of Taxes";

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
  const [scrollTop, setScrollTop] = useState(0);
  const [settings, setSettings] = useState<any>({});
  const [activeSection, setActiveSection] = useState(0);

  const pillRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const jellyRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  // ═══ SOVEREIGN FISCAL ENGINE ═══
  const pricing = useMemo(() => {
    if (!experience?.price) return { finalTotal: 0, symbol: "₹", label: "", taxRate: 0 };

    const taxRate = parseFloat(settings.tax_percentage || "0");
    const symbol = settings.currency_symbol || experience.currency || "₹";
    
    // Parse raw numeric value from price string
    const base = parseInt(String(experience.price).replace(/[^0-9]/g, "")) || 0;
    
    const isInclusive = experience.tax_status === TAX_INCLUSIVE_LABEL;
    const isExclusive = experience.tax_status === TAX_EXCLUSIVE_LABEL;

    // Calculate Gross Rate
    // If Inclusive -> We add tax to the base to show the total price to the user.
    // If Exclusive -> We show the base price and add the "+ Tax" label.
    const grossPrice = isInclusive && taxRate > 0 ? base + (base * taxRate / 100) : base;
    const shouldAddTaxLabel = isExclusive && taxRate > 0;
    
    return {
      finalTotal: grossPrice,
      symbol,
      taxRate,
      shouldAddTaxLabel,
      isInclusive
    };
  }, [experience, settings]);

  const [isMobile, setIsMobile] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [scrollMask, setScrollMask] = useState<'right' | 'left' | 'both' | 'none'>('none');

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
  }, [pricing.finalTotal, activeSection]);

  // ═══ KINETIC MASK ENGINE ═══
  useEffect(() => {
    const el = segmentsRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollWidth <= clientWidth + 4) {
        setScrollMask('none');
        return;
      }
      const isAtStart = scrollLeft <= 5;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 20;
      if (isAtStart) setScrollMask('right');
      else if (isAtEnd) setScrollMask('left');
      else setScrollMask('both');
    };

    el.addEventListener('scroll', handleScroll);
    handleScroll();
    const ro = new ResizeObserver(handleScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      ro.disconnect();
    };
  }, [pricing.finalTotal, isMobile]);

  // ═══ ADAPTIVE GEOMETRY ENGINE ═══
  useLayoutEffect(() => {
    if (!pillRef.current || !segmentsRef.current || !actionRef.current) return;
    const updateGeometry = () => {
      if (!pillRef.current || !segmentsRef.current || !actionRef.current) return;
      const vw = window.innerWidth;
      const sw = segmentsRef.current.scrollWidth;
      const aw = actionRef.current.scrollWidth;
      const gap = Math.min(Math.max(vw * 0.02, 4), 32);
      const padding = 16;
      const naturalWidth = sw + aw + gap + padding;
      const safeMargin = Math.min(Math.max(vw * 0.04, 24), 80);
      const targetWidth = Math.min(naturalWidth, vw - safeMargin);
      
      setIsOverflowing(naturalWidth > vw - safeMargin);
      gsap.to(pillRef.current, {
        width: targetWidth,
        duration: 1.5,
        ease: "elastic.out(1, 0.35)",
        force3D: true
      });
    };
    updateGeometry();
    window.addEventListener('resize', updateGeometry);
    return () => window.removeEventListener('resize', updateGeometry);
  }, [pricing.finalTotal, activeSection]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const index = parseInt(id.split('-')[1]);
            if (!isNaN(index)) setActiveSection(index);
          }
        });
      },
      {
        root: scrollRef.current,
        threshold: 0.5,
      }
    );

    const sections = scrollRef.current?.querySelectorAll('[id^="section-"]');
    sections?.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [experience?.itinerary, settings]);

  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  };

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error(err));
  }, []);



  if (!experience) return null;

  return (
    <div 
      ref={scrollRef}
      className="relative w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide bg-[#020202] selection:bg-white/20 selection:text-white scroll-smooth snap-y snap-mandatory"
    >
      
      {/* ═══ STABLE ATMOSPHERE ENGINE ═══ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 transition-transform duration-[1s] ease-out will-change-transform"
          style={{ 
            transform: `translate3d(0, ${scrollTop * 0.2}px, 0) scale(${1 + (scrollTop * 0.0002)})`,
            transformOrigin: 'center center'
          }}
        >
          <Image
            src={experience.image}
            alt={experience.title}
            fill
            className="object-cover opacity-75 grayscale-[0.05] brightness-[0.85]"
            quality={100}
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-[#020202]/10 to-[#020202]" />
      </div>

      {/* ═══ THE SYMMETRICAL NARRATIVE ═══ */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-8 lg:px-12">
        
        {/* CHAPTER I: THE ENTRANCE */}
        <section 
          id="section-0"
          className="h-screen flex flex-col items-center justify-center text-center py-40 animate-in fade-in duration-1000 snap-center snap-always"
        >
          <div className="space-y-10">
            <div className="flex flex-col items-center gap-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white">{experience.location}</span>
              <div className="w-12 h-[1px] bg-white/60" />
            </div>
            <h1 className="text-[clamp(2.5rem,8vw,8rem)] font-bold tracking-tight text-white leading-[0.9] drop-shadow-2xl">
              {experience.title}
            </h1>
            <p className="text-[clamp(1.1rem,1.8vw,2.2rem)] text-white font-medium tracking-tight italic max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
              {experience.tagline}
            </p>
          </div>
        </section>

        {/* CHAPTER II: THE VISION (Fully Centered Stack) */}
        <section 
          id="section-1"
          className="h-screen flex flex-col items-center justify-center text-center py-40 space-y-6 animate-in fade-in duration-1000 delay-300 snap-center snap-always"
        >
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/60">Aperture</span>
            <h2 className="text-4xl lg:text-7xl font-bold text-white tracking-tight leading-none">The Story</h2>
          </div>
          
          <div className="w-full max-w-3xl space-y-8">
            <p className="text-base lg:text-xl text-white leading-relaxed font-medium tracking-normal drop-shadow-md">
              {experience.description}
            </p>

            <div className="grid grid-cols-2 gap-3 w-full max-w-2xl mx-auto">
              {[
                { label: 'Journey', val: experience.duration, icon: Clock },
                { label: 'Ideal For', val: experience.guests, icon: Users },
                { label: 'Optimum', val: experience.season, icon: Calendar }
              ].map((stat, i) => (
                <div key={i} className={cn(
                  "p-5 rounded-[2rem] bg-white/[0.06] border border-white/20 flex flex-col items-center justify-center text-center gap-3 hover:bg-white/[0.1] hover:border-white/40 transition-all duration-700",
                  i === 2 && "col-span-2"
                )}>
                  <stat.icon size={16} className="text-white/80" />
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-[0.4em] text-white/60 mb-1">{stat.label}</span>
                    <span className="text-[10px] lg:text-xs font-bold text-white uppercase tracking-[0.2em] leading-relaxed break-words">{stat.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CHAPTER III: THE CHRONICLE (Minimalist Timeline) */}
        {experience.itinerary && (
          <section className="py-48 flex flex-col items-center text-center space-y-32 relative">
            <div 
              id="section-2"
              className="space-y-4 h-[60vh] flex flex-col items-center justify-center snap-center snap-always"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/40">Chronicle</span>
              <h2 className="text-5xl lg:text-[8rem] font-bold text-white tracking-tight leading-none">The Path</h2>
            </div>

            <div className="relative w-full max-w-2xl space-y-40 mb-40">
              {experience.itinerary.map((item: any, i: number) => (
                <div 
                  key={i}
                  id={`section-${3 + i}`}
                  className="relative group flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-1000 snap-center snap-always"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  {/* DAY ANCHOR */}
                  <div className="relative z-10 px-8 py-3 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl text-white/90 flex items-center justify-center font-bold text-[9px] uppercase tracking-[0.4em] mb-12">
                    Day {item.day < 10 ? `0${item.day}` : item.day}
                  </div>

                  {/* NARRATIVE */}
                  <div className="space-y-6 max-w-xl mb-20">
                    <h4 className="text-3xl lg:text-5xl font-bold text-white tracking-tight leading-none">{item.title}</h4>
                    <p className="text-lg lg:text-2xl text-white/80 leading-relaxed font-medium">{item.description}</p>
                  </div>

                  {/* CONNECTIVE SEGMENT (only if not last) */}
                  {i < experience.itinerary.length - 1 && (
                    <div className="absolute top-[calc(100%-20px)] w-[1.5px] h-32 bg-white/20" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CHAPTER IV: SIGNATURES (Centered Highlights) */}
        <section 
          id={`section-${3 + (experience.itinerary?.length || 0)}`}
          className="h-screen flex flex-col items-center justify-center text-center py-40 space-y-12 animate-in fade-in duration-1000 snap-center snap-always"
        >
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/40">Distinction</span>
            <h2 className="text-5xl lg:text-[8rem] font-bold text-white tracking-tight leading-none">Essence</h2>
            <p className="text-xl lg:text-2xl text-white/60 italic font-medium max-w-2xl mx-auto">
              "Hallmarks of a journey meticulously redefined."
            </p>
          </div>
          
          <div className="w-full max-w-3xl grid gap-4">
            {experience.highlights?.map((item: string, i: number) => (
              <div key={i} className="flex flex-col items-center justify-center p-6 lg:p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-700 group gap-2">
                <Sparkles size={20} className="text-white/20 group-hover:text-white/40 transition-all duration-700" />
                <span className="text-xl lg:text-3xl text-white/90 font-bold tracking-tight transition-all duration-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section 
          id={`section-${4 + (experience.itinerary?.length || 0)}`}
          className="h-screen flex flex-col items-center justify-center text-center py-40 space-y-12 snap-center snap-always"
        >
          <div className="w-24 h-[1px] bg-white/20" />
          <h3 className="text-2xl lg:text-5xl font-light text-white/70 italic tracking-widest uppercase">The Journey Begins.</h3>
        </section>

      </div>

      {/* ═══ CELESTIAL NAVIGATION TRACK ═══ */}
      <div className="fixed right-4 lg:right-10 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-4 pointer-events-none">
        {[
          'Entrance',
          'Story',
          'Chronicle',
          ...(experience.itinerary?.map((_: any, i: number) => `Day ${i + 1}`) || []),
          'Essence',
          'Legacy'
        ].map((label, idx) => {
          const isActive = activeSection === idx;

          return (
            <div key={idx} className="group relative flex items-center justify-center">
              <div className={cn(
                "w-[2px] transition-all duration-700 rounded-full",
                isActive ? "h-6 bg-white/60 shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "h-2 bg-white/10"
              )} />
              <span className={cn(
                "absolute right-6 text-[7px] font-bold uppercase tracking-[0.3em] text-white/0 transition-all duration-500 whitespace-nowrap hidden lg:block",
                isActive && "text-white/40"
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ═══ THE SYMMETRICAL DOCK ═══ */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-fit flex justify-center pointer-events-none px-6">
        <div 
          ref={pillRef}
          onMouseMove={(e) => handleGlowMove(e.clientX, e.clientY)}
          onMouseEnter={(e) => handleGlowMove(e.clientX, e.clientY)}
          onMouseLeave={handleGlowLeave}
          onTouchStart={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleGlowLeave}
          className="relative pointer-events-auto flex items-center justify-between p-1.5 bg-black/95 backdrop-blur-[40px] border border-white/20 rounded-full shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-700 group overflow-hidden"
          style={{ width: 'auto' }}
        >
          {/* ════ PHYSICAL JELLY SHELL ════ */}
          <div 
            ref={jellyRef}
            className="absolute inset-0 bg-black/5 pointer-events-none rounded-full"
          />

          {/* iOS 26 Pointer-Tracking Glow Overlay */}
          <div 
            ref={glowRef}
            className="absolute inset-0 rounded-full pointer-events-none z-[1] transition-opacity duration-300"
            style={{ opacity: 0, mixBlendMode: 'screen' }}
          />

          <div className={cn(
            "relative z-10 flex items-center min-w-0 transition-[mask-image] scrollbar-hide",
            isOverflowing ? "overflow-x-auto scroll-snap-x" : "overflow-x-hidden",
            scrollMask === 'right' && "mask-fade-right",
            scrollMask === 'left' && "mask-fade-left",
            scrollMask === 'both' && "mask-fade-both"
          )} ref={segmentsRef}>
            <div className="flex items-center pl-8 pr-8 border-r border-white/10 shrink-0">
              <div className="flex flex-col">
                <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-white/40 mb-1">Investment</span>
                <div className="text-sm lg:text-lg font-bold text-white/80 tabular-nums tracking-tighter flex items-center gap-2 whitespace-nowrap">
                  <span>{pricing.symbol}{pricing.finalTotal.toLocaleString()}</span>
                  <span className="text-[7px] lg:text-[9px] font-medium text-white/40 uppercase tracking-wider">/ Person</span>
                  
                  {(pricing.shouldAddTaxLabel || (pricing.isInclusive && pricing.taxRate > 0)) && (
                    <div className="flex items-center px-2 lg:px-3 py-0.5 lg:py-1 rounded-full bg-white/[0.03] border border-white/10 shadow-inner">
                      <span className="text-[6px] lg:text-[7px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">
                        {pricing.shouldAddTaxLabel ? `+ ${pricing.taxRate}% GST` : "Incl. Taxes"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div ref={actionRef} className="relative z-10 pl-2 pr-1.5 shrink-0">
            <Magnetic intensity={0.3}>
              <button 
                onClick={() => openModal('BOOKING', experience)}
                className="relative overflow-hidden bg-white text-black px-12 py-4.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-500 group-hover:bg-[#f0f0f0] active:scale-95 flex items-center gap-2"
              >
                <span>Reserve</span>
                <ChevronRight size={14} className="transition-transform duration-500 group-hover:translate-x-1" />
              </button>
            </Magnetic>
          </div>
        </div>
      </div>

    </div>
  );
});
