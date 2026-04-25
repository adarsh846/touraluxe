"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Image from "next/image";

export function HeroStatic() {
  const containerRef = useRef<HTMLElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

      // Fade out scroll indicator on scroll
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

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative z-10 h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-black text-white"
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
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 sm:px-4 max-w-4xl mx-auto mt-[-10vh] sm:mt-0">
        <h1 className="hero-text text-[15vw] sm:text-7xl md:text-8xl lg:text-[120px] font-bold tracking-tighter text-white opacity-100 leading-[1] sm:leading-none flex flex-col sm:block mb-4 sm:mb-6">
          <div className="flex justify-center">
            <span className="word inline-block opacity-0">We</span>
            <span className="word inline-block opacity-0 ml-4">craft</span>
          </div>
          <div className="flex justify-center mt-2">
            <span className="word inline-block opacity-0 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">experiences.</span>
          </div>
        </h1>

        <p
          ref={subheadRef}
          className="text-[4.5vw] sm:text-xl md:text-2xl lg:text-3xl text-white/80 max-w-[100%] sm:max-w-3xl mx-auto font-medium tracking-tight opacity-0 will-change-transform leading-snug sm:leading-normal"
        >
          A new standard in luxury travel. Immersive, exclusive, and tailored entirely to your desires.
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator absolute bottom-16 md:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-0 pointer-events-none">
        <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/40">Scroll</span>
        <svg className="scroll-chevron w-4 h-4 text-white/40 animate-bounce" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </div>
    </section>
  );
}
