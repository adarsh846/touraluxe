"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { Magnetic } from "../Magnetic";

export function CTA() {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background subtle scale effect on scroll
      gsap.fromTo(
        bgRef.current,
        { scale: 1 },
        {
          scale: 1.05,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      // Content reveal (Horizontal)
      gsap.fromTo(
        contentRef.current,
        { y: 50, x: -30, opacity: 0 },
        {
          y: 0,
          x: 0,
          opacity: 1,
          duration: 1.5,
          ease: "expo.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      id="contact"
      className="relative py-40 px-6 w-full bg-zinc-950 text-white overflow-hidden flex items-center justify-center min-h-screen"
    >
      {/* Abstract dark gradients for premium Apple-like dark mode feel */}
      <div 
        ref={bgRef}
        className="absolute inset-0 opacity-40 will-change-transform"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 60%)"
        }}
      />

      <div 
        ref={contentRef}
        className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-8 opacity-0 will-change-transform"
      >
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1]">
          Ready to transcend the ordinary?
        </h2>
        
        <p className="text-lg md:text-xl text-white/60 max-w-xl font-normal tracking-wide">
          Connect with our travel curators to design your next unparalleled experience.
        </p>

        <Magnetic>
          <Link
            href="mailto:hello@touraluxe.com"
            className="mt-4 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
          >
            Begin Your Journey
          </Link>
        </Magnetic>
      </div>
    </section>
  );
}
