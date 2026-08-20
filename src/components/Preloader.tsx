"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

let preloaderPlayed = false;

export function Preloader() {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(() => {
    if (typeof window !== "undefined" && preloaderPlayed) {
      (window as any).preloaderPlayed = true;
    }
    return !preloaderPlayed;
  });

  useEffect(() => {
    if (preloaderPlayed) {
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          preloaderPlayed = true;
          if (typeof window !== "undefined") {
            (window as any).preloaderPlayed = true;
            window.dispatchEvent(new Event("preloaderComplete"));
          }
          setShouldRender(false);
        }
      });

      // 1. Apple Spatial Blur Depth Initial Reveal
      tl.fromTo(
        ".preloader-text span",
        { y: 50, opacity: 0, scale: 0.85, filter: "blur(24px)" },
        { 
          y: 0, 
          opacity: 1, 
          scale: 1, 
          filter: "blur(0px)", 
          duration: 0.65, 
          ease: "power3.out", 
          stagger: 0.04,
          onComplete: () => {
            gsap.set(".preloader-text span", { clearProps: "filter" });
          }
        }
      );

      // 2. Smooth Progress Animation (Simulated but ultra-smooth)
      tl.to({}, {
        duration: 0.8, // Total load time is under 1s
        onUpdate: function () {
          const val = Math.round(this.progress() * 100);
          if (progressRef.current) progressRef.current.style.width = `${val}%`;
          if (progressTextRef.current) progressTextRef.current.innerText = `Authentic Excellence — ${val}%`;
        },
        ease: "power2.inOut"
      });

      // 3. Apple Spatial Depth Curtain Exit Unveil
      tl.to(".preloader-text span", {
        y: -50,
        opacity: 0,
        scale: 1.1,
        filter: "blur(20px)",
        duration: 0.35,
        ease: "power2.in",
        stagger: 0.02,
      }, "+=0.1")
        .to(preloaderRef.current, {
          yPercent: -100,
          filter: "blur(30px)",
          opacity: 0,
          duration: 0.65,
          ease: "power3.inOut",
          onComplete: () => {
            if (preloaderRef.current) {
              gsap.set(preloaderRef.current, { clearProps: "filter" });
            }
          }
        }, "-=0.1")
        .set(preloaderRef.current, { display: "none" });

    }, preloaderRef);

    return () => ctx.revert();
  }, []);

  if (!shouldRender) return null;

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
