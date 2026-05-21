"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Image from "next/image";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HeroMobile() {
  const containerRef = useRef<HTMLElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mobile Hero is lightweight (static image), so we signal 100% progress immediately 
    // to release the Preloader once the component mounts.
    (window as any).__heroProgress = 100;
    window.dispatchEvent(new CustomEvent("hero-progress", { detail: 100 }));

    const ctx = gsap.context(() => {
      // Snappier Apple-style Intro Animation for Mobile
      const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.2 } });

      tl.fromTo(
        imageRef.current,
        { scale: 1.15, opacity: 0 },
        { scale: 1, opacity: 1, duration: 3 }
      )
        .fromTo(
          ".word",
          { y: 60, opacity: 0, rotate: 2 },
          { y: 0, opacity: 1, rotate: 0, stagger: 0.06 },
          "-=2.7"
        )
        .fromTo(
          subheadRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1 },
          "-=2.4"
        )
        .fromTo(
          ".scroll-indicator",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" },
          "-=1.5"
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

    return () => ctx.revert(); // Cleanup GSAP
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative z-10 h-screen w-full flex items-center justify-center overflow-hidden bg-black text-white"
    >
      {/* Background Image Container */}
      <div
        ref={imageRef}
        className="absolute inset-0 w-full h-full will-change-transform z-0 opacity-0"
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
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
        <h1
          className="text-[clamp(2rem,8vw,5rem)] text-balance font-semibold tracking-tight leading-[1.1] mb-6 opacity-100 will-change-transform flex flex-wrap justify-center gap-x-[0.3em]"
        >
          <span className="word inline-block opacity-0">We</span>
          <span className="word inline-block opacity-0">don&apos;t</span>
          <span className="word inline-block opacity-0">sell</span>
          <span className="word inline-block opacity-0">trips.</span>
          <div className="basis-full h-0" />
          <span className="word inline-block opacity-0 text-white/80">We</span>
          <span className="word inline-block opacity-0 text-white/80">craft</span>
          <span className="word inline-block opacity-0 text-white/80">experiences.</span>
        </h1>

        <p
          ref={subheadRef}
          className="text-lg md:text-xl text-white/70 max-w-2xl font-normal tracking-wide opacity-0 will-change-transform"
        >
          A new standard in luxury travel. Immersive, exclusive, and tailored entirely to your desires.
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator absolute bottom-[clamp(6rem,12vw,8rem)] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-0 pointer-events-none">
        <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/40">Scroll</span>
        <svg className="scroll-chevron w-4 h-4 text-white/40" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </div>
    </section>
  );
}
