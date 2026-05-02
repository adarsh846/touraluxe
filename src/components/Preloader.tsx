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
        // Approach target smoothly
        // Mobile optimization: Use a much faster ease (0.15 vs 0.03) to release the user instantly
        const mobileEase = 0.15;
        const desktopEase = 0.03;
        const ease = isDesktop ? (targetProgress > currentProgress ? desktopEase : 0.08) : mobileEase;
        
        currentProgress += (targetProgress - currentProgress) * ease;
        updateUI();

        // PRODUCTION GATE: Only exit if we are at 100% and the target is also 100%
        if (currentProgress > (isDesktop ? 99.9 : 98) && targetProgress >= 100) {
          currentProgress = 100;
          updateUI();
          gsap.ticker.remove(ticker);
          finishLoader();
        }
      };

      gsap.ticker.add(ticker);

      const onProgress = (e: any) => {
        // Map the 0-100 hero progress to the target
        targetProgress = e.detail;
      };

      window.addEventListener("hero-progress", onProgress);

      // Fallback: Extend the timeout to 15s to allow for real heavy loading on slow networks
      // But only if we aren't seeing any progress at all
      const timeout = setTimeout(() => {
        if (targetProgress < 10) targetProgress = 100;
      }, 15000);

      return () => {
        gsap.ticker.remove(ticker);
        window.removeEventListener("hero-progress", onProgress);
        clearTimeout(timeout);
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
