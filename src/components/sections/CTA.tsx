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

      // Masked text reveal sequence for the CTA
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        }
      });

      // 1. Unmask the words smoothly
      tl.to(".cta-word", {
        y: "0%",
        duration: 1.2,
        stagger: 0.08,
        ease: "power4.out",
      })
      // 2. Fade up the rest of the content (paragraph and button)
      .fromTo(
        ".cta-content",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "expo.out",
        },
        "-=0.8" // Start fading in while words are still landing
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
        className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-8"
      >
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] flex flex-wrap justify-center gap-x-[0.3em]">
          {"Ready to transcend the ordinary?".split(" ").map((word, i) => (
            <span key={i} className="overflow-hidden inline-flex pt-2 pb-1 -my-2">
              <span className="cta-word inline-block translate-y-[110%] will-change-transform">
                {word}
              </span>
            </span>
          ))}
        </h2>
        
        <p className="cta-content opacity-0 text-lg md:text-xl text-white/60 max-w-xl font-normal tracking-wide will-change-transform">
          Connect with our travel curators to design your next unparalleled experience.
        </p>

        <div className="cta-content opacity-0 will-change-transform">
          <Magnetic>
            <Link
              href="mailto:hello@touraluxe.com"
              className="mt-4 inline-block rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
            >
              Begin Your Journey
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
