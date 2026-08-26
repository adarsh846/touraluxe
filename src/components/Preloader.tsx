"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

let preloaderPlayed = false;
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Preloader() {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const jetRef = useRef<HTMLDivElement>(null);
  const natureRef = useRef<HTMLDivElement>(null);
  
  const [shouldRender, setShouldRender] = useState(() => {
    if (typeof window !== "undefined" && preloaderPlayed) {
      (window as any).preloaderPlayed = true;
    }
    return !preloaderPlayed;
  });

  useIsomorphicLayoutEffect(() => {
    if (preloaderPlayed) {
      return;
    }

    const ctx = gsap.context(() => {
      // Lock scrollbar during preloader run
      document.body.style.overflow = "hidden";

      // Immediate synchronous zero-frame initialization to prevent initial render flash (FOUC)
      if (glowRef.current) gsap.set(glowRef.current, { opacity: 0, scale: 0.65 });
      if (natureRef.current) gsap.set(natureRef.current, { opacity: 0, y: 20 });
      if (jetRef.current) gsap.set(jetRef.current, { opacity: 0, x: "-25vw", y: 0, scale: 0.85 });
      gsap.set(".preloader-text span", { opacity: 0, y: 35, scale: 0.9, filter: "blur(20px)" });

      const tl = gsap.timeline({
        onComplete: () => {
          preloaderPlayed = true;
          document.body.style.overflow = "";
          if (typeof window !== "undefined") {
            (window as any).preloaderPlayed = true;
            window.dispatchEvent(new Event("preloaderComplete"));
          }
          setShouldRender(false);
        }
      });

      // 1. Ambient Emerald Aurora Bloom
      if (glowRef.current) {
        tl.to(
          glowRef.current,
          { opacity: 1, scale: 1.1, duration: 1.1, ease: "power2.out" },
          0
        );
      }

      // 2. Panorama Forest Ecosystem Reveal & Gentle Wind Breathing
      if (natureRef.current) {
        tl.to(
          natureRef.current,
          { opacity: 1, y: 0, duration: 1.0, ease: "power3.out" },
          0.1
        );

        // Natural Organic Vertical Wind Breathing (No unnatural rotation)
        gsap.to(".tree-sway", {
          y: -4,
          scaleY: 1.03,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.15
        });
      }

      // 3. Kinetic Overhead Jet Flight Path — Straight Horizontal Entry
      if (jetRef.current) {
        tl.to(
          jetRef.current,
          { x: "0vw", y: 0, opacity: 1, scale: 1, duration: 0.65, ease: "power2.out" },
          0.05
        );
      }

      // 4. Apple Spatial Blur Depth Reveal — Champagne Gold Titanium Logo
      tl.to(
        ".preloader-text span",
        { 
          y: 0, 
          opacity: 1, 
          scale: 1, 
          filter: "blur(0px)", 
          duration: 0.70, 
          ease: "power4.out", 
          stagger: 0.035,
          onComplete: () => {
            gsap.set(".preloader-text span", { clearProps: "filter,transform" });
          }
        },
        0.12
      );

      // 5. Emerald Glass Progress Fill & Ticker
      tl.to({}, {
        duration: 0.85,
        onUpdate: function () {
          const val = Math.round(this.progress() * 100);
          if (progressRef.current) progressRef.current.style.width = `${val}%`;
          if (progressTextRef.current) {
            progressTextRef.current.innerText = `LUXURY REDEFINED — ${val}%`;
          }
        },
        ease: "power2.inOut"
      }, 0.18);

      // 6. OPTION C: Jet Warp Acceleration & Contrail Light Flash Exit Reveal
      if (jetRef.current) {
        tl.to(jetRef.current, {
          x: "55vw",
          scale: 1.4,
          opacity: 0,
          duration: 0.5,
          ease: "power3.in"
        }, "+=0.05");
      }

      // Expanding Emerald & Gold Contrail Flash Veil Unveil
      tl.to([glowRef.current, natureRef.current], {
        opacity: 0,
        scale: 1.25,
        duration: 0.45,
        ease: "power2.in"
      }, "-=0.35");

      tl.to(".preloader-text span", {
        y: -40,
        opacity: 0,
        scale: 1.08,
        filter: "blur(20px)",
        duration: 0.4,
        ease: "power3.in",
        stagger: 0.015,
      }, "-=0.35")
        .to(preloaderRef.current, {
          yPercent: -100,
          filter: "blur(24px)",
          opacity: 0,
          duration: 0.65,
          ease: "power4.inOut",
          onComplete: () => {
            if (preloaderRef.current) {
              gsap.set(preloaderRef.current, { clearProps: "all" });
            }
          }
        }, "-=0.20")
        .set(preloaderRef.current, { display: "none" });

    }, preloaderRef);

    return () => ctx.revert();
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      ref={preloaderRef}
      className="fixed inset-0 z-[10000] bg-[#030504] flex flex-col items-center justify-center text-white overflow-hidden will-change-transform select-none"
    >
      {/* Ambient Emerald Aurora Glow */}
      <div
        ref={glowRef}
        className="absolute w-[320px] h-[320px] sm:w-[550px] sm:h-[550px] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.14)_0%,rgba(16,185,129,0.06)_40%,transparent_70%)] pointer-events-none blur-3xl opacity-0 will-change-transform"
      />

      {/* Kinetic Overhead Jet Silhouette Flight Path — Positioned directly above TOURALUXE */}
      <div
        ref={jetRef}
        className="absolute top-[37%] sm:top-[38%] z-20 flex items-center gap-2 pointer-events-none opacity-0 will-change-transform"
      >
        <div className="w-12 sm:w-16 h-[1.5px] bg-gradient-to-r from-transparent to-amber-300/90 blur-[0.5px]" />
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] rotate-90" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      </div>

      {/* Titanium Metallic Brand Logo Matching Hero Main Text Gradient */}
      <div
        ref={textContainerRef}
        className="preloader-text relative z-10 w-full px-3 sm:px-6 text-[clamp(2.0rem,8.2vw,4.5rem)] font-extrabold tracking-[0.05em] sm:tracking-[0.2em] flex gap-[clamp(0.01rem,0.4vw,0.4rem)] justify-center mb-6 sm:mb-8 leading-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] select-none"
      >
        {["T", "O", "U", "R", "A", "L", "U", "X", "E"].map((char, i) => (
          <span
            key={i}
            className="inline-block bg-gradient-to-b from-white via-slate-100 to-white/65 bg-clip-text text-transparent opacity-0"
          >
            {char}
          </span>
        ))}
      </div>

      {/* Obsidian Glass Progress Capsule */}
      <div className="relative z-10 w-44 sm:w-60 h-[3px] rounded-full bg-white/10 border border-emerald-500/20 backdrop-blur-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.9)]">
        <div
          ref={progressRef}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 via-amber-200 to-emerald-300 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.7)] will-change-[width]"
          style={{ width: "0%" }}
        />
      </div>

      {/* Brand Tagline Ticker */}
      <div
        ref={progressTextRef}
        className="relative z-10 mt-4 sm:mt-5 px-4 text-center text-[9px] sm:text-[10px] font-semibold tracking-[0.25em] sm:tracking-[0.35em] uppercase bg-gradient-to-r from-emerald-200/90 via-amber-200/90 to-emerald-200/90 bg-clip-text text-transparent"
      >
        LUXURY REDEFINED — 0%
      </div>

      {/* Awwwards-Tier Panorama Pine Forest Ecosystem Horizon */}
      <div
        ref={natureRef}
        className="absolute bottom-0 inset-x-0 h-36 sm:h-44 pointer-events-none flex items-end justify-between px-0 sm:px-6 text-emerald-400/55 z-0 overflow-hidden opacity-0"
      >
        {/* Layer 1: Natural Atmospheric Snowy Alpine Mountain Range Backdrop */}
        <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 flex items-end justify-between pointer-events-none opacity-80 sm:opacity-90">
          <svg className="w-full h-full drop-shadow-[0_0_25px_rgba(255,255,255,0.06)]" viewBox="0 0 1200 140" preserveAspectRatio="none">
            <defs>
              <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#cbd5e1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0f291e" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#113828" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#030b06" stopOpacity="0.98" />
              </linearGradient>
              <filter id="softMist" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="1.2" />
              </filter>
            </defs>

            {/* Organic Realistic Alpine Mountain Base Ridge */}
            <path
              d="M0 140 Q40 100 90 75 Q130 45 170 32 Q210 50 250 85 Q300 115 360 80 Q420 40 480 18 Q540 45 610 90 Q670 120 730 70 Q800 30 870 24 Q940 55 1010 88 Q1080 45 1140 60 Q1180 85 1200 140 Z"
              fill="url(#mountainGrad)"
            />

            {/* Organic Soft Snow Caps Blended with Subtraction Curves */}
            {/* Peak 1 Snow */}
            <path
              d="M130 45 Q170 32 210 50 Q190 62 170 58 Q150 64 130 45 Z"
              fill="url(#snowGrad)"
              filter="url(#softMist)"
            />
            {/* Summit 2 Snow */}
            <path
              d="M420 40 Q480 18 540 45 Q515 52 480 46 Q445 54 420 40 Z"
              fill="url(#snowGrad)"
              filter="url(#softMist)"
            />
            {/* Summit 3 Snow */}
            <path
              d="M800 30 Q870 24 Q940 55 Q905 58 870 52 Q835 60 800 30 Z"
              fill="url(#snowGrad)"
              filter="url(#softMist)"
            />
            {/* Right Peak Snow */}
            <path
              d="M1080 45 Q1140 60 Q1180 85 Q1140 76 Q1100 80 1080 45 Z"
              fill="url(#snowGrad)"
              filter="url(#softMist)"
            />
          </svg>
        </div>

        {/* Layer 2: Midground Edge-to-Edge Alpine Pine Forest Canopy */}
        <div className="absolute bottom-0 inset-x-0 h-28 text-emerald-500/35 flex items-end justify-around">
          {[...Array(14)].map((_, i) => (
            <svg
              key={i}
              className={`tree-sway w-12 h-20 sm:w-16 sm:h-28 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)] ${
                i % 2 === 0 ? "scale-x-90" : "scale-x-110"
              }`}
              style={{ animationDelay: `${i * 0.2}s` }}
              viewBox="0 0 100 120"
            >
              {/* Wooden Trunk Base */}
              <rect x="46" y="98" width="8" height="22" rx="1" fill="#4a2c17" opacity="0.85" />
              {/* Green Pine Needle Foliage */}
              <polygon points="50,10 20,50 35,50 15,80 30,80 10,102 90,102 70,80 85,80 65,50 80,50" fill="currentColor" />
            </svg>
          ))}
        </div>

        {/* Layer 2.5: Forest Floor Bush & Shrub Undergrowth Canopy */}
        <div className="absolute bottom-0 inset-x-0 h-16 text-emerald-600/40 flex items-end z-10">
          <svg className="w-full h-full text-emerald-500/35 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]" viewBox="0 0 1200 60" preserveAspectRatio="none" fill="currentColor">
            <path d="M0 60 Q20 25 40 60 Q60 15 90 60 Q120 20 150 60 Q180 30 210 60 Q240 10 280 60 Q320 25 360 60 Q400 15 440 60 Q480 30 520 60 Q560 20 600 60 Q640 10 680 60 Q720 25 760 60 Q800 15 840 60 Q880 30 920 60 Q960 20 1000 60 Q1040 10 1080 60 Q1120 25 1160 60 Q1180 35 1200 60 Z" />
          </svg>
        </div>

        {/* Layer 3: Foreground Majestic Pine & Palm Hero Trees (Left) */}
        <div className="relative z-10 flex items-end -space-x-6 sm:-space-x-8 pl-1 sm:pl-6">
          {/* Giant Alpine Pine 1 */}
          <svg className="tree-sway w-24 h-36 sm:w-36 sm:h-44 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)] text-emerald-400/80" viewBox="0 0 100 120">
            {/* Rich Wooden Bark Trunk */}
            <rect x="44" y="98" width="12" height="22" rx="2" fill="#52321c" />
            <polygon points="50,5 15,45 32,45 10,75 28,75 5,102 95,102 72,75 90,75 68,45 85,45" fill="currentColor" />
          </svg>

          {/* Majestic Pine 2 */}
          <svg className="tree-sway w-20 h-30 sm:w-28 sm:h-36 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] text-teal-300/70" viewBox="0 0 100 120">
            {/* Wooden Trunk Base */}
            <rect x="45" y="98" width="10" height="22" rx="1" fill="#4a2c17" />
            <polygon points="50,10 20,50 35,50 15,80 30,80 10,102 90,102 70,80 85,80 65,50 80,50" fill="currentColor" />
          </svg>

          {/* Tropical Palm Tree with Wooden Stem */}
          <svg className="tree-sway w-20 h-20 sm:w-28 sm:h-28 text-emerald-300/50" viewBox="0 0 100 100">
            {/* Curved Wooden Palm Stem */}
            <path d="M46 95 Q48 55 50 32 Q52 55 54 95 Z" fill="#52321c" />
            {/* Palm Fronds */}
            <path d="M50 32 Q48 20 20 25 Q45 35 48 35 Z" fill="currentColor" />
            <path d="M50 32 Q55 18 80 20 Q58 35 52 35 Z" fill="currentColor" />
            <path d="M50 32 Q30 35 10 50 Q35 48 48 35 Z" fill="currentColor" />
            <path d="M50 32 Q70 35 90 52 Q65 48 52 35 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Constellation of Sparkling Luminescent Stardust Dots & Fireflies */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <div className="absolute bottom-8 left-[8%] w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,1)] animate-pulse" />
          <div className="absolute bottom-16 left-[16%] w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_12px_rgba(251,191,36,1)] animate-pulse" style={{ animationDelay: "0.4s" }} />
          <div className="absolute bottom-28 left-[26%] w-1 h-1 rounded-full bg-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-ping" style={{ animationDelay: "0.8s" }} />
          <div className="absolute bottom-12 left-[36%] w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(45,212,191,1)] animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="absolute bottom-24 left-[48%] w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse" style={{ animationDelay: "0.6s" }} />
          <div className="absolute bottom-14 left-[58%] w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,1)] animate-ping" style={{ animationDelay: "1.0s" }} />
          <div className="absolute bottom-30 left-[68%] w-1 h-1 rounded-full bg-teal-200 shadow-[0_0_8px_rgba(45,212,191,0.9)] animate-pulse" style={{ animationDelay: "0.3s" }} />
          <div className="absolute bottom-10 left-[76%] w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_12px_rgba(251,191,36,1)] animate-pulse" style={{ animationDelay: "0.7s" }} />
          <div className="absolute bottom-22 left-[86%] w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,1)] animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-18 left-[94%] w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(45,212,191,1)] animate-ping" style={{ animationDelay: "0.9s" }} />
        </div>

        {/* Layer 3: Foreground Majestic Pine & Palm Hero Trees (Right) */}
        <div className="relative z-10 flex items-end -space-x-6 sm:-space-x-8 pr-1 sm:pr-6">
          {/* Tropical Palm Tree with Wooden Stem */}
          <svg className="tree-sway w-20 h-20 sm:w-28 sm:h-28 -scale-x-100 text-emerald-300/50" viewBox="0 0 100 100">
            {/* Curved Wooden Palm Stem */}
            <path d="M46 95 Q48 55 50 32 Q52 55 54 95 Z" fill="#52321c" />
            {/* Palm Fronds */}
            <path d="M50 32 Q48 20 20 25 Q45 35 48 35 Z" fill="currentColor" />
            <path d="M50 32 Q55 18 80 20 Q58 35 52 35 Z" fill="currentColor" />
            <path d="M50 32 Q30 35 10 50 Q35 48 48 35 Z" fill="currentColor" />
            <path d="M50 32 Q70 35 90 52 Q65 48 52 35 Z" fill="currentColor" />
          </svg>

          {/* Majestic Pine 3 */}
          <svg className="tree-sway w-20 h-30 sm:w-28 sm:h-36 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] text-teal-300/70" viewBox="0 0 100 120">
            {/* Wooden Trunk Base */}
            <rect x="45" y="98" width="10" height="22" rx="1" fill="#4a2c17" />
            <polygon points="50,10 20,50 35,50 15,80 30,80 10,102 90,102 70,80 85,80 65,50 80,50" fill="currentColor" />
          </svg>

          {/* Giant Alpine Pine 2 */}
          <svg className="tree-sway w-24 h-36 sm:w-36 sm:h-44 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)] text-emerald-400/80" viewBox="0 0 100 120">
            {/* Rich Wooden Bark Trunk */}
            <rect x="44" y="98" width="12" height="22" rx="2" fill="#52321c" />
            <polygon points="50,5 15,45 32,45 10,75 28,75 5,102 95,102 72,75 90,75 68,45 85,45" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}
