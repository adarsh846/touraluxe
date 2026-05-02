"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function Preloader() {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    let currentProgress = 0;
    let targetProgress = 0;

    // Force top on load
    window.scrollTo(0, 0);
    
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      let is3DReady = false;

      // 1. Initial Reveal
      tl.fromTo(
        ".preloader-text span",
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", stagger: 0.04 }
      );

      // 2. Progress Logic
      const updateUI = () => {
        if (progressRef.current) progressRef.current.style.width = `${currentProgress}%`;
        if (progressTextRef.current) progressTextRef.current.innerText = `Authentic Excellence — ${Math.round(currentProgress)}%`;
      };

      const finishLoader = () => {
        const exitTl = gsap.timeline();
        exitTl.to(".preloader-text span", {
          y: -60,
          opacity: 0,
          duration: 0.3,
          ease: "expo.in",
          stagger: 0.02,
        }, "+=0.2")
        .to(preloaderRef.current, {
          yPercent: -100,
          duration: 0.6,
          ease: "expo.inOut",
        }, "-=0.1")
        .set(preloaderRef.current, { display: "none" });
      };

      // Simulated smooth crawl (ticker)
      const ticker = () => {
        const ease = isDesktop ? (targetProgress > currentProgress ? 0.03 : 0.08) : 0.15;
        
        // Cap the progress at 95% if 3D isn't ready yet
        let effectiveTarget = targetProgress;
        if (!is3DReady && effectiveTarget > 95) effectiveTarget = 95;

        currentProgress += (effectiveTarget - currentProgress) * ease;
        updateUI();

        if (currentProgress > (isDesktop ? 99.9 : 98) && targetProgress >= 100 && is3DReady) {
          currentProgress = 100;
          updateUI();
          gsap.ticker.remove(ticker);
          finishLoader();
        }
      };

      gsap.ticker.add(ticker);

      const onProgress = (e: any) => {
        targetProgress = e.detail;
      };

      const on3DReady = () => {
        is3DReady = true;
      };

      window.addEventListener("hero-progress", onProgress);
      window.addEventListener("3d-ready", on3DReady);

      // Fallback: If 3D takes too long (8s), assume ready to prevent stuck loader
      const threeDFallback = setTimeout(() => {
        is3DReady = true;
      }, 8000);

      const timeout = setTimeout(() => {
        if (targetProgress < 10) targetProgress = 100;
        is3DReady = true; // Fallback for 3D too
      }, 15000);

      return () => {
        gsap.ticker.remove(ticker);
        window.removeEventListener("hero-progress", onProgress);
        window.removeEventListener("3d-ready", on3DReady);
        clearTimeout(timeout);
        clearTimeout(threeDFallback);
      };
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
        className="preloader-text text-4xl md:text-6xl font-semibold tracking-tighter flex gap-1 mb-6"
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
