"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export function Magnetic({ 
  children, 
  className, 
  intensity = 0.6 
}: { 
  children: React.ReactElement; 
  className?: string;
  intensity?: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
    
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;

    // ═══ TRACKING: smooth, no overshoot ═══
    const xTo = gsap.quickTo(inner, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(inner, "y", { duration: 0.5, ease: "power3.out" });

    const reset = () => {
      gsap.to(inner, {
        x: 0,
        y: 0,
        duration: 1,
        ease: "elastic.out(1.2, 0.3)",
        overwrite: true,
      });
    };

    let xToLive = xTo;
    let yToLive = yTo;

    const refreshQuickTo = () => {
      xToLive = gsap.quickTo(inner, "x", { duration: 0.5, ease: "power3.out" });
      yToLive = gsap.quickTo(inner, "y", { duration: 0.5, ease: "power3.out" });
    };

    let cachedRect: DOMRect | null = null;
    const updateRect = () => {
      cachedRect = wrapper.getBoundingClientRect();
    };

    const moveWithLive = (clientX: number, clientY: number) => {
      if (!cachedRect) updateRect();
      const rect = cachedRect!;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      xToLive((clientX - cx) * intensity);
      yToLive((clientY - cy) * intensity);
    };

    const onMouseMove = (e: MouseEvent) => moveWithLive(e.clientX, e.clientY);

    const onMouseEnter = () => {
      updateRect(); // Cache rect once per interaction
      gsap.killTweensOf(inner);
      refreshQuickTo();
      gsap.to(inner, { filter: "brightness(1.4)", duration: 0.3, ease: "power2.out", overwrite: "auto" });
    };

    const onMouseLeave = () => {
      reset();
      gsap.to(inner, { filter: "brightness(1)", duration: 0.6, ease: "power2.out", overwrite: "auto" });
    };

    // ═══ TOUCH: Liquid Interaction Logic ═══
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      gsap.to(inner, { scale: 0.95, filter: "brightness(1.5)", duration: 0.2, ease: "power2.out", overwrite: "auto" });
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      
      // Calibrated Liquid Move: Reduced multiplier to 0.1 to prevent 'stretching' feel
      // and added a threshold check to keep the button stable during vertical scroll.
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        gsap.to(inner, {
          x: dx * 0.1,
          y: dy * 0.1,
          scale: 0.98,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    const onTouchEnd = () => {
      gsap.to(inner, {
        x: 0, y: 0, scale: 1, filter: "brightness(1)",
        duration: 0.8, ease: "elastic.out(1.2, 0.4)", overwrite: "auto",
      });
    };

    // Listeners
    wrapper.addEventListener("mouseenter", onMouseEnter);
    wrapper.addEventListener("mousemove", onMouseMove);
    wrapper.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, { passive: true });

    if (isTouch) {
      wrapper.addEventListener("touchstart", onTouchStart, { passive: true });
      wrapper.addEventListener("touchmove", onTouchMove, { passive: true });
      wrapper.addEventListener("touchend", onTouchEnd, { passive: true });
      wrapper.addEventListener("touchcancel", onTouchEnd, { passive: true });
    }

    return () => {
      wrapper.removeEventListener("mouseenter", onMouseEnter);
      wrapper.removeEventListener("mousemove", onMouseMove);
      wrapper.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      wrapper.removeEventListener("touchstart", onTouchStart);
      wrapper.removeEventListener("touchmove", onTouchMove);
      wrapper.removeEventListener("touchend", onTouchEnd);
      wrapper.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <div 
      ref={wrapperRef} 
      className={cn("relative inline-block w-fit touch-manipulation", className)}
    >
      {/* 
          ═══ THE MAGNETIC MASK ═══
          This expanded hit-zone is now CSS-HIDDEN on mobile/touch devices.
          This eliminates the 'dead zones' where one chip's mask would 
          prevent you from tapping a neighboring chip.
      */}
      <div className="absolute inset-[-20px] z-[-1] pointer-events-none md:pointer-events-auto hidden md:block" />
      
      {/* Inner visual element that translates independently */}
      <div 
        ref={innerRef} 
        className={cn("relative z-10 will-change-transform inline-block w-fit", className)}
      >
        {children}
      </div>
    </div>
  );
}
