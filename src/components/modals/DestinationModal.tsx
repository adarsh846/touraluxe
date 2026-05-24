"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { DestinationNavbar } from "@/components/DestinationNavbar";

export function DestinationModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleInternalScroll = () => {
    if (scrollRef.current) {
      setIsScrolled(scrollRef.current.scrollTop > 30);
    }
  };

  const handleBack = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);

    const tl = gsap.timeline({ onComplete: () => router.back() });
    tl.to(panelRef.current, { y: "100%", duration: 0.5, ease: "power3.in" })
      .to(overlayRef.current, { opacity: 0, duration: 0.4, ease: "power2.in" }, "-=0.3");
  }, [isExiting, router]);

  const handleFullClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);

    const tl = gsap.timeline({ onComplete: () => { window.location.href = "/"; } });
    tl.to(panelRef.current, { y: "100%", duration: 0.5, ease: "power3.in" })
      .to(overlayRef.current, { opacity: 0, duration: 0.4, ease: "power2.in" }, "-=0.3");
  }, [isExiting]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__lenis?.stop();

    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power3.out" }
      );
      gsap.fromTo(panelRef.current,
        { y: "100%" },
        { y: "0%", duration: 1, ease: "power4.out", delay: 0.1 }
      );
    });

    return () => {
      document.body.style.overflow = "auto";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__lenis?.start();
      ctx.revert();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleFullClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-3xl cursor-zoom-out"
      />

      {/* ═══ PANEL — Full Screen to match Page structure ═══ */}
      <div
        ref={panelRef}
        className="relative w-full h-screen-stable md:h-screen bg-[#0a0a0b] flex flex-col transform-gpu"
        data-lenis-prevent
      >
        {/* Cinematic Grain Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-[80] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

        {/* ═══ HEADER — rendered here at z-[90+], OUTSIDE overflow-hidden scroll area ═══ */}
        {/* iOS 26 Progressive Blur Mask */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-32 md:h-36 z-[90] transform-gpu transition-opacity duration-1000"
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            opacity: isScrolled ? 0.95 : 0.85,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.05) 85%, transparent 100%)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            maskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
          }}
        />

        {/* Controls Row */}
        <DestinationNavbar onBack={handleBack} onX={handleFullClose} forceScrolled={isScrolled} />

        {/* ═══ SCROLLABLE CONTENT ═══ */}
        <div
          ref={scrollRef}
          onScroll={handleInternalScroll}
          className="flex-1 overflow-y-auto scrollbar-hide"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
