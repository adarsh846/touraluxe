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
import { useSettings } from "@/hooks/useSettings";

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
    if (!words.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(words, 
        { 
          opacity: 0.1, 
          y: 28,
        },
        {
          opacity: 1,
          y: 0,
          stagger: 0.03,
          ease: "power2.out",
          scrollTrigger: {
            scroller: scroller,
            trigger: containerRef.current,
            start: start || "top bottom-=90",
            end: end || "bottom bottom-=220",
            scrub: 0.3,
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [text, scroller, start, end]);

  return (
    <div ref={containerRef} className={cn("flex flex-wrap gap-x-[0.25em] gap-y-[0.1em] transform-gpu", className)}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="scrub-word inline-block transform-gpu will-change-[transform,opacity]">{word}</span>
      ))}
    </div>
  );
};

// --- HELPER: ITINERARY DAY ACCORDION ---
// --- HELPER: SMOOTH HEIGHT TRANSITION WRAPPER ---
const SmoothHeight = ({ isOpen, children, className }: { isOpen: boolean, children: any, className?: string }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | string>(0);

  useEffect(() => {
    if (isOpen) {
      const scrollHeight = contentRef.current?.scrollHeight || 0;
      setHeight(scrollHeight);
      const timer = setTimeout(() => {
        setHeight("auto");
        ScrollTrigger.refresh();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      const scrollHeight = contentRef.current?.scrollHeight || 0;
      setHeight(scrollHeight);
      const timer1 = setTimeout(() => {
        setHeight(0);
      }, 20);
      const timer2 = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 520);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  return (
    <div 
      style={{ height: height }}
      className={cn(
        "overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]", 
        className
      )}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

// --- HELPER: ITINERARY DAY ACCORDION ---
const ItineraryDay = ({ day, index }: { day: any, index: number }) => {
  const [isOpen, setIsOpen] = useState(index === 1); 

  return (
    <div 
      className={cn(
        "group/accordion border rounded-[2rem] overflow-hidden transition-all duration-500",
        isOpen 
          ? "bg-white/[0.07] border-white/35 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0px_rgba(255,255,255,0.1)]" 
          : "bg-white/[0.04] hover:bg-white/[0.06] border-white/20 hover:border-amber-400/30 hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
      )}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 md:p-8 flex items-center gap-4 md:gap-6 text-left"
      >
        <div className={cn(
          "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 text-[10px] md:text-xs font-black uppercase tracking-widest border transition-all duration-500",
          isOpen 
            ? "bg-gradient-to-br from-amber-400/20 to-amber-500/10 border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
            : "bg-white/10 border-white/20 text-white/90 group-hover/accordion:border-amber-400/30 group-hover/accordion:text-amber-300"
        )}>
          D{index}
        </div>
        <h4 className="flex-1 text-lg md:text-2xl font-bold text-white tracking-tight group-hover/accordion:text-white transition-colors duration-300">{day.title}</h4>
        <div className={cn(
          "w-8 h-8 rounded-full border flex items-center justify-center text-white/60 transition-all duration-500 shrink-0", 
          isOpen 
            ? "border-amber-400/35 bg-amber-400/10 text-amber-300" 
            : "border-white/20 group-hover/accordion:border-white/40 group-hover/accordion:text-white"
        )}>
          <ChevronRight size={16} className={cn("transition-transform duration-500", isOpen ? "-rotate-90" : "rotate-90")} />
        </div>
      </button>
      
      <SmoothHeight isOpen={isOpen} className="px-6 md:px-8">
        <div className="pl-[3.5rem] md:pl-[4.5rem] flex flex-col gap-6 pb-8">
          {day.image && (
            <div className="group/img relative w-full h-48 md:h-72 rounded-2xl md:rounded-[2rem] overflow-hidden bg-white/10 border border-white/20 shrink-0">
              <Image 
                src={day.image} 
                alt={day.title} 
                fill 
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/img:scale-[1.04]" 
                sizes="(max-width: 768px) 100vw, 50vw" 
              />
            </div>
          )}
          <div className="flex flex-col gap-4">
            {day.description?.split('\n').filter((line: string) => line.trim() !== '').map((point: string, idx: number) => (
              <div key={idx} className="flex items-start gap-4 group/point">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400/30 bg-transparent group-hover/point:border-amber-400 group-hover/point:bg-amber-400 mt-2 shrink-0 transition-all duration-300 group-hover/point:shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                <p className="text-white/85 group-hover/point:text-white leading-relaxed font-medium transition-colors duration-300">
                  {point.trim()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SmoothHeight>
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
  const [isPillHovered, setIsPillHovered] = useState(false);
  const [renderHeavyContent, setRenderHeavyContent] = useState(false);
  const [isHeroLoaded, setIsHeroLoaded] = useState(false);
  const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({ 0: true });


  const pillRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const jellyRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const islandContainerRef = useRef<HTMLDivElement>(null);
  const islandInnerRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);

  const pricing = useMemo(() => computePrice(experience), [experience, computePrice]);

  const { settings } = useSettings();
  const whatsappNumber = settings.whatsapp_number || settings.contact_phone || "";

  const servicesList = useMemo(() => {
    const { SERVICES } = require('../sections/Services');
    if (settings.services_data) {
      try {
        const parsed = JSON.parse(settings.services_data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => {
            const original = SERVICES.find((s: any) => s.id === item.id);
            return {
              ...item,
              icon: original?.icon || null
            };
          });
        }
      } catch (e) {
        console.error("Failed to parse services_data in PackageContent.tsx:", e);
      }
    }
    return SERVICES;
  }, [settings.services_data]);

  const getWhatsAppEnquiryUrl = () => {
    if (!whatsappNumber) return "";
    const isCustomPrice = !!(experience?.isCustom || !experience?.price || experience?.price === 0 || experience?.price === "0");
    const costText = isCustomPrice ? "Upon Request" : `${pricing.formattedFinal} per person`;
    const text = `Hi TouraLuxe!

I'm viewing the "${experience?.title || 'Luxury Journey'}" package on your site and would love to receive more details or ask a few questions.

- Package: ${experience?.title || 'Luxury Journey'}
- Cost: ${costText}

Could you please share details on availability and custom options? Thank you!`;
    return `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
  };

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

  const addons = useMemo(() => {
    try {
      const anchor = experience?.itinerary_url;
      if (anchor && anchor.startsWith('{')) {
        const parsed = JSON.parse(anchor);
        if (parsed.addons && Array.isArray(parsed.addons)) {
          return parsed.addons;
        }
      }
    } catch (e) {
      console.warn("Error parsing addons:", e);
    }
    return [];
  }, [experience]);

  const seasonsList = useMemo(() => {
    try {
      const anchor = experience?.itinerary_url;
      if (anchor && anchor.startsWith('{')) {
        const parsed = JSON.parse(anchor);
        if (parsed.seasons_list && Array.isArray(parsed.seasons_list)) {
          return parsed.seasons_list;
        }
      }
    } catch (e) {
      console.warn("Error parsing seasons_list:", e);
    }
    return [];
  }, [experience]);

  const soulOfJourney = useMemo(() => {
    try {
      const anchor = experience?.itinerary_url;
      if (anchor && anchor.startsWith('{')) {
        const parsed = JSON.parse(anchor);
        if (parsed.soul_of_journey) {
          return parsed.soul_of_journey;
        }
      }
    } catch (e) {
      console.warn("Error parsing soul_of_journey:", e);
    }
    return "";
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
    pillRef.current.style.borderColor = 'rgba(255,255,255,0.45)';
  }, []);

  const handleGlowLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = '0';
    if (pillRef.current) pillRef.current.style.borderColor = 'rgba(255,255,255,0.28)';
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
      scaleY: 0.82, scaleX: 1.08, duration: 0.1, ease: "power2.out", force3D: true,
      onComplete: () => {
        gsap.to(jellyRef.current, {
          scaleY: 1, scaleX: 1, duration: 0.8, ease: "elastic.out(1, 0.3)", force3D: true,
          clearProps: "scaleX,scaleY"
        });
      }
    });
  }, [pricing.finalTotal]);

  // ═══ CHOREOGRAPHED HEADER ANIMATION ═══
  const headerAnimatedRef = useRef(false);
  useEffect(() => {
    if (!isActive) {
      headerAnimatedRef.current = false;
      return;
    }
    if (headerAnimatedRef.current) return;
    
    const rafId = requestAnimationFrame(() => {
      if (headerAnimatedRef.current) return;
      headerAnimatedRef.current = true;
      
      const title = titleRef.current;
      const meta = metaRef.current;
      
      const tl = gsap.timeline({ delay: 0.35 });
      
      if (title) {
        gsap.set(title, { opacity: 0, y: 35 });
        tl.to(title, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'elastic.out(1.1, 0.55)',
          force3D: true,
          clearProps: 'y',
        });
      }
      
      if (meta) {
        gsap.set(meta, { opacity: 0, y: 15 });
        tl.to(meta, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          force3D: true,
          clearProps: 'y',
        }, '-=0.45');
      }
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isActive]);

  // ═══ APPLE-STYLE ISLAND ENTRANCE CHOREOGRAPHY ═══
  const islandAnimatedRef = useRef(false);
  useEffect(() => {
    if (!isActive) {
      islandAnimatedRef.current = false;
      return;
    }
    if (islandAnimatedRef.current) return;
    
    // Defer to next frame so React has time to commit the conditional DOM
    const rafId = requestAnimationFrame(() => {
      if (!islandContainerRef.current || !islandInnerRef.current) return;
      if (islandAnimatedRef.current) return;
      
      islandAnimatedRef.current = true;
      const container = islandContainerRef.current;
      const inner = islandInnerRef.current;
      const segments = segmentsRef.current;
      const action = actionRef.current;
      
      // Set initial state: compressed seed pill
      gsap.set(container, {
        y: 80,
        opacity: 0,
        scale: 0.3,
      });
      gsap.set(inner, {
        scaleX: 0.45,
        scaleY: 0.75,
      });
      if (segments) gsap.set(segments, { opacity: 0, x: 20 });
      if (action) gsap.set(action, { opacity: 0, scale: 0.6 });
      
      // Build optimized choreographed timeline with force3D hardware acceleration
      const tl = gsap.timeline({ delay: 0.85 });
      
      // Phase 1: Seed rises from bottom
      tl.to(container, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'expo.out',
        force3D: true,
        clearProps: 'scale,y,opacity',
      })
      // Phase 2: Inner shell elastically expands to full width
      .to(inner, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.9,
        ease: 'elastic.out(1.1, 0.45)',
        force3D: true,
        clearProps: 'scaleX,scaleY',
      }, '-=0.4');

      // Phase 3: Desktop segments slide in
      if (segments) {
        tl.to(segments, {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: 'power3.out',
          force3D: true,
          clearProps: 'opacity,x',
        }, '-=0.65');
      }

      // Phase 4: Action buttons pop in
      if (action) {
        tl.to(action, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'back.out(1.5)',
          force3D: true,
          clearProps: 'opacity,scale',
        }, '-=0.45');
      }

      // Phase 5: Scroll indicator fades in promptly after bottom island shows up
      if (scrollIndicatorRef.current) {
        gsap.set(scrollIndicatorRef.current, { opacity: 0, y: 15 });
        tl.to(scrollIndicatorRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          force3D: true,
          clearProps: 'y',
        }, '-=0.35');
      }
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isActive]);
  
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

    // Perform a single refresh once the 600ms entry animation has finished and settled
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 750);

    return () => clearTimeout(timer);
  }, [isActive]);

  // Defer rendering of content below the fold to keep the entry transition 100% fluid
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setRenderHeavyContent(true);
      }, 750); // Increased to allow the 600ms entry transition to settle completely
      return () => clearTimeout(timer);
    } else {
      setRenderHeavyContent(false);
    }
  }, [isActive]);

  // Refresh ScrollTrigger once heavy content has finished mounting and painting
  useEffect(() => {
    if (renderHeavyContent) {
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [renderHeavyContent]);

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
            scrub: 0.5,
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
    <div className="relative w-full h-full bg-[#080808] overflow-hidden">
      {/* Ambient Travel/Leisure Background Glows */}
      <div className="absolute top-0 right-0 w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] bg-sky-500/10 rounded-full blur-[130px] pointer-events-none -translate-y-1/2 translate-x-1/3 mix-blend-screen z-0" />
      <div className="absolute bottom-0 left-0 w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none translate-y-1/3 -translate-x-1/3 mix-blend-screen z-0" />

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide selection:bg-amber-400/20 selection:text-amber-100 bg-transparent z-10"
      >

        {/* 1. HERO SECTION (Immersive Edge-to-Edge) */}
        <section className="relative w-full h-[100svh] flex flex-col items-center justify-center overflow-hidden">
          <div ref={heroMediaRef} className="absolute inset-0 z-0 origin-top transform-gpu">
             <Image 
               src={experience.image} 
               alt={experience.title} 
               fill 
               className={cn(
                 "object-cover will-change-[opacity,transform] transition-opacity duration-700 ease-out",
                 isHeroLoaded ? "opacity-90" : "opacity-0"
               )}
               priority 
               sizes="100vw" 
               onLoad={() => setIsHeroLoaded(true)}
             />
          </div>
          
          {/* Static Gradient Mask for Seamless Bottom Blend */}
          <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/10 via-black/40 to-[#0a0a0a]" />
          
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full max-w-5xl">
             <h1 
               ref={titleRef}
               className="text-[clamp(2.5rem,8vw,6.5rem)] font-black tracking-[-0.04em] bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 leading-[0.9] drop-shadow-[0_4px_24px_rgba(0,0,0,0.75)] text-balance mb-6 pr-[0.05em] pl-[0.02em] py-[0.04em] opacity-0 transform-gpu will-change-[transform,opacity]"
             >
               {experience.title}
             </h1>
             <div 
               ref={metaRef}
               className="flex flex-col items-center gap-6 md:gap-10 pt-8 opacity-0 transform-gpu will-change-[transform,opacity]"
             >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-8 md:w-12 h-[1px] bg-white/25" />
                  <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] text-white/60 whitespace-nowrap">Best For</span>
                  <div className="w-8 md:w-12 h-[1px] bg-white/25" />
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full max-w-5xl px-6">
                  {experience.category?.map((cat: string, i: number) => (
                    <Magnetic key={i} intensity={0.2}>
                      <button 
                        onClick={() => {
                          const matchingService = servicesList.find((s: any) => s.title === cat);
                          if (matchingService) openModal('SERVICES', matchingService);
                        }}
                        className="group/badge relative text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/80 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-white/20 bg-white/[0.05] backdrop-blur-xl transition-all duration-700 hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 whitespace-nowrap overflow-hidden"
                      >
                        <span className="relative z-10">{cat}</span>
                      </button>
                    </Magnetic>
                  ))}
                </div>
              </div>
          </div>
          
          <div 
            ref={scrollIndicatorRef}
            className="absolute bottom-24 md:bottom-32 left-1/2 -translate-x-1/2 pointer-events-none z-50 opacity-0"
          >
            <div className="flex flex-col items-center gap-2 animate-bounce">
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/80 drop-shadow-md">Scroll</span>
              <ChevronRight size={16} className="text-white/70 rotate-90" strokeWidth={2.5} />
            </div>
          </div>
        </section>

        {/* CONTENT WRAPPER */}
        <div className="relative z-20 bg-[#0a0a0a] w-full mx-auto flex flex-col gap-24 md:gap-32 pb-32">
          
          {/* 2. THE VISION (Scrub Text Animation) */}
          <section className="max-w-5xl mx-auto text-center px-6 md:px-12 pt-16 md:pt-24">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-8 block animate-pulse">The Vision</span>
            <ScrubText 
              text={experience.description || "A breathtaking sanctuary curated for the discerning traveler."} 
              className="justify-center text-[clamp(1.5rem,4vw,3.5rem)] text-white/90 leading-tight font-medium" 
              scroller={scrollerEl} 
            />
          </section>

          {experience.guests && (
            <div className="max-w-5xl mx-auto text-center px-6 -mt-12 md:-mt-16 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 px-6 py-3 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] transition-all duration-300">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Best For:</span>
                {experience.guests.split(",").map((g: string, idx: number) => (
                  <span key={idx} className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-white tracking-tight">
                    {idx > 0 && <span className="text-white/60 font-light">•</span>}
                    {g.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {renderHeavyContent && (
            <>
              {/* 3. BENTO BOX OVERVIEW */}
          <section className="px-4 md:px-8 max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 auto-rows-min">
              
              {/* Top Row: Quick Stats */}
              <div className="md:col-span-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                 {experience.duration && (
                   <div className="bg-white/[0.05] border border-white/20 rounded-[2rem] p-6 flex flex-col gap-2 hover:bg-white/[0.08] transition-colors">
                     <Clock className="text-amber-400/80 mb-1" size={22} />
                     <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60">Duration</span>
                     <span className="text-sm md:text-base font-bold text-white tracking-tight">{experience.duration}</span>
                   </div>
                 )}
                 {experience.season && (
                   <div className="bg-white/[0.05] border border-white/20 rounded-[2rem] p-6 flex flex-col gap-2 hover:bg-white/[0.08] transition-colors">
                     <Compass className="text-indigo-400/80 mb-1" size={22} />
                     <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60">Season</span>
                     <span className="text-sm md:text-base font-bold text-white tracking-tight">{experience.season}</span>
                   </div>
                 )}
                 {experience.flights_status && experience.flights_status !== "excluded" && (
                   <div className="bg-white/[0.05] border border-white/20 rounded-[2rem] p-6 flex flex-col gap-2 hover:bg-white/[0.08] transition-colors">
                     <Plane className="text-sky-400/80 mb-1" size={22} />
                     <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60">Flights</span>
                     <span className="text-sm md:text-base font-bold text-white tracking-tight">
                       {experience.flights_status === 'included' ? "Included" : "On Request"}
                     </span>
                   </div>
                 )}
                 {experience.max_group_size != null && (
                   <div className="bg-white/[0.05] border border-white/20 rounded-[2rem] p-6 flex flex-col gap-2 hover:bg-white/[0.08] transition-colors">
                       <Users className="text-emerald-400/80 mb-1" size={22} />
                       <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60">Group Size</span>
                       <span className="text-sm md:text-base font-bold text-white tracking-tight">
                         {experience.min_group_size ?? 1} - {experience.max_group_size} Pax
                       </span>
                   </div>
                 )}
              </div>

              {/* Middle Row: Highlights & Inclusions */}
              {experience.highlights && experience.highlights.length > 0 && (
                <div className="md:col-span-7 bg-gradient-to-br from-white/[0.06] to-transparent border border-white/20 rounded-[2rem] p-8 md:p-10 flex flex-col justify-center">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 mb-6 block">Highlights</span>
                  <ul className="space-y-4">
                    {experience.highlights.map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="mt-[8px] md:mt-[10px] w-[6px] h-[6px] rounded-full bg-gradient-to-br from-white/80 to-white/40 flex-shrink-0" />
                        <span className="text-base md:text-xl font-medium text-white/95 leading-tight tracking-tight">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="md:col-span-5 flex flex-col gap-3 md:gap-4">
                 {experience.inclusions && experience.inclusions.length > 0 && (
                   <div className="flex-1 bg-white/[0.05] border border-white/20 rounded-[2rem] p-6 md:p-8 flex flex-col">
                     <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-5 block">Inclusions</span>
                     <div className="flex flex-wrap gap-2">
                       {experience.inclusions.map((inc: string, i: number) => (
                         <span key={i} className="text-[11px] md:text-xs font-semibold text-white/90 bg-white/15 border border-white/25 px-3 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-[0_0_15px_rgba(52,211,153,0.05)]">
                           <ShieldCheck size={12} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" /> {inc}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
                 {experience.exclusions && experience.exclusions.length > 0 && (
                   <div className="flex-1 bg-red-500/[0.06] border border-red-500/20 rounded-[2rem] p-6 md:p-8 flex flex-col">
                     <span className="text-[9px] font-black uppercase tracking-[0.4em] text-red-400 mb-5 block">Exclusions</span>
                     <div className="flex flex-wrap gap-2">
                       {experience.exclusions.map((exc: string, i: number) => (
                         <span key={i} className="text-[11px] md:text-xs font-semibold text-white/80 bg-red-500/15 border border-red-500/25 px-3 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-[0_0_15px_rgba(251,113,133,0.05)]">
                           <X size={12} className="text-red-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.5)]" /> {exc}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
              </div>

              {/* Optional Add-Ons Summary */}
              {addons && addons.length > 0 && (
                <div className="col-span-1 md:col-span-12 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/20 rounded-[2rem] p-8 md:p-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60">Optional Enhancements</span>
                  </div>
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed italic max-w-2xl">
                    Enhance your itinerary with these curated excursions and custom services, available to select during booking.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {addons.map((addon: any, idx: number) => {
                      const priceNum = parseInt(addon.price) || 0;
                      let priceStr = "";
                      if (addon.type === "per_pax") {
                        priceStr = `${pricing.symbol}${priceNum.toLocaleString()} / traveler`;
                      } else if (addon.type === "per_day") {
                        priceStr = `${pricing.symbol}${priceNum.toLocaleString()} / day (${addon.days || 1} days)`;
                      } else {
                        priceStr = `${pricing.symbol}${priceNum.toLocaleString()} total`;
                      }
                      
                      return (
                        <div key={idx} className="p-5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 hover:border-white/30 transition-all duration-300 flex flex-col justify-between gap-4 group/addon">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white/95 group-hover/addon:text-white transition-colors">{addon.name}</h4>
                            <span className="text-[8px] font-black text-white/55 uppercase tracking-[0.25em]">{addon.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-white/10 pt-3">
                            <span className="text-[10px] text-white/60 uppercase tracking-wider">Est. Cost</span>
                            <span className="text-xs font-mono font-bold text-amber-400">{priceStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Best Time to Visit */}
              {seasonsList && seasonsList.length > 0 && (
                <div className="col-span-1 md:col-span-12 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/20 rounded-[2rem] p-8 md:p-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60">Best Time to Visit</span>
                  </div>
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed italic max-w-2xl">
                    Gain deep insight into the regional weather, pricing tiers, and unique cultural events across travel seasons.
                  </p>
                  
                  {/* Glassmorphic Accordion List */}
                  <div className="space-y-4 pt-2">
                    {seasonsList.map((item: any, idx: number) => {
                      const isExpanded = !!expandedSeasons[idx];
                      const seasonType = item.type || "Optimal Season";
                      
                      // Accent Style Mapping
                      let badgeColors = "bg-blue-500/10 border-blue-500/20 text-blue-400";
                      let glowShadow = "shadow-[0_0_15px_rgba(59,130,246,0.05)]";
                      
                      const typeLower = seasonType.toLowerCase();
                      if (typeLower.includes("peak")) {
                        badgeColors = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                        glowShadow = "shadow-[0_0_15px_rgba(16,185,129,0.05)]";
                      } else if (typeLower.includes("moderate") || typeLower.includes("shoulder")) {
                        badgeColors = "bg-amber-500/10 border-amber-500/20 text-amber-300";
                        glowShadow = "shadow-[0_0_15px_rgba(245,158,11,0.05)]";
                      } else if (typeLower.includes("off") || typeLower.includes("low")) {
                        badgeColors = "bg-rose-500/10 border-rose-500/20 text-rose-400";
                        glowShadow = "shadow-[0_0_15px_rgba(244,63,94,0.05)]";
                      }
                      
                      // Split highlights by newline to render as bullets
                      const bulletPoints = (item.highlights || "")
                         .split("\n")
                         .map((line: string) => line.trim())
                         .filter((line: string) => line.length > 0);

                      return (
                        <div 
                          key={idx} 
                          className={`bg-white/[0.05] hover:bg-white/[0.08] border border-white/20 rounded-2xl md:rounded-[1.5rem] overflow-hidden transition-all duration-300 ${glowShadow}`}
                        >
                          {/* Accordion Header */}
                          <button
                            type="button"
                            onClick={() => setExpandedSeasons(prev => ({ ...prev, [idx]: !isExpanded }))}
                            className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
                          >
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border leading-none shrink-0 ${badgeColors}`}>
                                {item.season}
                              </span>
                              <span className="text-sm font-bold text-white tracking-tight">
                                is {seasonType}
                              </span>
                            </div>
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2.5"
                              className={`text-white/60 transition-transform duration-300 shrink-0 ml-4 ${isExpanded ? "rotate-180" : ""}`}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {/* Accordion Panel */}
                          <SmoothHeight isOpen={isExpanded}>
                            <div className="border-t border-white/20 p-5 md:p-6 space-y-4">
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/65">
                                  What To Expect
                                </span>
                              </div>
                              {bulletPoints.length > 0 ? (
                                <ul className="space-y-3">
                                  {bulletPoints.map((point: string, pIdx: number) => {
                                    const cleanedPoint = point.replace(/^[-*•\s]+/, "");
                                    return (
                                      <li key={pIdx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80 mt-1.5 shrink-0" />
                                        <span className="text-xs md:text-[13px] text-white/80 leading-relaxed font-medium">
                                          {cleanedPoint}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <p className="text-xs md:text-[13px] text-white/60 italic leading-relaxed">
                                  No specific highlights listed for this season.
                                </p>
                              )}
                            </div>
                          </SmoothHeight>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Destinations Covered (Route Timeline) */}
          {destinationsCovered.length > 0 && (
            <section className="px-4 md:px-8 max-w-7xl mx-auto w-full">
              <div className="bg-white/[0.05] border border-white/20 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent opacity-50 pointer-events-none" />
                <div className="relative z-10 space-y-8">
                  <div className="text-center md:text-left">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 mb-3 block">The Route</span>
                    <h3 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-none">Destinations Covered</h3>
                  </div>
                  <div className="flex flex-col md:flex-row md:flex-wrap items-center gap-3 md:gap-6 pt-4 justify-center md:justify-start w-full">
                    {destinationsCovered.map((dest: string, idx: number) => (
                      <div key={idx} className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
                        <div className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 px-5 py-3 rounded-2xl transition-all duration-300">
                          <div className="w-6 h-6 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-sm md:text-base font-bold text-white">{dest}</span>
                        </div>
                        {idx < destinationsCovered.length - 1 && (
                          <div className="flex items-center justify-center text-white/60 select-none py-1 md:py-0">
                            <ArrowRight size={18} className="hidden md:block animate-pulse" />
                            <ArrowRight size={18} className="block md:hidden rotate-90 animate-pulse" />
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
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-3 block">Itinerary</span>
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
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-3 block">Visuals</span>
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
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-3 block">Investment</span>
               <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold text-white tracking-tight leading-none">Pricing Details.</h2>
             </div>

             <div className="bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-6 md:p-12 w-full flex flex-col md:flex-row items-center gap-10 md:gap-16">
                <div className="flex-1 flex flex-col gap-2 w-full text-center md:text-left">
                   <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                     {pricing.hasSavings && (
                       <span className="text-white/70 font-bold line-through decoration-rose-400/80 text-lg">{pricing.symbol}{pricing.originalTotal.toLocaleString()}</span>
                     )}
                     {pricing.hasSavings && (
                       <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">Save {pricing.discountPercent}%</span>
                     )}
                   </div>
                   <span className="text-[clamp(3.5rem,8vw,5.5rem)] font-bold text-white tracking-tighter leading-none tabular-nums">
                     {pricing.formattedFinal}
                   </span>
                   <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/60 mt-3 block">
                     Per Person · {pricing.taxLabel}
                   </span>
                </div>

                {/* Receipt Card Breakdown */}
                <div className="w-full md:w-[360px] shrink-0 bg-black/60 rounded-[2rem] p-6 md:p-8 border border-white/15 space-y-5 shadow-2xl">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-5 border-b border-white/15 pb-4">Manifest Breakdown</h4>
                  
                  <div className="flex justify-between items-center text-sm text-white/95 font-medium">
                    <span>Base (Land)</span>
                    <span className="tabular-nums font-bold tracking-tight">{pricing.symbol}{(pricing.breakdown?.landBase || 0).toLocaleString()}</span>
                  </div>
                  
                  {(pricing.breakdown?.flightNet || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm text-blue-400 font-medium">
                      <span className="flex items-center gap-2"><Plane size={14} /> Flights</span>
                      <span className="tabular-nums font-bold tracking-tight">+{pricing.symbol}{(pricing.breakdown?.flightNet || 0).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-emerald-400/80 font-medium pb-5 border-b border-white/15">
                    <span>Taxes (GST {pricing.taxRate}%)</span>
                    <span className="tabular-nums font-bold tracking-tight">+{pricing.symbol}{(pricing.breakdown?.taxAmount || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-end text-xl text-white font-black pt-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Total</span>
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
            
            <div className="mt-24 flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-16">
              <Magnetic intensity={0.2}>
                <button 
                  onClick={() => openModal('BOOKING', experience)}
                  className="group/btn flex flex-col items-center gap-6"
                >
                  <div className="w-18 h-18 md:w-22 md:h-22 rounded-full border border-white/20 flex items-center justify-center p-1.5 transition-all duration-700 group-hover/btn:border-white/45 group-hover/btn:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-white via-neutral-100 to-neutral-200 text-black flex items-center justify-center shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover/btn:scale-95">
                      <ChevronRight size={32} strokeWidth={2} className="group-hover/btn:translate-x-0.5 transition-transform duration-500" />
                    </div>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/70 group-hover/btn:text-white group-hover/btn:tracking-[0.5em] transition-all duration-700 select-none">
                    Reserve This Journey
                  </span>
                </button>
              </Magnetic>
              {whatsappNumber && (
                <Magnetic intensity={0.2}>
                  <a 
                    href={getWhatsAppEnquiryUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/wa-btn flex flex-col items-center gap-6 cursor-pointer"
                  >
                    <div className="w-18 h-18 md:w-22 md:h-22 rounded-full border border-white/20 flex items-center justify-center p-1.5 transition-all duration-700 group-hover/wa-btn:border-[#25D366]/45 group-hover/wa-btn:shadow-[0_0_30px_rgba(37,211,102,0.05)]">
                      <div className="w-full h-full rounded-full bg-gradient-to-b from-[#25D366] to-[#128C7E] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(37,211,102,0.15)] transition-transform duration-500 group-hover/wa-btn:scale-95">
                        <svg className="w-8 h-8 text-white shrink-0" viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                        </svg>
                      </div>
                    </div>
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/70 group-hover/wa-btn:text-white group-hover/wa-btn:tracking-[0.5em] transition-all duration-700 select-none">
                      Enquire via WhatsApp
                    </span>
                  </a>
                </Magnetic>
              )}
            </div>
          </section>
            </>
          )}
        </div>
      </div>



      {isActive && (
        <>
          {isPillHovered && (
            <div 
              className="fixed inset-0 z-[115] bg-transparent md:hidden pointer-events-auto"
              onClick={() => setIsPillHovered(false)}
            />
          )}
          <svg className="hidden">
            <defs>
              <filter id="pill-goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>
            </defs>
          </svg>

          <div 
            ref={islandContainerRef}
            data-island-container="true"
            className="fixed bottom-5 left-0 right-0 px-4 z-[120] pointer-events-none flex justify-center transform-gpu"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <div ref={islandInnerRef} className="relative flex flex-col items-center w-fit pointer-events-none transform-gpu" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              
              {/* Speech Bubble Popover */}
              <div 
                className={cn(
                  "absolute bottom-[calc(100%+12px)] lg:bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 z-[130] w-[320px] xs:w-[350px] sm:w-[400px] lg:w-[460px] max-w-[calc(100vw-24px)] pointer-events-none origin-bottom transform-gpu will-change-[transform,opacity]",
                  isPillHovered 
                    ? "opacity-100 scale-100 translate-y-0 transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
                    : "opacity-0 scale-[0.9] translate-y-3 transition-all duration-[250ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                )}
              >
                <div className={cn(
                  "relative p-4 sm:p-5 md:p-7 rounded-[1.75rem] md:rounded-[2rem] bg-zinc-950/95 backdrop-blur-[35px] border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-y-auto scrollbar-hide max-h-[calc(100svh-120px)] md:max-h-[none] overscroll-contain flex flex-col gap-3.5 sm:gap-4 md:gap-5",
                  isPillHovered ? "pointer-events-auto" : "pointer-events-none"
                )}>
                  
                  {/* Ambient inner gold and indigo glow */}
                  <div className="absolute -top-16 -left-16 w-48 h-48 bg-gradient-to-br from-amber-400/20 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
 
                  {/* Header info */}
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={10} className="text-amber-400/90 animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-400 block leading-none">Journey Summary</span>
                      </div>
                      <h4 className="text-[12px] sm:text-[13px] md:text-[16px] font-bold text-white tracking-tight leading-tight sm:leading-none font-sans">{experience.title}</h4>
                      {experience.tagline && (
                        <p className="text-[9px] sm:text-[9.5px] md:text-[10.5px] text-white/70 italic font-medium leading-tight sm:leading-none mt-1 sm:mt-1.5 font-sans">{experience.tagline}</p>
                      )}
                    </div>
                    <span className="shrink-0 px-2 sm:px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[7.5px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white leading-none">
                      {experience.duration}
                    </span>
                  </div>
 
                  {/* Divider */}
                  <div className="w-full h-px bg-white/20 relative z-10" />
 
                  {/* Natural Prose Introduction */}
                  <div className="relative z-10 space-y-1.5 font-sans">
                    <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/60">The Soul of the Journey</span>
                    <p className="text-[10px] sm:text-[10.5px] md:text-[11.5px] leading-relaxed text-white/90 font-medium whitespace-pre-line">
                      {soulOfJourney || (
                        <>
                          Every day is an unwritten chapter of your life's greatest story. Handcrafted to evoke wonder for <span className="text-white font-bold">{experience.guests || "souls seeking beauty"}</span>, this sanctuary is best explored during the <span className="text-amber-400 font-bold">{experience.season || "optimal season"}</span> to capture local magic at its peak. Premium transfers and regional flight connections are <span className="text-blue-400 font-bold">{experience.flights_status === 'included' ? "fully inclusive" : experience.flights_status === 'on_request' ? "available on request" : "excluded (land-only tier)"}</span>.
                        </>
                      )}
                    </p>
                  </div>
 
                  {/* Route Timeline */}
                  {destinationsCovered.length > 0 && (
                    <>
                      <div className="w-full h-px bg-white/20 relative z-10" />
                      <div className="relative z-10 space-y-1.5">
                        <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/60">Destinations Covered</span>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[9.5px] sm:text-[10px] md:text-[11px] font-bold text-white/95">
                          {destinationsCovered.map((dest: string, i: number) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[9px] sm:text-[9.5px] font-medium text-white/90">{dest}</span>
                              {i < destinationsCovered.length - 1 && (
                                <span className="text-white/40 text-[8px] font-light">/</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
 
                  {/* Curated Highlights & Inclusions Grid */}
                  {((experience.highlights && experience.highlights.length > 0) || (experience.inclusions && experience.inclusions.length > 0)) && (
                    <>
                      <div className="w-full h-px bg-white/20 relative z-10" />
                      <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4">
                        {experience.highlights && experience.highlights.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/60">Highlights</span>
                            <div className="space-y-1">
                              {experience.highlights.slice(0, 2).map((h: string, i: number) => (
                                <div key={i} className="flex items-start gap-1.5 text-[9px] sm:text-[9.5px] md:text-[10px] text-white/85 leading-tight">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 mt-[5px] shrink-0" />
                                  <span>{h}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {experience.inclusions && experience.inclusions.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/60">Inclusions</span>
                            <div className="space-y-1">
                              {experience.inclusions.slice(0, 2).map((inc: string, i: number) => (
                                <div key={i} className="flex items-start gap-1.5 text-[9px] sm:text-[9.5px] md:text-[10px] text-white/85 leading-tight">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 mt-[5px] shrink-0" />
                                  <span>{inc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
 
                  {/* Financial Investment Callout */}
                  <div className="w-full h-px bg-white/20 relative z-10" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/60">Investment Total</span>
                      <span className="text-[9.5px] sm:text-[10px] md:text-[11px] font-medium text-white/60 italic">Subject to tier options</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] sm:text-[13px] md:text-[16px] font-black text-emerald-400 tabular-nums">
                        {pricing.symbol}{pricing.finalTotal.toLocaleString("en-IN")} <span className="text-[8px] sm:text-[8.5px] md:text-[9px] text-white/70 font-normal font-sans">/ traveler</span>
                      </p>
                      <p className="text-[7px] sm:text-[7.5px] md:text-[8px] font-bold text-white/60 uppercase tracking-widest leading-none mt-0.5">
                        {pricing.taxLabel}
                      </p>
                    </div>
                  </div>
                </div>
 
                {/* Speech Bubble Pointer */}
                <div 
                  className="absolute w-3.5 h-3.5 bg-zinc-950 border-r border-b border-white/20 pointer-events-none"
                  style={{ 
                    bottom: "-7px", 
                    left: "calc(50% - 7px)", 
                    transform: "rotate(45deg)", 
                    zIndex: 120 
                  }} 
                />
              </div>

              {/* Pill Container */}
              <div 
                ref={pillRef}
                onMouseMove={(e) => {
                  if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
                    handleGlowMove(e.clientX, e.clientY);
                  }
                }}
                onMouseEnter={(e) => {
                  if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
                    handleGlowMove(e.clientX, e.clientY);
                    setIsPillHovered(true);
                  }
                }}
                onMouseLeave={() => {
                  if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
                    handleGlowLeave();
                    setIsPillHovered(false);
                  }
                }}
                onTouchStart={(e) => {
                  handleGlowMove(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchMove={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={() => {
                  handleGlowLeave();
                }}
                onTouchCancel={() => {
                  handleGlowLeave();
                }}
                className="relative flex items-center rounded-full pointer-events-auto mx-auto transform-gpu w-fit max-w-[calc(100vw-32px)] lg:max-w-[calc(100vw-80px)] overflow-hidden"
              >
          {/* ════ PHYSICAL JELLY SHELL ════ */}
          <div 
            ref={jellyRef}
            className="relative flex items-center justify-between p-1 sm:p-1.5 lg:p-1.5 transform-gpu w-full"
          >
            {/* Background Layer */}
            <div className="absolute inset-0 bg-[#0b0b0c] border border-white/30 rounded-full shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-[border-color] duration-300 pointer-events-none" />

            {/* iOS 26 Pointer-Tracking Glow Overlay */}
            <div 
              ref={glowRef}
              className="absolute inset-0 rounded-full pointer-events-none z-[1] transition-opacity duration-300"
              style={{ opacity: 0, mixBlendMode: 'screen' }}
            />

            {/* Content Container (Wrapped in Jelly) */}
            <div className="relative z-10 flex items-center w-full h-full gap-3 lg:justify-between lg:gap-5 xl:gap-6 pl-3 lg:pl-5 pr-1">

              {/* ── MOBILE/TABLET LAYOUT (< lg): Full info + icon-only Reserve ── */}
              <div 
                className="flex lg:hidden items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPillHovered(prev => !prev);
                }}
              >
                <div className="flex flex-col items-center min-w-0 flex-1">
                  {/* Label — centered above price, matching desktop */}
                  <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/55 leading-none mb-0.5">Investment</span>
                  
                  {/* Primary Price Area */}
                  <div className="flex items-baseline gap-1 justify-center">
                    <span className="font-black uppercase tracking-widest text-white/60 text-[8px] mr-0.5 select-none leading-none">
                      From
                    </span>
                    <span className="text-[clamp(1.1rem,5.5vw,1.35rem)] font-black text-white leading-none tabular-nums tracking-tighter animate-in fade-in duration-300">
                      {pricing.symbol}{pricing.finalTotal.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-white/60 leading-none">
                      / Person
                    </span>
                  </div>
                  
                  {/* Info Row: savings + flight + tax */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {pricing.hasSavings && (
                      <div className="flex items-center gap-1">
                        <span className="text-[7.5px] font-semibold text-white/70 line-through decoration-rose-400/80 tabular-nums">{pricing.symbol}{pricing.originalTotal.toLocaleString()}</span>
                        <span className="text-[7px] font-black uppercase text-emerald-400">−{pricing.discountPercent}%</span>
                      </div>
                    )}
                    {(pricing.taxLabel) && (
                      <span className="text-[7px] font-bold text-white/50 uppercase tracking-wide">{pricing.taxLabel}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── DESKTOP LAYOUT (lg+): Unified centered pricing block ── */}
              <div className="hidden lg:flex items-center min-w-0" ref={segmentsRef}>
                <div className="flex flex-col items-center justify-center px-4">
                  {/* Label */}
                  <span className="font-black uppercase text-white/70 whitespace-nowrap text-center mb-0.5 text-[7px] tracking-[0.4em]">
                    Investment
                  </span>
                  
                  {/* Primary Price Row */}
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="font-black uppercase tracking-widest text-white/60 text-[8px] select-none leading-none">
                      From
                    </span>
                    <span className="font-bold tracking-tighter text-white/90 leading-none tabular-nums whitespace-nowrap text-[clamp(1.2rem,4vw,1.75rem)]">
                      {pricing.symbol}{pricing.finalTotal.toLocaleString("en-IN")}
                    </span>
                    <span className="font-bold uppercase tracking-wider text-white/60 leading-none whitespace-nowrap text-[8px]">
                      / Person
                    </span>
                  </div>

                  {/* Info Row: savings + tax */}
                  <div className="flex items-center gap-2 justify-center mt-0.5">
                    {pricing.hasSavings && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold tracking-tight text-white/70 line-through decoration-rose-400/80 whitespace-nowrap text-[8.5px] tabular-nums">
                          {pricing.symbol}{pricing.originalTotal.toLocaleString()}
                        </span>
                        <span className="font-black uppercase tracking-wider text-emerald-400 leading-none whitespace-nowrap text-[7.5px]">
                          Save {pricing.discountPercent}%
                        </span>
                      </div>
                    )}
                    {(pricing.shouldAddTaxLabel || pricing.isInclusive) && (
                      <span className="font-bold uppercase tracking-wider text-white/50 leading-none whitespace-nowrap text-[7px]">
                        {pricing.taxLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Button — edge-to-edge design */}
              <div ref={actionRef} className="flex items-center justify-end shrink-0 gap-1.5 my-auto">
                {whatsappNumber && (
                  <Magnetic intensity={0.3}>
                    <a
                      href={getWhatsAppEnquiryUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/wa relative overflow-hidden rounded-full bg-[#25D366] text-black transition-all duration-300 active:scale-95 flex items-center justify-center cursor-pointer
                        h-10 lg:h-12 w-10 lg:w-auto lg:px-6 shadow-[0_4px_15px_rgba(37,211,102,0.25)]"
                    >
                      <div className="relative z-10 flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-black shrink-0" viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                        </svg>
                        <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap">
                          Enquire
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#25D366] via-[#35e376] to-[#25D366] opacity-0 group-hover/wa:opacity-100 transition-opacity" />
                    </a>
                  </Magnetic>
                )}
                <Magnetic intensity={0.3}>
                  <button 
                    onClick={() => openModal('BOOKING', experience)}
                    className="group/btn relative overflow-hidden rounded-full bg-white text-black transition-all duration-300 active:scale-95 flex items-center justify-center
                      h-10 lg:h-12 w-10 lg:w-auto lg:px-8 shadow-[0_4px_15px_rgba(255,255,255,0.15)]"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-1.5">
                      {/* Mobile: icon only */}
                      <ChevronRight strokeWidth={2.5} className="text-black group-hover/btn:translate-x-0.5 transition-transform shrink-0 w-4 h-4 lg:hidden" />
                      {/* Desktop: text + icon */}
                      <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap">
                        Reserve
                      </span>
                      <ChevronRight strokeWidth={2.5} className="text-black hidden lg:block group-hover/btn:translate-x-1 transition-transform shrink-0 w-4 h-4" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  </button>
                </Magnetic>
              </div>
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
    </div>
  );
});
