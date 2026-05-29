"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import gsap from "gsap";
import { DestinationNavbar } from "@/components/DestinationNavbar";

export function DestinationModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
    tl.to(panelRef.current, { y: "100%", duration: 0.5, ease: "power3.in", force3D: true })
      .to(overlayRef.current, { opacity: 0, duration: 0.4, ease: "power2.in", force3D: true }, "-=0.3");
  }, [isExiting, router]);

  const handleFullClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);

    const tl = gsap.timeline({ onComplete: () => { router.push("/", { scroll: false }); } });
    tl.to(panelRef.current, { y: "100%", duration: 0.5, ease: "power3.in", force3D: true })
      .to(overlayRef.current, { opacity: 0, duration: 0.4, ease: "power2.in", force3D: true }, "-=0.3");
  }, [isExiting, router]);

  useEffect(() => {
    if (!pathname.startsWith("/destinations")) return;

    document.body.style.overflow = "hidden";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__lenis?.stop();

    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power3.out", force3D: true }
      );
      gsap.fromTo(panelRef.current,
        { y: "100%" },
        { y: "0%", duration: 1, ease: "power4.out", delay: 0.1, force3D: true }
      );
    });

    return () => {
      document.body.style.overflow = "auto";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__lenis?.start();
      ctx.revert();
    };
  }, [pathname]);

  if (!pathname.startsWith("/destinations")) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-end overflow-hidden ${isExiting ? "pointer-events-none" : ""}`}>
      {/* Backdrop — flat overlay is vastly faster to render than full-viewport blur during GSAP slide-up */}
      <div
        ref={overlayRef}
        onClick={handleFullClose}
        className="absolute inset-0 bg-[#0a0a0b]/95 cursor-zoom-out will-change-[opacity]"
      />

      {/* ═══ PANEL — Full Screen to match Page structure ═══ */}
      <div
        ref={panelRef}
        className="relative w-full h-screen-stable md:h-screen bg-[#0a0a0b] flex flex-col transform-gpu will-change-[transform]"
        data-lenis-prevent
      >
        {/* ═══ HEADER — rendered here at z-[90+], OUTSIDE overflow-hidden scroll area ═══ */}
        {/* Optimized GPU Header Fade Mask — avoiding layout-bottleneck backdrop filters */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-32 md:h-36 z-[90] transform-gpu transition-opacity duration-1000"
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            opacity: isScrolled ? 0.98 : 0.85,
            background: "linear-gradient(to bottom, rgba(10,10,11,0.98) 0%, rgba(10,10,11,0.88) 20%, rgba(10,10,11,0.6) 45%, rgba(10,10,11,0.3) 70%, transparent 100%)",
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
