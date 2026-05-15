"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";
import { useSettings } from "@/hooks/useSettings";
import { Search } from "lucide-react";
import { useBooking } from "../BookingProvider";
import { Magnetic } from "../Magnetic";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { settings } = useSettings();
  const { openBooking } = useBooking();
  const [searchValue, setSearchValue] = useState("");

  const title = settings.hero_title || "We don't sell trips. \nWe craft experiences.";
  const subtitle = settings.hero_subtitle || "Immersive, exclusive, and tailored entirely to your desires.";

  const titleLines = title.split('\n');

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    
    const ctx = gsap.context(() => {
      // Premium Apple-style Intro Animation
      // Use only transform + opacity (translate3d for performance)
      const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.5 } });

      tl.fromTo(
        imageRef.current,
        { scale: 1.15, opacity: 0 },
        { scale: 1, opacity: 1, duration: 3 }
      )
        .fromTo(
          ".word",
          { y: 100, opacity: 0, rotate: 5, x: -20 },
          { y: 0, opacity: 1, rotate: 0, x: 0, stagger: 0.1 },
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

      // Fade out scroll indicator on scroll, reappear when scrolling back
      gsap.fromTo(".scroll-indicator",
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -10,
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
          scrub: true,
        },
      });
    }, containerRef);

    return () => {
      window.removeEventListener('resize', handleResize);
      ctx.revert(); // Cleanup GSAP
    };
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative z-10 h-screen w-full flex items-center justify-center overflow-hidden bg-black text-white"
    >
      {/* Background Image Container */}
      <div
        ref={imageRef}
        className="absolute inset-0 w-full h-full will-change-transform z-0 opacity-0 transform-gpu"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        <Image
          src="/assets/hero-bg.webp"
          alt="Luxury Scenic View"
          fill
          className="object-cover opacity-60"
          priority
          quality={75}
          sizes="100vw"
        />
        {/* Subtle gradient overlay to ensure text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto transform-gpu" style={{ transform: "translate3d(0,0,0)" }}>
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] mb-6 opacity-100 will-change-transform flex flex-wrap justify-center gap-x-[0.3em]"
        >
          {titleLines.map((line, lineIdx) => (
            <div key={lineIdx} className="flex flex-wrap justify-center gap-x-[0.3em] w-full">
              {line.split(' ').map((word, wordIdx) => (
                <span key={`${lineIdx}-${wordIdx}`} className="word inline-block opacity-0">
                  {word}
                </span>
              ))}
            </div>
          ))}
        </h1>

        <p
          ref={subheadRef}
          className="text-lg md:text-xl text-white/70 max-w-2xl font-normal tracking-wide opacity-0 will-change-transform mb-12"
        >
          {subtitle}
        </p>

        {/* Sovereign Portal Input (Phase 3 Entry) */}
        <div className="relative w-full max-w-xl group/portal animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 mt-4 px-1 md:px-0 transform-gpu" style={{ transform: "translate3d(0,0,0)" }}>
          <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-xl rounded-full border border-white/20 group-hover/portal:border-white/40 transition-all duration-700 shadow-xl group-hover/portal:shadow-[0_20px_60px_-10px_rgba(255,255,255,0.1)]" />
          <div className="relative flex items-center px-4 py-3.5 md:px-8 md:py-5">
            <Search size={18} className="text-white/40 group-hover/portal:text-white/80 transition-colors shrink-0" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={isMobile ? "Find Your Destination..." : "Where shall we take you?"}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchValue.trim()) {
                    openBooking(undefined, "HERO_PORTAL", searchValue);
                  }
                }
              }}
              className="w-full bg-transparent border-none outline-none pl-3 md:pl-5 text-sm md:text-lg font-light text-white placeholder:text-white/50 focus:placeholder:text-white/30 transition-all"
            />
            <Magnetic>
              <button
                onClick={() => searchValue.trim() && openBooking(undefined, "HERO_PORTAL", searchValue)}
                className="bg-white text-black text-[10px] md:text-xs tracking-[0.2em] font-bold uppercase px-4 py-2 md:px-8 md:py-3 rounded-full hover:bg-black hover:text-white transition-all duration-500 shadow-xl"
              >
                Explore
              </button>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator absolute bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-0">
        <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/40">Scroll</span>
        <svg className="scroll-chevron w-4 h-4 text-white/40" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </div>
    </section>
  );
}
