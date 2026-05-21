"use client";

import { useEffect, useRef, useState, memo, useMemo, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronRight, IndianRupee, CreditCard, Banknote, Clock, Users, Compass, ShieldCheck, MapPin, Sparkles, Calendar, Plane, ArrowRight } from "lucide-react";
import { Magnetic } from "../Magnetic";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { usePricing } from "@/hooks/usePricing";
import { PackageBadges } from "@/components/ui/PackageBadges";

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
  const { computePrice, settings } = usePricing();
  const [activeSection, setActiveSection] = useState(0);
  const [relatedPackages, setRelatedPackages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Listen to keyboard event (Escape key) to dismiss full view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Gallery Horizontal Scroll Snap Logic ──
  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleGalleryScroll = useCallback(() => {
    if (isNavigatingRef.current || !galleryScrollRef.current) return;
    const { scrollLeft, clientWidth } = galleryScrollRef.current;
    if (clientWidth === 0) return;
    const index = Math.round(scrollLeft / clientWidth);
    if (index >= 0 && index < (experience?.gallery?.length || 0)) {
      setCurrentImageIndex(index);
    }
  }, [experience?.gallery]);

  const triggerNavigation = useCallback((targetIndex: number) => {
    if (!galleryScrollRef.current) return;
    
    isNavigatingRef.current = true;
    if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
    
    setCurrentImageIndex(targetIndex);
    
    const clientWidth = galleryScrollRef.current.clientWidth;
    galleryScrollRef.current.scrollTo({
      left: targetIndex * clientWidth,
      behavior: 'smooth'
    });
    
    navigationTimeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 450);
  }, []);

  const handleNavClick = useCallback((direction: 'prev' | 'next') => {
    if (!experience?.gallery) return;
    let targetIndex = currentImageIndex;
    const galleryLength = experience.gallery.length;
    if (direction === 'prev') {
      targetIndex = currentImageIndex === 0 ? galleryLength - 1 : currentImageIndex - 1;
    } else {
      targetIndex = currentImageIndex === galleryLength - 1 ? 0 : currentImageIndex + 1;
    }
    triggerNavigation(targetIndex);
  }, [currentImageIndex, experience?.gallery, triggerNavigation]);

  const handleThumbnailClick = useCallback((idx: number) => {
    triggerNavigation(idx);
  }, [triggerNavigation]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
    };
  }, []);

  // ═══ DYNAMIC CHAPTER MANIFEST (Source of Truth) ═══
  const navChapters = useMemo(() => [
    { id: 'entrance', label: 'Introduction', type: 'core' },
    { id: 'story', label: 'The Vision', type: 'core' },
    ...(experience?.gallery?.length > 0 ? [{ id: 'gallery', label: 'Gallery', type: 'optional' }] : []),
    { id: 'chronicle', label: 'Itinerary', type: 'core' },
    ...(experience?.itinerary?.map((_: any, i: number) => ({ id: `day-${i + 1}`, label: `Day ${i + 1}`, type: 'day' })) || []),
    { id: 'logistics', label: 'Logistics', type: 'core' },
    ...(experience?.inclusions?.length > 0 ? [{ id: 'hallmarks', label: 'Inclusions', type: 'optional' }] : []),
    ...(experience?.exclusions?.length > 0 ? [{ id: 'exclusions', label: 'Exclusions', type: 'optional' }] : []),
    ...(experience?.highlights?.length > 0 ? [{ id: 'essence', label: 'Highlights', type: 'optional' }] : []),
    { id: 'investment', label: 'Pricing', type: 'core' },
    ...(experience?.faq?.length > 0 ? [{ id: 'faq', label: 'FAQ', type: 'optional' }] : []),
    ...(relatedPackages.length > 0 ? [{ id: 'related', label: 'Similar', type: 'optional' }] : []),
    { id: 'legacy', label: 'Book Now', type: 'core' }
  ], [
    experience?.itinerary, 
    experience?.inclusions, 
    experience?.exclusions, 
    experience?.highlights,
    experience?.gallery,
    experience?.faq,
    relatedPackages
  ]);

  const scrollToSection = (idx: number) => {
    const section = scrollRef.current?.querySelector(`#section-${idx}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveSection(idx);
    }
  };

  const pillRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const jellyRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  // ═══ SOVEREIGN FISCAL ENGINE ═══
  const pricing = useMemo(() => {
    return computePrice(experience);
  }, [experience, computePrice]);

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

  // ═══ ADAPTIVE GEOMETRY ENGINE (Simplified for Robustness) ═══
  useLayoutEffect(() => {
    if (!pillRef.current) return;
    const updateGeometry = () => {
      if (!pillRef.current) return;
      const vw = window.innerWidth;
      setIsMobile(vw < 768);
    };
    updateGeometry();
    window.addEventListener('resize', updateGeometry);
    return () => window.removeEventListener('resize', updateGeometry);
  }, []);

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
            const index = parseInt(entry.target.id.split('-')[1]);
            if (!isNaN(index)) setActiveSection(index);
          }
        });
      },
      { 
        root: scrollRef.current,
        threshold: 0.3, // Slightly higher for more intentional detection
        rootMargin: "-10% 0px -10% 0px"
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


  // ═══ RELATED PACKAGES ENGINE ═══
  useEffect(() => {
    if (!experience?.id) return;
    const dest = experience.destination || experience.location;
    if (!dest) return;

    fetch(`/api/packages?destination=${encodeURIComponent(dest)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const filtered = (data || []).filter((p: any) => p.id !== experience.id);
        setRelatedPackages(filtered);
      })
      .catch(() => setRelatedPackages([]));
  }, [experience?.id, experience?.destination, experience?.location]);

  if (!experience) return null;

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide selection:bg-white/20 selection:text-white scroll-smooth snap-y snap-mandatory"
    >
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020202]">
        <div 
          className="absolute inset-0 transition-transform duration-[1s] ease-out will-change-transform"
          style={{ 
            transform: `scale(${1.05 + (scrollTop * 0.00005)})`,
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
            decoding="async"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-[#020202]/10 to-[#020202]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-8 lg:px-12">
        
        <section 
          id={`section-${navChapters.findIndex(c => c.id === 'entrance')}`}
          className="min-h-screen flex flex-col items-center justify-center text-center py-[clamp(5rem,10vw,10rem)] animate-in fade-in duration-1000 snap-center snap-always"
        >
          <div className="space-y-10">
            {/* Location pill removed — title already conveys the destination */}
            <div className="w-12 h-[1px] bg-white/60 mx-auto" />
            <h1 className="text-[clamp(2.5rem,8vw,8rem)] font-bold tracking-tight text-white leading-[0.9] drop-shadow-2xl">
              {experience.title}
            </h1>
            <div className="flex flex-col items-center gap-6 md:gap-10 pt-10 md:pt-16">
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
        </section>

        <section 
          id={`section-${navChapters.findIndex(c => c.id === 'story')}`}
          className="min-h-screen flex flex-col items-center justify-center text-center py-[clamp(5rem,10vw,10rem)] animate-in fade-in duration-1000 snap-center snap-always"
        >
          <h2 className="text-[clamp(2rem,8vw,5rem)] text-balance font-bold text-white tracking-tight leading-none mb-12">The Vision</h2>
          
          <div className="w-full max-w-3xl space-y-12">
            <p className="text-[clamp(1rem,2vw,1.25rem)] text-pretty text-white/90 leading-relaxed font-medium tracking-wide drop-shadow-md">
              {experience.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl mx-auto">
              {[
                { label: 'Journey', val: experience.duration, icon: Clock, show: !!experience.duration },
                { label: 'Season', val: experience.season, icon: Compass, show: !!experience.season },
                { label: 'Ideal For', val: experience.guests, icon: Users, show: !!experience.guests },
              ].filter(p => p.show).map((pill, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-3xl bg-white/[0.03] border border-white/10 group hover:bg-white/[0.06] transition-all duration-700",
                  experience.guests && experience.season && experience.duration && i === 2 && "md:col-span-2 lg:col-span-1"
                )}>
                  <pill.icon size={16} className="text-white/20 group-hover:text-white/60" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">{pill.label}</span>
                    <span className="text-xs font-bold text-white tracking-wide">{pill.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CHAPTER: GALLERY */}
        {experience.gallery && experience.gallery.length > 0 && (
          <section
            id={`section-${navChapters.findIndex(c => c.id === 'gallery')}`}
            className="h-screen w-full flex flex-col snap-center snap-always select-none pt-[164px] pb-[112px] md:pt-[128px] md:pb-[108px]"
          >
            <div className="relative z-10 flex flex-col flex-1 min-h-0 gap-4 px-3 md:px-8">

              {/* ── Label row (High Visibility) ── */}
              <div className="flex items-center justify-between shrink-0 px-2 mt-8 md:mt-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black uppercase tracking-[0.5em] text-amber-400/80">Gallery</span>
                  <span className="text-base font-bold text-white leading-none">{experience.title}</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black tabular-nums tracking-widest text-white">
                  {String(currentImageIndex + 1).padStart(2, '0')}
                  <span className="text-white/30 mx-1.5">/</span>
                  {String(experience.gallery.length).padStart(2, '0')}
                </div>
              </div>

              {/* ── Floating photo card — Horizontal Scrollable Strip ── */}
              <div className="flex-1 min-h-0 w-full relative flex items-center justify-center">

                {/* Golden Ambient Glow (Positioned outside overflow-hidden boundaries to bleed infinitely with zero clipping) */}
                <div
                  key={`glow-${currentImageIndex}`}
                  className="absolute rounded-[2.5rem] bg-amber-500/16 blur-[80px] pointer-events-none transition-all duration-1000 animate-in fade-in"
                  style={{
                    width: 'min(480px, 70%)',
                    height: 'min(280px, 55%)',
                    transform: 'translateY(12px)',
                  }}
                />

                {/* Horizontal Scroll Row with Snap Points */}
                <div
                  ref={galleryScrollRef}
                  onScroll={handleGalleryScroll}
                  className="absolute inset-0 flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-hide items-center gap-0 touch-pan-x"
                  style={{ touchAction: 'pan-x' }}
                >
                  {experience.gallery.map((url: string, idx: number) => (
                    <div
                      key={idx}
                      className="shrink-0 w-full h-full flex items-center justify-center snap-center snap-always px-3"
                    >
                      {/* Photo wrapper card that keeps the rounded gold border 100% stable and glitch-free */}
                      <div
                        onClick={() => setIsLightboxOpen(true)}
                        className="relative w-fit h-fit max-w-[calc(100%-24px)] md:max-w-[min(680px,calc(100%-80px))] max-h-full rounded-[2rem] md:rounded-[2.5rem] border border-amber-400 bg-black/20 overflow-hidden cursor-zoom-in group transition-all duration-500 flex items-center justify-center"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${experience.title} — photo ${idx + 1}`}
                          className="w-auto h-auto max-h-full object-contain block transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.25,1)] group-hover:scale-[1.04]"
                          style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                          }}
                        />

                        {/* Floating "Click to Expand" / "Tap to Expand" Pill Badge */}
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/75 backdrop-blur-md border border-white/10 px-3.5 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 transform scale-90 group-hover:scale-100 group-active:scale-100 transition-all duration-500 shadow-2xl">
                            {/* Simple inline zoom SVG */}
                            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-white/90">
                              <span className="md:hidden">Tap to Expand</span>
                              <span className="hidden md:inline">Click to Expand</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Left chevron — floats over, high visibility (hidden on mobile) */}
                <button
                  type="button"
                  onClick={() => handleNavClick('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10
                             w-9 h-14 rounded-2xl
                             bg-white/10 hover:bg-white/20 backdrop-blur-md
                             border border-white/15 hover:border-white/30
                             hidden md:flex items-center justify-center
                             transition-all duration-200 active:scale-95 group shadow-lg"
                >
                  <svg className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Right chevron — high visibility (hidden on mobile) */}
                <button
                  type="button"
                  onClick={() => handleNavClick('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10
                             w-9 h-14 rounded-2xl
                             bg-white/10 hover:bg-white/20 backdrop-blur-md
                             border border-white/15 hover:border-white/30
                             hidden md:flex items-center justify-center
                             transition-all duration-200 active:scale-95 group shadow-lg"
                >
                  <svg className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* ── Thumbnail strip — dynamic sizing for mobile ── */}
              <div 
                className={cn(
                  "shrink-0 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide py-3.5 px-4 w-full transition-all duration-[0.8s] ease-[cubic-bezier(0.25,1,0.25,1)] transform-gpu",
                  activeSection === navChapters.findIndex(c => c.id === 'gallery')
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-4 pointer-events-none"
                )}
              >
                {experience.gallery.map((url: string, idx: number) => {
                  const active = idx === currentImageIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleThumbnailClick(idx)}
                      className={cn(
                        "relative shrink-0 rounded-xl md:rounded-2xl overflow-hidden border transition-all duration-300",
                        "h-8 md:h-12",
                        active
                          ? "w-12 md:w-20 border-amber-400 opacity-100 scale-105"
                          : "w-8 md:w-12 border-white/10 opacity-40 hover:opacity-80 hover:border-white/30 scale-95"
                      )}
                    >
                      <Image
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        quality={35}
                        unoptimized
                        decoding="async"
                      />
                    </button>
                  );
                })}
              </div>

            </div>
          </section>
        )}

        {/* CHAPTER III: THE ITINERARY (Cinematic Narrative Edition) */}
        {experience.itinerary && experience.itinerary.length > 0 && (
          <section className="relative w-full max-w-4xl mx-auto px-6 lg:px-0 py-12 md:py-24">
            <div className="absolute left-8 lg:left-0 top-0 bottom-0 w-[1.5px] bg-white/10 z-0 -translate-x-1/2">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent blur-[1px]" />
            </div>

            <div className="space-y-32">
              <div 
                id={`section-${navChapters.findIndex(c => c.id === 'chronicle')}`}
                className="relative min-h-[40vh] flex flex-col justify-center snap-center snap-always"
              >
                <div className="absolute left-0 -translate-x-1/2 top-1/2 z-20 bg-black rounded-full p-1 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <Compass size={28} className="text-white animate-pulse" strokeWidth={1.5} />
                </div>

                <div className="pl-10 md:pl-16 lg:pl-24">
                  <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/30 mb-4 block">Day-by-Day Plan</span>
                  <h2 className="text-[clamp(2rem,9vw,7rem)] text-balance font-black text-white tracking-tighter leading-none">Itinerary.</h2>
                </div>
              </div>

              {experience.itinerary.map((item: any, i: number) => (
                <div 
                  key={i}
                  id={`section-${navChapters.findIndex(c => c.id === `day-${i + 1}`)}`}
                  className="relative group/itinerary flex flex-col justify-center snap-center snap-always"
                >
                  {/* Visual Connector Node */}
                  <div className="absolute left-0 -translate-x-1/2 top-0 bottom-0 flex flex-col items-center">
                    <div className="w-[1.5px] h-full bg-white/5 group-hover/itinerary:bg-white/20 transition-colors duration-700" />
                    <div className="absolute top-[20%] w-4 h-4 rounded-full bg-black border-2 border-white/20 group-hover/itinerary:border-white group-hover/itinerary:scale-125 transition-all duration-700 shadow-2xl z-20" />
                  </div>

                  <div className="pl-10 md:pl-16 lg:pl-24 space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="px-6 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl text-white font-black text-[9px] uppercase tracking-[0.4em] shadow-xl group-hover/itinerary:bg-white group-hover/itinerary:text-black transition-all duration-700">
                        Day {item.day < 10 ? `0${item.day}` : item.day}
                      </div>
                      <div className="h-[1px] flex-1 bg-white/[0.05] group-hover/itinerary:bg-white/10 transition-colors duration-700" />
                    </div>

                    <div className="space-y-8">
                      <h4 className="text-[clamp(1.5rem,7vw,4rem)] text-balance font-black text-white tracking-tighter leading-[1.1] transition-transform duration-700 group-hover/itinerary:translate-x-2">
                        {item.title}
                      </h4>
                      
                      <div className="relative">
                        <p className="text-[clamp(1rem,2.5vw,1.5rem)] text-pretty text-white/60 leading-relaxed font-medium tracking-tight max-w-3xl group-hover/itinerary:text-white/90 transition-colors duration-700">
                          {item.description}
                        </p>
                        
                        {/* Decorative editorial flourish */}
                        <div className="mt-8 flex items-center gap-4 opacity-0 group-hover/itinerary:opacity-100 transition-opacity duration-1000 delay-300">
                          <Plane size={14} className="text-white/20" />
                          <div className="w-12 h-[1px] bg-white/10" />
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Journey Narrative</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FLIGHT POLICY INSIGHT */}
        <section 
          id={`section-${navChapters.findIndex(c => c.id === 'logistics')}`}
          className="min-h-screen flex flex-col items-center justify-center text-center py-[clamp(5rem,10vw,10rem)] px-4 md:px-6 snap-center snap-always"
        >
          <div className="w-full max-w-4xl p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-50" />
            
            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
                <Plane className={cn(
                  "w-10 h-10 transition-all duration-1000",
                  experience.flights_status === 'included' ? "text-emerald-400" : 
                  experience.flights_status === 'on_request' ? "text-amber-400" : "text-white/20"
                )} strokeWidth={1} />
                {experience.flights_status === 'excluded' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-[1px] bg-red-500/50 rotate-45" />
                )}
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/30">Flight Details</span>
                <h3 className="text-[clamp(1.75rem,7vw,3rem)] text-balance font-black text-white tracking-tighter">
                  {experience.flights_status === 'included' ? "Airfare Included." : 
                   experience.flights_status === 'on_request' ? "Flights on Request." : "Land Package Only."}
                </h3>
                <p className="text-white/40 text-sm md:text-base font-medium max-w-lg mx-auto leading-relaxed">
                  {experience.flights_status === 'included' ? 
                    "This journey encompasses full round-trip airfare from major hubs, ensuring a seamless portal-to-portal experience." : 
                   experience.flights_status === 'on_request' ? 
                    "Flight arrangements are customized per traveler. Our concierge will curate the optimal routes upon your reservation." : 
                    "International and domestic airfare is curated separately. Travelers enjoy the freedom to utilize miles or preferred carriers."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER IV: INCLUSIONS */}
        {experience.inclusions && experience.inclusions.length > 0 && (
          <section 
            id={`section-${navChapters.findIndex(c => c.id === 'hallmarks')}`}
            className="min-h-screen flex flex-col items-center justify-center text-center py-[clamp(5rem,10vw,10rem)] space-y-8 md:space-y-12 animate-in fade-in duration-1000 snap-center snap-always"
          >
            <h2 className="text-[clamp(2rem,11vw,8rem)] text-balance font-bold text-white tracking-tight leading-none">Inclusions</h2>
            
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0">
              {experience.inclusions.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-4 p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all duration-700 group">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck size={18} className="text-white/70 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-lg lg:text-xl text-white/90 font-bold tracking-tight text-left">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CHAPTER: EXCLUSIONS */}
        {experience.exclusions && experience.exclusions.length > 0 && (
          <section 
            id={`section-${navChapters.findIndex(c => c.id === 'exclusions')}`}
            className="min-h-screen flex flex-col items-center justify-center text-center py-[clamp(5rem,10vw,10rem)] space-y-12 animate-in fade-in duration-1000 snap-center snap-always"
          >
            <h2 className="text-[clamp(2rem,11vw,8rem)] text-balance font-bold text-white tracking-tight leading-none opacity-80">Exclusions</h2>
            
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0">
              {experience.exclusions.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-4 p-6 rounded-[2rem] bg-red-500/[0.02] border border-red-500/10 hover:bg-red-500/[0.05] hover:border-red-500/20 transition-all duration-700 group">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                    <span className="text-red-500/70 group-hover:text-red-400 font-black text-xl transition-colors">×</span>
                  </div>
                  <span className="text-lg lg:text-xl text-white/70 font-bold tracking-tight text-left">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CHAPTER V: HIGHLIGHTS */}
        {experience.highlights && experience.highlights.length > 0 && (
          <section 
            id={`section-${navChapters.findIndex(c => c.id === 'essence')}`}
            className="min-h-screen flex flex-col items-center justify-center text-center py-[clamp(5rem,10vw,10rem)] space-y-12 animate-in fade-in duration-1000 snap-center snap-always"
          >
            <h2 className="text-[clamp(1.75rem,8vw,5rem)] text-balance font-bold text-white tracking-tight leading-none">Highlights</h2>
            
            <div className="w-full max-w-3xl grid gap-4">
              {experience.highlights?.map((item: string, i: number) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 lg:p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-700 group gap-1.5">
                  <Sparkles size={16} className="text-white/40 group-hover:text-white/60 transition-all duration-700" />
                  <span className="text-lg lg:text-xl text-white/70 font-bold tracking-tight transition-all duration-700">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section 
          id={`section-${navChapters.findIndex(c => c.id === 'investment')}`}
          className="min-h-screen lg:h-screen flex items-center justify-center py-16 px-4 sm:px-6 md:px-10 lg:px-16 animate-in fade-in duration-1000 snap-center snap-always"
        >
          <div className="w-full max-w-6xl flex flex-col lg:flex-row items-stretch gap-8 lg:gap-10 relative z-10">
            
            {/* Left Column: Price Hero */}
            <div className="flex-1 flex flex-col justify-center items-center lg:items-start text-center lg:text-left gap-4 md:gap-5 lg:gap-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Sparkles size={12} className="text-white/40" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Pricing</span>
              </div>

              {/* Savings Row */}
              {pricing.hasSavings && (
                <div className="flex items-center gap-3">
                  <span className="text-white/20 text-sm md:text-base font-bold line-through tracking-tighter">
                    {pricing.symbol}{pricing.originalTotal.toLocaleString()}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Save {pricing.discountPercent}%
                  </span>
                </div>
              )}

              {/* Primary Price */}
              <div className="space-y-2">
                <div className="text-[clamp(2rem,10vw,6rem)] font-black text-white tracking-tighter tabular-nums leading-none">
                  {pricing.symbol}{pricing.finalTotal.toLocaleString()}
                </div>
                <span className="block text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-white/25">
                  Per Person · All-Inclusive
                </span>
              </div>

              {/* Metadata Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                {(experience.tax_label || pricing.taxLabel) && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white/25">Tax</span>
                    <span className="text-[8px] md:text-[9px] font-bold text-white/60">{experience.tax_label || pricing.taxLabel}</span>
                  </div>
                )}
                {experience.duration && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white/25">Duration</span>
                    <span className="text-[8px] md:text-[9px] font-bold text-white/60">{experience.duration}</span>
                  </div>
                )}
              </div>

              {/* Itinerary Download — hidden when URL is JSON anchor */}
              {experience.itinerary_url && !experience.itinerary_url.startsWith('{') && (
                <a 
                  href={experience.itinerary_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 self-center lg:self-start"
                >
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shrink-0">
                    <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/25 leading-none mb-0.5">Digital Asset</span>
                    <span className="text-[10px] md:text-xs font-bold text-white/60 tracking-tight">Download Itinerary</span>
                  </div>
                </a>
              )}
            </div>

            {/* Right Column: Sovereign Manifest */}
            <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 p-5 sm:p-6 md:p-7 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] backdrop-blur-2xl relative overflow-hidden animate-in slide-in-from-bottom-8 duration-1000 delay-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              
              {/* Manifest Header */}
              <div className="flex items-center gap-2 mb-5 relative z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-white/25">Price Breakdown</span>
              </div>
              
              {/* Ledger Items */}
              <div className="space-y-3 relative z-10">

                {/* Ground */}
                <div className="flex justify-between items-center">
                  <span className="text-[9px] md:text-[10px] font-black text-white/25 uppercase tracking-[0.15em]">Ground & Services</span>
                  <span className="text-xs md:text-sm font-bold text-white tracking-tighter tabular-nums">
                    {pricing.symbol}{(pricing.breakdown?.landBase || 0).toLocaleString()}
                  </span>
                </div>
                
                {/* Tax */}
                <div className="flex justify-between items-center">
                  <span className="text-[9px] md:text-[10px] font-black text-emerald-400/40 uppercase tracking-[0.15em]">GST ({pricing.taxRate}%)</span>
                  <span className="text-xs md:text-sm font-bold text-emerald-400 tracking-tighter tabular-nums">
                    + {pricing.symbol}{(pricing.breakdown?.taxAmount || 0).toLocaleString()}
                  </span>
                </div>

                {/* Aviation */}
                {(pricing.breakdown?.flightNet || 0) > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-white/[0.04]">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Plane size={10} className="text-blue-400/40" />
                        <span className="text-[9px] md:text-[10px] font-black text-blue-400/40 uppercase tracking-[0.15em]">Airfare</span>
                      </div>
                      <span className="text-xs md:text-sm font-black text-blue-400 tracking-tighter tabular-nums">
                        + {pricing.symbol}{(pricing.breakdown?.flightNet || 0).toLocaleString()}
                      </span>
                    </div>
                    
                    {pricing.breakdown?.flight_segments && pricing.breakdown.flight_segments.length > 0 && (
                      <div className="pl-3.5 space-y-1.5 border-l border-blue-400/10 ml-1">
                        {pricing.breakdown.flight_segments.map((seg: any, idx: number) => seg.label && (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-tight">{seg.label}</span>
                            <span className="text-[9px] font-mono text-blue-300/40 tabular-nums">{pricing.symbol}{Number(seg.price).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="pt-3 mt-1 border-t border-white/[0.08] flex justify-between items-center">
                  <span className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total</span>
                  <span className="text-lg md:text-xl font-black text-white tracking-tighter tabular-nums">
                    {pricing.symbol}{pricing.finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* CHAPTER: FAQ */}
        {experience.faq && experience.faq.length > 0 && (
          <section 
            id={`section-${navChapters.findIndex(c => c.id === 'faq')}`}
            className="min-h-screen flex flex-col items-center justify-center text-center py-[clamp(5rem,10vw,10rem)] space-y-12 animate-in fade-in duration-1000 snap-center snap-always px-6"
          >
            <h2 className="text-[clamp(2rem,11vw,8rem)] text-balance font-bold text-white tracking-tight leading-none">FAQ.</h2>
            <div className="w-full max-w-3xl space-y-4">
              {experience.faq.map((item: { question: string; answer: string }, i: number) => (
                <div key={i} className="text-left p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors">
                  <h4 className="text-xl font-bold text-white/90 mb-3">{item.question}</h4>
                  <p className="text-white/50 leading-relaxed text-sm">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CHAPTER: RELATED PACKAGES */}
        {relatedPackages.length > 0 && (
          <section 
            id={`section-${navChapters.findIndex(c => c.id === 'related')}`}
            className="min-h-screen flex flex-col items-center justify-center text-center py-[clamp(5rem,10vw,10rem)] space-y-12 animate-in fade-in duration-1000 snap-center snap-always px-6"
          >
            <h2 className="text-[clamp(2rem,9vw,6rem)] text-balance font-bold text-white tracking-tight leading-none">Similar<br/><span className="text-white/30">Journeys</span></h2>
            <div className="w-full max-w-5xl overflow-x-auto scrollbar-hide">
              <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
                {relatedPackages.slice(0, 6).map((pkg: any) => {
                  const pricing = computePrice(pkg);
                  return (
                    <button 
                      key={pkg.id}
                      onClick={() => openModal('PACKAGE', pkg, source)}
                      className="group flex-shrink-0 w-[280px] text-left rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                        {pkg.image && (
                          <Image src={pkg.image} alt={pkg.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" quality={60} sizes="280px" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Status Badges Layer */}
                        <PackageBadges pkg={pkg} pricing={pricing} size="sm" className="top-4 left-4 right-4" />
                      </div>
                    <div className="p-5 space-y-2">
                      <h4 className="text-[15px] font-bold text-white tracking-tight truncate">{pkg.title}</h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
                        <span>{pkg.duration}</span>
                        <span className="w-[3px] h-[3px] rounded-full bg-white/20" />
                        <span>{pkg.location}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-bold text-white/70">{pkg.currency || '₹'}{parseInt(String(pkg.price).replace(/[^0-9]/g, '')).toLocaleString()}</span>
                        <ArrowRight size={14} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section 
          id={`section-${navChapters.findIndex(c => c.id === 'legacy')}`}
          className="min-h-screen flex flex-col items-center justify-center text-center py-[clamp(5rem,10vw,10rem)] space-y-12 snap-center snap-always"
        >
          <div className="w-24 h-[1px] bg-white/20" />
          <h3 className="text-[clamp(1.25rem,6vw,3rem)] text-balance font-light text-white/70 italic tracking-widest uppercase">Begin Your Journey.</h3>
        </section>

      </div>

      {/* ═══ MINIMALIST CELESTIAL NAVIGATION TRACK (Laser-Straight Alignment) ═══ */}
      <div className="fixed right-6 lg:right-12 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center pointer-events-none w-1">
        <div className={cn("relative flex flex-col items-center w-full", navChapters.length > 12 ? "gap-3" : "gap-5")}>
          {/* The Static Axis Thread */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-white/10" />
          
          {/* The Dynamic Progress Highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1.5px] overflow-hidden" style={{ height: '100%' }}>
            <div 
              className="w-full bg-white transition-all duration-700 ease-out shadow-[0_0_15px_rgba(255,255,255,0.4)]"
              style={{ height: `${(activeSection / (navChapters.length - 1)) * 100}%` }}
            />
          </div>

          {navChapters.map((chapter, idx) => {
            const isActive = activeSection === idx;

            return (
              <button 
                key={idx} 
                onClick={() => scrollToSection(idx)}
                className="group relative flex items-center justify-center pointer-events-auto cursor-pointer w-full h-4"
              >
                {/* The Integrated Ghost Node */}
                <div className={cn(
                  "absolute left-1/2 -translate-x-1/2 w-[1.5px] transition-all duration-500 rounded-full",
                  isActive ? "h-6 bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)] z-10" : "h-1.5 bg-white/20 group-hover:bg-white/60 z-0"
                )} />

                {/* The Reveal Label */}
                <span className={cn(
                  "absolute right-6 text-[8px] font-bold uppercase tracking-[0.4em] transition-all duration-500 whitespace-nowrap hidden lg:block opacity-0 translate-x-2",
                  isActive ? "opacity-100 translate-x-0 text-white" : "group-hover:opacity-60 group-hover:translate-x-0 text-white/40"
                )}>
                  {chapter.label}
                </span>
              </button>
            );
          })}
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

      {/* Immersive Lightbox Modal Overlay */}
      {isLightboxOpen && experience?.gallery?.[currentImageIndex] && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300 cursor-zoom-out"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Floating Close Button */}
          <div className="absolute top-6 right-6 z-[410]">
            <Magnetic>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="w-12 h-12 rounded-full bg-white hover:bg-white/90 text-black flex items-center justify-center transition-all duration-200 active:scale-95 group shadow-2xl"
              >
                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Magnetic>
          </div>

          {/* Centered Image Card */}
          <div className="relative max-w-[95vw] max-h-[92vh] w-auto h-auto flex items-center justify-center animate-in zoom-in-95 duration-300 pointer-events-none select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={experience.gallery[currentImageIndex]}
              alt={`${experience.title} — full view`}
              className="max-w-full max-h-full w-auto h-auto rounded-3xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.85)]"
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>,
        document.body
      )}

    </>)}
    </div>
  );
});
