"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Image from "next/image";
import { useSettings } from "@/hooks/useSettings";
import { Search, MapPin, Calendar, Sparkles, ArrowRight } from "lucide-react";
import { useBooking } from "../BookingProvider";
import { Magnetic } from "../Magnetic";
import { supabase } from "@/lib/supabase";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { settings } = useSettings();
  const { openBooking } = useBooking();
  const [trendingPills, setTrendingPills] = useState<{ label: string; value: string }[]>([]);
  const trendingScrollRef = useRef<HTMLDivElement>(null);


  const title = settings.hero_title || "We don't sell trips. \nWe craft experiences.";
  const subtitle = settings.hero_subtitle || "Immersive, exclusive, and tailored entirely to your desires.";

  const titleLines = title.split('\n');

  useEffect(() => {
    async function fetchThemes() {
      try {
        const { data, error } = await supabase
          .from("packages")
          .select("tags, category")
          .eq("is_published", true);

        if (error) throw error;

        if (data && data.length > 0) {
          const rawThemes = new Set<string>();
          data.forEach((pkg) => {
            if (Array.isArray(pkg.tags)) {
              pkg.tags.forEach((t: string) => {
                if (t && t.trim().length > 1) rawThemes.add(t.trim());
              });
            }
            if (Array.isArray(pkg.category)) {
              pkg.category.forEach((c: string) => {
                if (c && c.trim().length > 1) rawThemes.add(c.trim());
              });
            }
          });

          const themesList = Array.from(rawThemes);
          const finalThemes = themesList.length > 0 ? themesList : ["Mountain", "Beach", "Culture", "Adventure"];

          // Beautiful marketing title mapping
          const formatted = finalThemes.map((theme) => {
            const lower = theme.toLowerCase().trim();
            let label = theme;
            let value = theme;

            if (lower === "adventure" || lower === "extreme adventure") {
              label = "Extreme Adventure";
              value = "Adventure";
            } else if (lower === "honeymoon" || lower === "luxury honeymoons" || lower === "honeymoons") {
              label = "Romantic Honeymoon";
              value = "Honeymoon";
            } else if (lower === "cultural" || lower === "culture" || lower === "cultural heritage") {
              label = "Cultural Heritage";
              value = "Cultural";
            } else if (lower === "mountain" || lower === "mountains" || lower === "mountain retreats") {
              label = "Mountain Retreats";
              value = "Mountain";
            } else if (lower === "beach" || lower === "beach resorts" || lower === "coastal sanctuaries" || lower === "coastal") {
              label = "Coastal Sanctuaries";
              value = "Beach";
            } else if (lower === "wildlife" || lower === "wildlife safari" || lower === "safari") {
              label = "Wildlife Safari";
              value = "Wildlife";
            } else {
              label = theme
                .replace(/([A-Z])/g, " $1")
                .trim()
                .replace(/^\w/, (c) => c.toUpperCase());
            }

            return { label, value };
          });

          // Deduplicate by label to prevent duplicate keys in UI
          const uniqueFormatted: { label: string; value: string }[] = [];
          const seenLabels = new Set<string>();
          
          formatted.forEach(item => {
            if (!seenLabels.has(item.label)) {
              seenLabels.add(item.label);
              uniqueFormatted.push(item);
            }
          });

          // Fisher-Yates Shuffle
          for (let i = uniqueFormatted.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [uniqueFormatted[i], uniqueFormatted[j]] = [uniqueFormatted[j], uniqueFormatted[i]];
          }

          setTrendingPills(uniqueFormatted.slice(0, 4));
        } else {
          setTrendingPills([
            { label: "Mountain Retreats", value: "Mountain" },
            { label: "Coastal Sanctuaries", value: "Beach" },
            { label: "Cultural Heritage", value: "Culture" },
            { label: "Extreme Adventure", value: "Adventure" }
          ]);
        }
      } catch (err) {
        console.warn("Error fetching dynamic themes:", err);
        setTrendingPills([
          { label: "Mountain Retreats", value: "Mountain" },
          { label: "Coastal Sanctuaries", value: "Beach" },
          { label: "Cultural Heritage", value: "Culture" },
          { label: "Extreme Adventure", value: "Adventure" }
        ]);
      }
    }

    fetchThemes();
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
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [trendingPills]);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    
    const ctx = gsap.context(() => {
      // Premium Apple-style Intro Animation
      const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.5 } });

      tl.fromTo(
        imageRef.current,
        { scale: 1.15, opacity: 0 },
        { scale: 1, opacity: 1, duration: 3 }
      )
        .fromTo(
          ".word",
          { y: 100, opacity: 0, skewX: 5, x: -20 },
          { y: 0, opacity: 1, skewX: 0, x: 0, stagger: 0.1, force3D: true },
          "-=2.5"
        )
        .fromTo(
          subheadRef.current,
          { y: 40, x: 30, opacity: 0 },
          { y: 0, x: 0, opacity: 1 },
          "-=2.2"
        )
        .fromTo(
          ".scroll-indicator",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 1, ease: "expo.out" },
          "-=0.8"
        );

      // Fade out scroll indicator on scroll
      gsap.fromTo(".scroll-indicator",
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "120px top",
            scrub: true,
          },
        }
      );

      // Subtle Scroll Parallax on the image
      gsap.to(imageRef.current, {
        yPercent: 15,
        force3D: true,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
        },
      });
    }, containerRef);

    return () => {
      window.removeEventListener('resize', handleResize);
      ctx.revert();
    };
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative z-10 h-screen-stable w-full flex items-center justify-center overflow-hidden bg-black text-white"
    >
      {/* Background Image Container */}
      <div 
        ref={imageRef}
        className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden scale-110 opacity-0"
        style={{ willChange: "transform, opacity" }}
      >
        <Image
          src="/assets/hero-bg.webp"
          alt="TouraLuxe Elite Wilderness Sanctuary"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20 z-10" />
      </div>

      {/* Static Section Blend Mask (Doesn't move with parallax) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 z-[1] pointer-events-none" />

      {/* Narrative Overlay Content */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col items-center text-center mt-12 md:mt-20">
        
        {/* Cinematic Headline */}
        <h1 className="text-[clamp(1.75rem,7vw,5.5rem)] font-medium leading-[1.05] tracking-[-0.03em] max-w-[1100px] select-none text-white font-serif mb-6 flex flex-wrap justify-center overflow-hidden" style={{ willChange: "transform" }}>
          {titleLines.map((line, lIdx) => (
            <div key={lIdx} className="w-full flex flex-wrap justify-center gap-x-[clamp(0.25em,1.5vw,1rem)] overflow-hidden py-1">
              {line.split(' ').map((word, wIdx) => (
                <span key={wIdx} className="word inline-block origin-bottom opacity-0">
                  {word}
                </span>
              ))}
            </div>
          ))}
        </h1>

        {/* Refined Secondary Narrative */}
        <p 
          ref={subheadRef}
          className="text-[clamp(0.875rem,2.5vw,1rem)] text-pretty font-normal text-white/50 tracking-wide max-w-[620px] mb-[clamp(2rem,5vw,3rem)] leading-relaxed opacity-0"
        >
          {subtitle}
        </p>

        {/* Dynamic Trending Travel Theme Pills */}
        {trendingPills.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[600ms] w-full max-w-4xl mx-auto px-4">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50 shrink-0">Trending:</span>
            <div 
              ref={trendingScrollRef}
              className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-nowrap"
              onScroll={() => {
                const el = trendingScrollRef.current;
                if (!el) return;
                const maxScroll = el.scrollWidth - el.clientWidth;
                if (maxScroll <= 0) {
                  el.style.maskImage = 'none';
                  el.style.webkitMaskImage = 'none';
                  return;
                }
                // Continuous fade: 0→1 over first 30px of scroll
                const leftOpacity = Math.min(el.scrollLeft / 30, 1);
                const rightRemaining = maxScroll - el.scrollLeft;
                const rightOpacity = Math.min(rightRemaining / 30, 1);
                // Fade distance scales with opacity (0px when fully visible, 24px when fully faded)
                const leftFade = Math.round(leftOpacity * 24);
                const rightFade = Math.round(rightOpacity * 24);
                const mask = `linear-gradient(to right, transparent, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent)`;
                el.style.maskImage = mask;
                el.style.webkitMaskImage = mask;
              }}
              style={{ 
                maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
                WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
              }}
            >
              {trendingPills.map((theme) => (
                <button
                  key={theme.label}
                  onClick={() => {
                    openBooking(undefined, "HERO_PORTAL", theme.value);
                  }}
                  className="px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider text-white/70 hover:text-amber-400 border border-white/15 hover:border-amber-400/30 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-sm transition-all duration-500 active:scale-95 cursor-pointer shrink-0"
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>
        )}


      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator absolute bottom-[clamp(6rem,12vw,8rem)] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-0 pointer-events-none md:hidden">
        {/* {isMobile ? ( */}
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 border-r-[1.5px] border-b-[1.5px] border-amber-400 rotate-45 animate-pulse mb-1" />
            <div className="w-2.5 h-2.5 border-r-[1.5px] border-b-[1.5px] border-amber-400 rotate-45 animate-pulse [animation-delay:0.2s]" />
          </div>
        {/* ) : (
          <div className="w-[16px] h-[26px] border border-white/20 rounded-full flex justify-center p-1">
            <div className="w-[1.5px] h-[5px] bg-amber-400 rounded-full animate-bounce" />
          </div>
        )} */}
        <span className="text-[7px] font-black tracking-[0.25em] uppercase text-white/20">Scroll</span>
      </div>
    </section>
  );
}
