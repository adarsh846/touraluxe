"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function Preloader() {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Initial Reveal
      tl.fromTo(
        ".preloader-text span",
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", stagger: 0.04 }
      );

      // 2. Smooth Progress Animation (Simulated but ultra-smooth)
      tl.to({}, {
        duration: 0.8, // Total load time is now under 1s
        onUpdate: function () {
          const val = Math.round(this.progress() * 100);
          if (progressRef.current) progressRef.current.style.width = `${val}%`;
          if (progressTextRef.current) progressTextRef.current.innerText = `Authentic Excellence — ${val}%`;
        },
        ease: "power2.inOut"
      });

      // 3. Ultra-Fast Exit
      tl.to(".preloader-text span", {
        y: -60,
        opacity: 0,
        duration: 0.3,
        ease: "expo.in",
        stagger: 0.02,
      }, "+=0.1")
        .to(preloaderRef.current, {
          yPercent: -100,
          duration: 0.6,
          ease: "expo.inOut",
        }, "-=0.1")
        .set(preloaderRef.current, { display: "none" });

    }, preloaderRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={preloaderRef}
      className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-white overflow-hidden will-change-transform"
    >
      <div
        ref={textContainerRef}
        className="preloader-text text-[clamp(2.5rem,6vw,4rem)] font-semibold tracking-tighter flex gap-[clamp(0.25rem,1vw,0.5rem)] mb-6 leading-none"
      >
        {["T", "O", "U", "R", "A", "L", "U", "X", "E"].map((char, i) => (
          <span key={i} className="inline-block">{char}</span>
        ))}
      </div>

      <div className="w-48 h-[1px] bg-white/10 relative overflow-hidden">
        <div
          ref={progressRef}
          className="absolute top-0 left-0 h-full bg-white will-change-[width]"
          style={{ width: "0%" }}
        />
      </div>

      <div
        ref={progressTextRef}
        className="mt-4 text-[10px] font-medium tracking-[0.2em] uppercase text-white/30"
      >
        Authentic Excellence — 0%
      </div>
    </div>
  );
}
