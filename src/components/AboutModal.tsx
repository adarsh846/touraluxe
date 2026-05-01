"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import Image from "next/image";
import { Magnetic } from "./Magnetic";
import { X } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Prevent background scrolling
      document.body.style.overflow = "hidden";
      const lenis = (window as any).__lenis;
      if (lenis) lenis.stop();

      // Entrance animation
      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out" })
        .fromTo(panelRef.current, { y: 100, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: "expo.out" }, "-=0.6");
    } else {
      document.body.style.overflow = "";
      const lenis = (window as any).__lenis;
      if (lenis) lenis.start();
    }
  }, [isOpen]);

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current, { y: 50, opacity: 0, scale: 0.98, duration: 0.6, ease: "power2.inOut" })
      .to(overlayRef.current, { opacity: 0, duration: 0.4, ease: "power2.inOut" }, "-=0.4");
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div 
        ref={overlayRef} 
        className="absolute inset-0 bg-black/98 md:bg-black/85 backdrop-blur-2xl" 
        onClick={handleClose} 
      />

      {/* Modal Panel */}
      <div 
        ref={panelRef} 
        data-lenis-prevent
        className="relative w-full max-w-[920px] h-[90vh] bg-[#0a0a0a] border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Top Controls Header Mask — Perfect Mix Easing */}
        <div 
          className="absolute top-0 left-0 right-0 h-40 transition-all duration-1000 backdrop-blur-[5px] z-[90] pointer-events-none" 
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.05) 85%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
          }}
        />

        {/* Top Controls */}
        <div className="absolute top-6 left-6 right-6 z-[100] flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto">
            <Magnetic>
              <div className="relative group">
                {/* Multi-layered Shadow for Deep Floating Effect */}
                <div className="absolute inset-0 bg-black/60 blur-2xl rounded-full translate-y-3 scale-95 opacity-80" />
                <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
                
                <div className="relative flex items-center justify-center bg-white rounded-full w-28 h-10 overflow-hidden cursor-default transition-all duration-500 group-hover:scale-[1.05]">
                  <div className="relative w-28 h-10">
                    <Image
                      src="/assets/logo-transparent.webp"
                      alt="TouraLuxe Logo"
                      fill
                      priority
                      quality={75}
                      sizes="112px"
                      className="object-contain scale-[2.1] translate-y-[4px]"
                    />
                  </div>
                </div>
              </div>
            </Magnetic>
          </div>
          
          <div className="pointer-events-auto">
            <Magnetic>
              <div className="relative group">
                {/* Matching shadow for close button */}
                <div className="absolute inset-0 bg-black/60 blur-xl rounded-full translate-y-2 scale-90 opacity-60" />
                <button 
                  onClick={handleClose} 
                  className="relative w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all duration-500 hover:bg-white/10 text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </Magnetic>
          </div>
        </div>

        <div 
          ref={scrollRef} 
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 30)}
          className="w-full h-full overflow-y-auto scrollbar-hide"
        >
          {/* Hero Section */}
          <div className="relative w-full aspect-[4/3] md:aspect-[2/1] overflow-hidden bg-[#0a0a0a]">
            <Image 
              src="/about_hero.png" 
              alt="TouraLuxe Vision" 
              fill 
              className="object-cover scale-[1.01]" 
              priority 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-transparent" />
            <div className="absolute inset-x-0 -bottom-px h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            
            {/* Header Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.4em] text-white/60 mb-4 drop-shadow-lg">Luxury Redefined</span>
              <h2 className="text-4xl md:text-7xl font-semibold tracking-tighter text-white drop-shadow-2xl">About Us</h2>
            </div>

            {/* Scroll Indicator - Unified Style */}
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-50 transition-all duration-700 ${isScrolled ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white drop-shadow-md">Scroll</span>
              <svg className="w-5 h-5 text-white drop-shadow-md" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </div>

          {/* Body Content */}
          <div className="px-6 md:px-16 py-12 md:py-20 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* Vision */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[1px] bg-white/20" />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/40">Our Vision</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-medium text-white leading-tight">Setting new benchmarks in global travel.</h3>
                <p className="text-[#86868b] leading-relaxed text-sm md:text-base">
                  To become a globally trusted travel and lifestyle brand delivering exceptional luxury experiences, innovative travel solutions, and personalized services. We aspire to redefine journeys through excellence, reliability, and customer satisfaction, creating memorable experiences while building lasting relationships and setting new benchmarks in travel, tourism, and corporate event management worldwide.
                </p>
              </div>

              {/* Mission */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[1px] bg-white/20" />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/40">Our Mission</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-medium text-white leading-tight">Exceptional services, seamless execution.</h3>
                <p className="text-[#86868b] leading-relaxed text-sm md:text-base">
                  To deliver exceptional travel and lifestyle services through personalized solutions, seamless execution, and innovative experiences. We are committed to quality, reliability, and customer satisfaction, providing luxury tours, corporate travel, and event management while building lasting relationships, exceeding expectations, and creating memorable journeys with professionalism, integrity, and global service excellence.
                </p>
              </div>
            </div>

            {/* Core Values / Stats */}
            <div className="mt-24 pt-12 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Founded", value: "2026" },
                { label: "Global Reach", value: "120+ Cities" },
                { label: "Excellence", value: "Premium" },
                { label: "Execution", value: "Seamless" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#86868b]">{stat.label}</span>
                  <span className="text-xl md:text-2xl font-semibold text-white">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-24 text-center">
              <p className="text-sm text-[#86868b] mb-8 italic">&quot;We don&apos;t just sell trips. We craft transcendent experiences.&quot;</p>
              <Magnetic>
                <button 
                  onClick={handleClose}
                  className="px-12 py-4 rounded-full bg-white text-black font-bold text-sm hover:scale-[1.02] transition-transform"
                >
                  Explore Our World
                </button>
              </Magnetic>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
