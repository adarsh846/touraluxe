"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export function Magnetic({ children, className }: { children: React.ReactElement; className?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;

    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // ═══ TRACKING: smooth, no overshoot ═══
    // power3.out → glides to target, never bounces/vibrates
    const xTo = gsap.quickTo(inner, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(inner, "y", { duration: 0.5, ease: "power3.out" });

    const move = (clientX: number, clientY: number) => {
      const rect = wrapper.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      xTo((clientX - cx) * 0.6);
      yTo((clientY - cy) * 0.6);
    };

    // ═══ RESET: elastic snap-back (only fires on leave) ═══
    // Uses gsap.to (not quickTo) so we get elastic ease
    // Gets auto-overwritten when quickTo fires on next mousemove
    const reset = () => {
      gsap.to(inner, {
        x: 0,
        y: 0,
        duration: 1,
        ease: "elastic.out(1.2, 0.3)",
        overwrite: true,
      });
    };

    // After elastic reset completes, re-create quickTo so they work again
    // (overwrite: true kills them, so we need fresh instances)
    let xToLive = xTo;
    let yToLive = yTo;

    const refreshQuickTo = () => {
      xToLive = gsap.quickTo(inner, "x", { duration: 0.5, ease: "power3.out" });
      yToLive = gsap.quickTo(inner, "y", { duration: 0.5, ease: "power3.out" });
    };

    const moveWithLive = (clientX: number, clientY: number) => {
      const rect = wrapper.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      xToLive((clientX - cx) * 0.6);
      yToLive((clientY - cy) * 0.6);
    };

    const onMouseMove = (e: MouseEvent) => moveWithLive(e.clientX, e.clientY);

    const onMouseEnter = () => {
      // Kill any running elastic reset and refresh quickTo instances
      gsap.killTweensOf(inner);
      refreshQuickTo();
    };

    const onMouseLeave = () => reset();

    // ═══ TOUCH: iOS 26-style stretch ═══
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      gsap.to(inner, { scale: 0.92, duration: 0.2, ease: "power2.out", overwrite: "auto" });
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      gsap.to(inner, {
        x: dx * 0.4,
        y: dy * 0.4,
        skewX: gsap.utils.clamp(-8, 8, dx * 0.03),
        skewY: gsap.utils.clamp(-8, 8, -dy * 0.03),
        rotation: gsap.utils.clamp(-5, 5, dx * 0.02),
        scale: 0.92,
        duration: 0.15,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onTouchEnd = () => {
      gsap.to(inner, {
        x: 0, y: 0, scale: 1, skewX: 0, skewY: 0, rotation: 0,
        duration: 1, ease: "elastic.out(1.2, 0.25)", overwrite: "auto",
      });
    };

    wrapper.addEventListener("mouseenter", onMouseEnter);
    wrapper.addEventListener("mousemove", onMouseMove);
    wrapper.addEventListener("mouseleave", onMouseLeave);

    if (isTouch) {
      wrapper.addEventListener("touchstart", onTouchStart, { passive: true });
      wrapper.addEventListener("touchmove", onTouchMove, { passive: true });
      wrapper.addEventListener("touchend", onTouchEnd);
      wrapper.addEventListener("touchcancel", onTouchEnd);
    }

    return () => {
      wrapper.removeEventListener("mouseenter", onMouseEnter);
      wrapper.removeEventListener("mousemove", onMouseMove);
      wrapper.removeEventListener("mouseleave", onMouseLeave);
      wrapper.removeEventListener("touchstart", onTouchStart);
      wrapper.removeEventListener("touchmove", onTouchMove);
      wrapper.removeEventListener("touchend", onTouchEnd);
      wrapper.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <div ref={wrapperRef} className={cn("relative inline-block w-fit", className)}>
      {/* Invisible expanded hit-zone (absolute means it doesn't break layout heights/widths!) */}
      <div className="absolute inset-[-20px] z-[-1] pointer-events-auto" />
      {/* Inner visual element that translates independently */}
      <div ref={innerRef} className={cn("relative z-10 will-change-transform inline-block w-fit", className)}>
        {children}
      </div>
    </div>
  );
}
