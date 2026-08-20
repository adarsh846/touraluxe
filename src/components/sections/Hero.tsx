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
        // Premium Apple-style Intro Animation — Balanced Rhythmic Orchestration
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

        // 1. Headline Entrance
        gsap.set(titleRef.current, { opacity: 0, y: 35 });
        tl.to(
          titleRef.current,
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.85, 
            ease: "elastic.out(1.1, 0.55)", 
            force3D: true,
            clearProps: "y"
          }
        )
        // 2. Subtitle Entrance (starts seamlessly as title settles)
        .fromTo(
          subheadRef.current,
          { y: 24, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.65, 
            ease: "power3.out",
            clearProps: "y"
          },
          "-=0.45"
        );

        // 3. Trending Pill Dynamic Island Unfold (starts right as subtitle settles)
        if (trendingRef.current) {
          gsap.set(trendingRef.current, { y: 35, opacity: 0, filter: "blur(20px)" });
          if (trendingInnerRef.current) gsap.set(trendingInnerRef.current, { scaleX: 0.65, scaleY: 0.90 });
          if (trendingTagRef.current)   gsap.set(trendingTagRef.current,   { opacity: 0, x: -10 });

          const pillButtons = trendingPillsRef.current ? trendingPillsRef.current.querySelectorAll("button") : [];
          if (pillButtons.length > 0) {
            gsap.set(pillButtons, { opacity: 0, y: 6 });
          }

          // Phase 1: Spatial Seed Rise & 20px Unblur (0.45s power3.out)
          tl.to(trendingRef.current, {
            y: 0, opacity: 1, filter: "blur(0px)",
            duration: 0.45, ease: "power3.out", force3D: true,
            clearProps: "y,opacity,filter",
          }, "-=0.20")
          // Phase 2: Smooth Elastic Width Expansion (0.60s elastic.out(1.0, 0.5))
          .to(trendingInnerRef.current, {
            scaleX: 1, scaleY: 1,
            duration: 0.60, ease: "elastic.out(1.0, 0.5)", force3D: true,
            clearProps: "scaleX,scaleY",
          }, "-=0.28");

          // Phase 3: Gold Tag & Pill Items Fluid Unveil
          if (trendingTagRef.current) {
            tl.to(trendingTagRef.current, {
              opacity: 1, x: 0,
              duration: 0.30, ease: "power3.out",
              clearProps: "opacity,x",
            }, "-=0.20");
          }

          if (pillButtons.length > 0) {
            tl.to(pillButtons, {
              opacity: 1, y: 0,
              duration: 0.30, ease: "power3.out", stagger: 0.025,
              clearProps: "opacity,y",
            }, "-=0.18");
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
        
        {/* Cinematic Headline with Titanium Editorial Metallic Gradient */}
        <h1 
          ref={titleRef}
          className="text-[clamp(1.75rem,7vw,5.5rem)] font-medium leading-[1.05] tracking-[-0.03em] max-w-[1100px] select-none text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-white/65 drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] font-serif mb-6 text-center overflow-hidden opacity-0" 
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
          className="text-[clamp(0.875rem,2.5vw,1rem)] text-pretty font-normal text-white/60 tracking-wide max-w-[620px] mb-[clamp(2rem,5vw,3rem)] leading-relaxed opacity-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
        >
          {subtitle}
        </p>

        {/* Apple-Tier Dynamic Island Kinetic Glass Pill Segmented Strip */}
        {trendingPills.length > 0 && (
          <div ref={trendingRef} style={{ opacity: 0 }} className="flex items-center justify-center mb-6 w-full max-w-full px-4 select-none">
            <div ref={trendingInnerRef} className="relative inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#0a0a0c]/65 backdrop-blur-3xl border border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.75),0_1px_0px_rgba(255,255,255,0.12)_inset] max-w-full overflow-hidden">
              
              {/* Apple iOS subtle top-down gradient border ring */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none z-[2]"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.00) 75%)",
                  padding: "1px",
                  borderRadius: "9999px",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "destination-out",
                  maskComposite: "exclude",
                }}
              />

              {/* Lead Status Tag — Refined Subtle Gold Badge */}
              <div ref={trendingTagRef} className="relative z-[3] inline-flex items-center justify-center gap-1.5 h-7 sm:h-8 px-3 rounded-full bg-gradient-to-r from-amber-400/[0.10] via-amber-400/[0.05] to-transparent border border-amber-400/20 text-amber-300/90 shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.10)]">
                <Sparkles size={11} className="text-amber-300/80 fill-amber-300/30 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] leading-none">Trending</span>
              </div>

              {/* Horizontal Scrollable Segment Items */}
              <div 
                ref={(el) => {
                  (trendingScrollRef as any).current = el;
                  (trendingPillsRef as any).current = el;
                }}
                className="relative z-[3] flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-nowrap pr-1 scroll-smooth"
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
                    className="inline-flex items-center justify-center h-7 sm:h-8 px-3.5 rounded-full text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-white/65 bg-white/[0.04] border border-white/10 hover:text-white hover:bg-white/[0.10] hover:border-white/20 active:scale-[0.95] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer shrink-0 whitespace-nowrap shadow-xs leading-none"
                  >
                    {pkg.title}
                  </button>
                ))}

                <button
                  onClick={() => openBooking(undefined, "TRENDING_OVERFLOW", "Explore All")}
                  className="inline-flex items-center justify-center h-7 sm:h-8 px-3.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-amber-300/90 bg-amber-400/[0.08] border border-amber-400/20 hover:text-amber-200 hover:bg-amber-400/[0.14] hover:border-amber-400/35 active:scale-[0.95] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer shrink-0 gap-1.5 whitespace-nowrap shadow-[0_2px_8px_rgba(245,158,11,0.08)] leading-none"
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
