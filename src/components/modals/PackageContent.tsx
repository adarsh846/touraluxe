"use client";

import { useEffect, useRef, useState, memo, useMemo, useCallback, useLayoutEffect } from "react";
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

  // ═══ DYNAMIC CHAPTER MANIFEST (Source of Truth) ═══
  const navChapters = useMemo(() => [
    { id: 'entrance', label: 'Introduction', type: 'core' },
    ...(experience?.gallery?.length > 0 ? [{ id: 'gallery', label: 'Gallery', type: 'optional' }] : []),
    { id: 'story', label: 'The Vision', type: 'core' },
    { id: 'chronicle', label: 'Itinerary', type: 'core' },
    ...(experience?.itinerary?.map((_: any, i: number) => ({ id: `day-${i + 1}`, label: `Day ${i + 1}`, type: 'day' })) || []),
    ...(experience?.inclusions?.length > 0 ? [{ id: 'hallmarks', label: 'Inclusions', type: 'optional' }] : []),
    ...(experience?.exclusions?.length > 0 ? [{ id: 'exclusions', label: 'Exclusions', type: 'optional' }] : []),
    ...(experience?.highlights?.length > 0 ? [{ id: 'essence', label: 'Highlights', type: 'optional' }] : []),
    { id: 'investment', label: 'Investment', type: 'core' },
    ...(experience?.faq?.length > 0 ? [{ id: 'faq', label: 'FAQ', type: 'optional' }] : []),
    ...(relatedPackages.length > 0 ? [{ id: 'related', label: 'Similar', type: 'optional' }] : []),
    { id: 'legacy', label: 'Next Steps', type: 'core' }
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
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-[#020202]/10 to-[#020202]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-8 lg:px-12">
        
        <section 
          id="section-0"
          className="min-h-screen flex flex-col items-center justify-center text-center py-40 animate-in fade-in duration-1000 snap-center snap-always"
        >
          <div className="space-y-10">
            <div className="flex flex-col items-center gap-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white">{experience.location}</span>
              <div className="w-12 h-[1px] bg-white/60" />
            </div>
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
          id="section-1"
          className="min-h-screen flex flex-col items-center justify-center text-center py-40 animate-in fade-in duration-1000 snap-center snap-always"
        >
          <h2 className="text-4xl lg:text-7xl font-bold text-white tracking-tight leading-none mb-12">The Vision</h2>
          
          <div className="w-full max-w-3xl space-y-12">
            <p className="text-base lg:text-xl text-white leading-relaxed font-medium tracking-normal drop-shadow-md">
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
            className="min-h-screen flex items-center justify-center snap-center snap-always"
          >
            <div className="w-full h-full p-4 md:p-8 pt-24 pb-24 md:pb-32">
              <div className="w-full h-full rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white/5 relative border border-white/10 flex items-center justify-center">
                {/* We can build a proper carousel here, for now it shows the first image full bleed */}
                <Image
                  src={experience.gallery[0]}
                  alt="Gallery"
                  fill
                  className="object-cover transition-transform duration-[2s] hover:scale-105"
                  quality={85}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-8 right-8 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                  1 / {experience.gallery.length} Images
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CHAPTER III: THE ITINERARY (Cinematic Narrative Edition) */}
        {experience.itinerary && experience.itinerary.length > 0 && (
          <section className="relative w-full max-w-4xl mx-auto px-8 lg:px-0 py-24">
            <div className="absolute left-8 lg:left-0 top-0 bottom-0 w-[1.5px] bg-white/10 z-0 -translate-x-1/2">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent blur-[1px]" />
            </div>

            <div className="space-y-32">
              <div 
                id="section-2"
                className="relative min-h-[40vh] flex flex-col justify-center snap-center snap-always"
              >
                <div className="absolute left-0 -translate-x-1/2 top-1/2 z-20 bg-black rounded-full p-1 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <Compass size={28} className="text-white animate-pulse" strokeWidth={1.5} />
                </div>

                <div className="pl-10 md:pl-16 lg:pl-24">
                  <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/30 mb-4 block">The Narrative</span>
                  <h2 className="text-4xl md:text-5xl lg:text-[7rem] font-black text-white tracking-tighter leading-none">Chronicle.</h2>
                </div>
              </div>

              {experience.itinerary.map((item: any, i: number) => (
                <div 
                  key={i}
                  id={`section-${3 + i}`}
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
                      <h4 className="text-3xl lg:text-6xl font-black text-white tracking-tighter leading-[1.1] transition-transform duration-700 group-hover/itinerary:translate-x-2">
                        {item.title}
                      </h4>
                      
                      <div className="relative">
                        <p className="text-lg lg:text-2xl text-white/60 leading-relaxed font-medium tracking-tight max-w-3xl group-hover/itinerary:text-white/90 transition-colors duration-700">
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
        <section className="min-h-[60vh] flex flex-col items-center justify-center text-center py-20 px-6 snap-center snap-always">
          <div className="w-full max-w-4xl p-12 rounded-[3rem] bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
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
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/30">Logistics Policy</span>
                <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
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
            className="min-h-screen flex flex-col items-center justify-center text-center py-40 space-y-12 animate-in fade-in duration-1000 snap-center snap-always"
          >
            <h2 className="text-5xl lg:text-[8rem] font-bold text-white tracking-tight leading-none">Inclusions</h2>
            
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
            className="min-h-screen flex flex-col items-center justify-center text-center py-40 space-y-12 animate-in fade-in duration-1000 snap-center snap-always"
          >
            <h2 className="text-5xl lg:text-[8rem] font-bold text-white tracking-tight leading-none opacity-80">Exclusions</h2>
            
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
            className="min-h-screen flex flex-col items-center justify-center text-center py-40 space-y-12 animate-in fade-in duration-1000 snap-center snap-always"
          >
            <h2 className="text-3xl lg:text-[5rem] font-bold text-white tracking-tight leading-none">Highlights</h2>
            
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
          className="min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-20 animate-in fade-in duration-1000 snap-center snap-always overflow-hidden"
        >
          <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10 lg:gap-16 py-16">
            
            {/* Left: Branding Narrative (Desktop Highlight) */}
            <div className="flex-1 text-center lg:text-left space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-3 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <Sparkles size={14} className="text-white/80" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Legacy Investment</span>
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-none tracking-tighter">
                Curated <span className="text-white/30 italic">Value</span>
              </h2>
              <p className="text-[11px] md:text-sm lg:text-[15px] text-white/60 max-w-sm mx-auto lg:mx-0 leading-relaxed font-medium italic">
                A masterpiece of travel architecture, where every fiscal detail is refined for absolute transparency and unrivaled excellence.
              </p>
            </div>

            {/* Right: Pricing Pillar & Metadata Manifest */}
            <div className="flex-1 w-full max-w-2xl flex flex-col items-center lg:items-end gap-8 lg:gap-12">
              
              {/* Main Pricing Cluster */}
              <div className="flex flex-col items-center lg:items-end gap-2">
                <div className="flex flex-col items-center lg:items-end gap-2 md:gap-3">
                  {pricing.hasSavings && (
                    <div className="flex flex-col items-center lg:items-start self-center lg:self-start gap-1">
                      <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-white/30">Original Trip Cost</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white/30 text-base md:text-xl font-bold line-through tracking-tighter decoration-white/30">
                          {pricing.symbol}{pricing.originalTotal.toLocaleString()}
                        </span>
                        <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                          Save {pricing.discountPercent}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center lg:items-end gap-2">
                    <div className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter tabular-nums leading-none flex items-center gap-3">
                      {pricing.symbol}{pricing.finalTotal.toLocaleString()}
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/60 bg-white/10 px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/20 whitespace-nowrap">Per Person</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Self-Healing Metadata Grid (Right Aligned on Desktop) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-8 gap-y-5 md:gap-x-12 lg:gap-x-14">
                {(experience.tax_label || pricing.taxLabel) && (
                  <div className="flex flex-col items-center lg:items-end gap-1.5">
                    <span className="text-white/40 text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none">Tax Status</span>
                    <span className="text-white font-bold text-[10px] md:text-xs leading-none">{experience.tax_label || pricing.taxLabel}</span>
                  </div>
                )}
                {experience.duration && (
                  <div className="flex flex-col items-center lg:items-end gap-1.5">
                    <span className="text-white/40 text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none">Duration</span>
                    <span className="text-white font-bold text-[10px] md:text-xs leading-none">{experience.duration}</span>
                  </div>
                )}
                {experience.booking_status && (
                  <div className="flex flex-col items-center lg:items-end gap-1.5">
                    <span className="text-white/40 text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none">Booking</span>
                    <span className="text-white font-bold text-[10px] md:text-xs leading-none">{experience.booking_status}</span>
                  </div>
                )}
                {experience.guests && (
                  <div className="flex flex-col items-center lg:items-end gap-1.5">
                    <span className="text-white/40 text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none">Ideal For</span>
                    <span className="text-white font-bold text-[10px] md:text-xs leading-none">{experience.guests}</span>
                  </div>
                )}
              </div>

              {/* Digital Itinerary Asset Button */}
              {experience.itinerary_url && (
                <div className="pt-2">
                  <a 
                    href={experience.itinerary_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-4 px-6 md:px-8 py-3 md:py-4 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-500"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                      {experience.itinerary_url.toLowerCase().endsWith('.pdf') ? (
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2v20l10-10L7 2z" /></svg>
                      ) : (
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-white/50 leading-none mb-1">Digital Itinerary</span>
                      <span className="text-xs md:text-sm font-bold text-white tracking-tight">Download Full Itinerary</span>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>



        {/* CHAPTER: FAQ */}
        {experience.faq && experience.faq.length > 0 && (
          <section 
            id={`section-${navChapters.findIndex(c => c.id === 'faq')}`}
            className="min-h-screen flex flex-col items-center justify-center text-center py-40 space-y-12 animate-in fade-in duration-1000 snap-center snap-always px-6"
          >
            <h2 className="text-5xl lg:text-[8rem] font-bold text-white tracking-tight leading-none">F.A.Q.</h2>
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
            className="min-h-screen flex flex-col items-center justify-center text-center py-40 space-y-12 animate-in fade-in duration-1000 snap-center snap-always px-6"
          >
            <h2 className="text-5xl lg:text-[6rem] font-bold text-white tracking-tight leading-none">Similar<br/><span className="text-white/30">Journeys</span></h2>
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
          className="min-h-screen flex flex-col items-center justify-center text-center py-40 space-y-12 snap-center snap-always"
        >
          <div className="w-24 h-[1px] bg-white/20" />
          <h3 className="text-2xl lg:text-5xl font-light text-white/70 italic tracking-widest uppercase">Begin Your Journey.</h3>
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
          className="relative flex items-center justify-between rounded-full pointer-events-auto mx-auto transform-gpu will-change-[width,transform] w-fit max-w-[calc(100vw-24px)] md:max-w-[calc(100vw-80px)] overflow-hidden"
        >
          {/* ════ PHYSICAL JELLY SHELL ════ */}
          <div 
            ref={jellyRef}
            className="relative flex items-center justify-between p-2 transform-gpu"
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
            <div className="relative z-10 flex items-center justify-between w-full h-full" style={{ gap: 'clamp(0.25rem, 2vw, 2rem)' }}>
            {/* Metadata Segments Area */}
            <div className="relative z-10 flex items-center min-w-0" ref={segmentsRef}>
              <div className="flex items-center justify-center" style={{ padding: '0 clamp(0.2rem, 1.5vw, 2rem)', gap: 'clamp(4px, 1.2vw, 16px)' }}>
                  
                  {/* Left Column: Primary Price */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="font-black uppercase text-white/40 md:text-white/70 whitespace-nowrap text-center mb-0.5" style={{ fontSize: 'clamp(6px, 1vw, 7px)', letterSpacing: '0.4em' }}>
                      Investment
                    </span>
                    <p className="font-bold tracking-tighter text-white/90 leading-none tabular-nums whitespace-nowrap" style={{ fontSize: 'clamp(20px, 4.5vw, 1.6rem)' }}>
                      {pricing.symbol}{pricing.finalTotal.toLocaleString()}
                    </p>
                  </div>

                  {/* Right Column: Secondary Metadata Stack */}
                  <div className="flex flex-col items-start justify-center gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold uppercase tracking-wider text-white/50 leading-none whitespace-nowrap" style={{ fontSize: 'clamp(7px, 1.2vw, 7px)' }}>
                        / Person
                      </span>
                      {pricing.hasSavings && (
                        <span className="font-medium tracking-tight text-white/40 line-through whitespace-nowrap" style={{ fontSize: 'clamp(8px, 1.4vw, 0.8rem)' }}>
                          {pricing.symbol}{pricing.originalTotal.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    {pricing.hasSavings ? (
                      <span className="font-black uppercase tracking-wider text-emerald-400 leading-none whitespace-nowrap" style={{ fontSize: 'clamp(6px, 1vw, 6px)' }}>
                        Save {pricing.discountPercent}%
                      </span>
                    ) : (pricing.shouldAddTaxLabel || pricing.isInclusive || experience.location?.toLowerCase().includes('maldives') || experience.location?.toLowerCase().includes('bali')) ? (
                      <span className="font-bold uppercase tracking-wider text-white/50 leading-none whitespace-nowrap" style={{ fontSize: 'clamp(4px, 1vw, 6px)' }}>
                        {pricing.taxLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              
              {/* Action Button Area */}
              <div ref={actionRef} className="flex items-center justify-end shrink-0" style={{ paddingLeft: 'clamp(0px, 1vw, 12px)' }}>
                <Magnetic intensity={0.3}>
                  <button 
                    onClick={() => openModal('BOOKING', experience)}
                    className="group/btn relative overflow-hidden h-8.5 md:h-12 xl:h-14 px-3 md:px-10 rounded-full bg-white text-black transition-all duration-700 active:scale-95 flex items-center justify-center gap-1 md:gap-2"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-1 md:gap-2">
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.3em] whitespace-nowrap ml-[0.15em] md:ml-[0.3em]">
                        Reserve
                      </span>
                      <ChevronRight strokeWidth={2.5} className="text-black group-hover/btn:translate-x-1 transition-transform shrink-0 w-3 h-3 md:w-[18px] md:h-[18px]" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  </button>
                </Magnetic>
              </div>
            </div>
          </div>
          </div>
      </div>
    </>)}
    </div>
  );
});
