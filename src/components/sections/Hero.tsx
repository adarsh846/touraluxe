"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Image from "next/image";
import { useSettings } from "@/hooks/useSettings";
import { Search, MapPin, Calendar, Sparkles, ArrowRight, Flame } from "lucide-react";
import { useBooking } from "../BookingProvider";
import { Magnetic } from "../Magnetic";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const trendingInnerRef = useRef<HTMLDivElement>(null);
  const trendingTagRef = useRef<HTMLDivElement>(null);
  const trendingPillsRef = useRef<HTMLDivElement>(null);
  // const [isMobile, setIsMobile] = useState(false);
  const { settings } = useSettings();
  const { openModal, openBooking } = useBooking();
  const [trendingPills, setTrendingPills] = useState<any[]>([
    { id: "1", title: "Alpine Sanctuary", location: "Switzerland", price: "450000", image: "/assets/hero-bg.webp", is_published: true },
    { id: "2", title: "Maldivian Lagoon", location: "Maldives", price: "350000", image: "/assets/hero-bg.webp", is_published: true },
    { id: "3", title: "Kyoto Heritage", location: "Japan", price: "280000", image: "/assets/hero-bg.webp", is_published: true },
    { id: "4", title: "Amboseli Safari", location: "Kenya", price: "390000", image: "/assets/hero-bg.webp", is_published: true }
  ]);
  const trendingScrollRef = useRef<HTMLDivElement>(null);


  const title = settings.hero_title || "We don't sell trips. \nWe craft experiences.";
  const subtitle = settings.hero_subtitle || "Immersive, exclusive, and tailored entirely to your desires.";

  const titleLines = title.split('\n');

  useEffect(() => {
    async function fetchTrendingPackages() {
      try {
        const res = await fetch("/api/packages");
        if (!res.ok) throw new Error("Failed to fetch trending packages");
        const data = await res.json();

        if (data && data.length > 0) {
          const published = data.filter((p: any) => p.is_published !== false);
          const listToShuffle = published.length > 0 ? published : data;
          
          // Fisher-Yates Shuffle for fresh dynamic display on every visit
          const shuffled = [...listToShuffle];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          // Display up to 8 top dynamic trending packages in the scrollable capsule
          setTrendingPills(shuffled.slice(0, 8));
        } else {
          setTrendingPills([
            { id: "1", title: "Alpine Sanctuary", location: "Switzerland", price: "450000", image: "/assets/hero-bg.webp", is_published: true },
            { id: "2", title: "Maldivian Lagoon", location: "Maldives", price: "350000", image: "/assets/hero-bg.webp", is_published: true },
            { id: "3", title: "Kyoto Heritage", location: "Japan", price: "280000", image: "/assets/hero-bg.webp", is_published: true },
            { id: "4", title: "Amboseli Safari", location: "Kenya", price: "390000", image: "/assets/hero-bg.webp", is_published: true }
          ]);
        }
      } catch (err) {
        console.warn("Error fetching dynamic themes:", err);
        setTrendingPills([
          { id: "1", title: "Alpine Sanctuary", location: "Switzerland", price: "450000", image: "/assets/hero-bg.webp", is_published: true },
          { id: "2", title: "Maldivian Lagoon", location: "Maldives", price: "350000", image: "/assets/hero-bg.webp", is_published: true },
          { id: "3", title: "Kyoto Heritage", location: "Japan", price: "280000", image: "/assets/hero-bg.webp", is_published: true },
          { id: "4", title: "Amboseli Safari", location: "Kenya", price: "390000", image: "/assets/hero-bg.webp", is_published: true }
        ]);
      }
    }

    fetchTrendingPackages();
  }, []);

  useEffect(() => {
    const el = trendingScrollRef.current;
    if (!el) return;
    
    const checkOverflow = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) {
        el.style.maskImage = 'none';
        el.style.webkitMaskImage = 'none';
      } else {
        // Only apply fade if there is actual scrolling content
        const leftOpacity = Math.min(el.scrollLeft / 30, 1);
        const rightRemaining = maxScroll - el.scrollLeft;
        const rightOpacity = Math.min(rightRemaining / 30, 1);
        const leftFade = Math.round(leftOpacity * 24);
        const rightFade = Math.round(rightOpacity * 24);
        
        const mask = `linear-gradient(to right, transparent, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent)`;
        el.style.maskImage = mask;
        el.style.webkitMaskImage = mask;
      }
    };
    
    // Check after a short delay to ensure DOM is painted and widths are correct
    const timeout = setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow, { passive: true });
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [trendingPills]);

  useEffect(() => {
    const startAnimation = () => {
      const ctx = gsap.context(() => {
        // Premium Apple-style Intro Animation
        const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.5 } });

        gsap.set(titleRef.current, { opacity: 0, y: 35 });
        tl.to(
          titleRef.current,
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.8, 
            ease: "elastic.out(1.1, 0.55)", 
            force3D: true,
            clearProps: "y"
          }
        )
          .fromTo(
            subheadRef.current,
            { y: 30, opacity: 0 },
            { 
              y: 0, 
              opacity: 1, 
              duration: 1.2, 
              ease: "power3.out" 
            },
            "-=0.7"
          );

        if (trendingRef.current) {
          gsap.set(trendingRef.current, { y: 60, opacity: 0, scale: 0.3 });
          if (trendingInnerRef.current) gsap.set(trendingInnerRef.current, { scaleX: 0.45, scaleY: 0.7 });
          if (trendingTagRef.current)   gsap.set(trendingTagRef.current,   { opacity: 0, x: -15 });
          if (trendingPillsRef.current) gsap.set(trendingPillsRef.current, { opacity: 0, scale: 0.85 });

          // Stage 1: Kinetic Seed Rise (expo.out) - compressed seed rises from bottom
          tl.to(trendingRef.current, {
            y: 0, opacity: 1, scale: 1,
            duration: 0.55, ease: 'expo.out', force3D: true,
            clearProps: 'scale,y',
          }, '-=0.5')
          // Stage 2: Elastic Morph Expansion (elastic.out(1.1, 0.45))
          .to(trendingInnerRef.current, {
            scaleX: 1, scaleY: 1,
            duration: 0.85, ease: 'elastic.out(1.1, 0.45)', force3D: true,
            clearProps: 'scaleX,scaleY',
          }, '-=0.35');

          // Stage 3: Staggered Content Pop (power3.out & back.out)
          if (trendingTagRef.current) {
            tl.to(trendingTagRef.current, {
              opacity: 1, x: 0,
              duration: 0.45, ease: 'power3.out', force3D: true,
              clearProps: 'opacity,x',
            }, '-=0.6');
          }

          if (trendingPillsRef.current) {
            tl.to(trendingPillsRef.current, {
              opacity: 1, scale: 1,
              duration: 0.4, ease: 'back.out(1.5)', force3D: true,
              clearProps: 'opacity,scale',
            }, '-=0.45');
          }
        }

        // Subtle Scroll Parallax on the image
        if (imageRef.current && containerRef.current) {
          gsap.to(imageRef.current, {
            yPercent: 15,
            force3D: true,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          });
        }
      }, containerRef);
      return ctx;
    };

    let ctx: gsap.Context | null = null;
    const hasPreloaderFinished = typeof window !== "undefined" && (window as any).preloaderPlayed;

    if (hasPreloaderFinished) {
      ctx = startAnimation();
    } else {
      const handlePreloaderComplete = () => {
        ctx = startAnimation();
      };
      window.addEventListener("preloaderComplete", handlePreloaderComplete);
    }

    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative z-10 h-screen-stable w-full flex items-center justify-center overflow-hidden bg-black text-white"
    >
      {/* Background Image Container with top/bottom bleed for seamless resize & parallax */}
      <div 
        ref={imageRef}
        className="absolute -top-[15%] -bottom-[15%] inset-x-0 z-0 select-none pointer-events-none overflow-hidden transform-gpu"
        style={{ willChange: "transform" }}
      >
        <Image
          src="/assets/hero-bg.webp"
          alt="TouraLuxe Elite Wilderness Sanctuary"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-black/20 z-10" />
      </div>

      {/* Static Section Blend Mask (Doesn't move with parallax) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 z-[1] pointer-events-none" />

      {/* Narrative Overlay Content */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col items-center text-center mt-12 md:mt-20">
        
        {/* Cinematic Headline */}
        <h1 
          ref={titleRef}
          className="text-[clamp(1.75rem,7vw,5.5rem)] font-medium leading-[1.05] tracking-[-0.03em] max-w-[1100px] select-none text-white font-serif mb-6 text-center overflow-hidden opacity-0" 
          style={{ willChange: "transform" }}
        >
          {titleLines.map((line, lIdx) => (
            <span key={lIdx} className="block">
              {line}
            </span>
          ))}
        </h1>

        {/* Refined Secondary Narrative */}
        <p 
          ref={subheadRef}
          className="text-[clamp(0.875rem,2.5vw,1rem)] text-pretty font-normal text-white/50 tracking-wide max-w-[620px] mb-[clamp(2rem,5vw,3rem)] leading-relaxed opacity-0"
        >
          {subtitle}
        </p>

        {/* Apple-Tier Dynamic Island Segmented Strip (Unified Mobile + Desktop) */}
        {trendingPills.length > 0 && (
          <div ref={trendingRef} style={{ opacity: 0 }} className="flex items-center justify-center mb-6 w-full max-w-full px-4 select-none">
            <div ref={trendingInnerRef} className="inline-flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-2xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-w-full overflow-hidden">
              
              {/* Lead Status Tag */}
              <div ref={trendingTagRef} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/90 shrink-0">
                <Sparkles size={11} className="text-amber-400 fill-amber-400/30" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">Trending</span>
              </div>

              {/* Horizontal Scrollable Segment Items */}
              <div 
                ref={(el) => {
                  (trendingScrollRef as any).current = el;
                  (trendingPillsRef as any).current = el;
                }}
                className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-nowrap pr-1 scroll-smooth"
                onScroll={() => {
                  const el = trendingScrollRef.current;
                  if (!el) return;
                  const maxScroll = el.scrollWidth - el.clientWidth;
                  if (maxScroll <= 0) {
                    el.style.maskImage = 'none';
                    el.style.webkitMaskImage = 'none';
                    return;
                  }
                  const leftOpacity = Math.min(el.scrollLeft / 20, 1);
                  const rightRemaining = maxScroll - el.scrollLeft;
                  const rightOpacity = Math.min(rightRemaining / 20, 1);
                  const leftFade = Math.round(leftOpacity * 16);
                  const rightFade = Math.round(rightOpacity * 16);
                  const mask = `linear-gradient(to right, transparent, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent)`;
                  el.style.maskImage = mask;
                  el.style.webkitMaskImage = mask;
                }}
              >
                {trendingPills.map((pkg) => (
                  <button
                    key={pkg.id || pkg.title}
                    onClick={() => openModal('PACKAGE', pkg)}
                    className="px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium tracking-wide text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {pkg.title}
                  </button>
                ))}

                <button
                  onClick={() => openBooking(undefined, "TRENDING_OVERFLOW", "Explore All")}
                  className="px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium tracking-wide text-amber-300/80 hover:text-amber-300 hover:bg-amber-400/10 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Explore All</span>
                  <ArrowRight size={10} className="stroke-[2.5]" />
                </button>
              </div>

            </div>
          </div>
        )}


      </div>

      {/* Scroll Indicator
      <div className="scroll-indicator absolute bottom-[clamp(6rem,12vw,8rem)] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-0 pointer-events-none md:hidden">
        {/* {isMobile ? ( * /}
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 border-r-[1.5px] border-b-[1.5px] border-[#a18cd1] rotate-45 animate-pulse mb-1" />
            <div className="w-2.5 h-2.5 border-r-[1.5px] border-b-[1.5px] border-[#fbc2eb] rotate-45 animate-pulse [animation-delay:0.2s]" />
          </div>
        {/* ) : (
          <div className="w-[16px] h-[26px] border border-white/20 rounded-full flex justify-center p-1">
            <div className="w-[1.5px] h-[5px] bg-[#a18cd1] rounded-full animate-bounce" />
          </div>
        ) * /}
        <span className="text-[7px] font-black tracking-[0.25em] uppercase bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] bg-clip-text text-transparent opacity-80">Scroll</span>
      </div>
      */}
    </section>
  );
}
