"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

export function Magnetic({ children }: { children: React.ReactElement }) {
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const magnet = magnetRef.current;
    if (!magnet) return;

    const xTo = gsap.quickTo(magnet, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(magnet, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    // ── Mouse support ──────────────────────────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { top, left, width, height } = magnet.getBoundingClientRect();
      xTo((clientX - (left + width / 2)) * 0.35);
      yTo((clientY - (top  + height / 2)) * 0.35);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    // ── Touch support ──────────────────────────────────────────
    // touchstart: snap toward the first finger's landing point
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const { top, left, width, height } = magnet.getBoundingClientRect();
      xTo((touch.clientX - (left + width / 2)) * 0.35);
      yTo((touch.clientY - (top  + height / 2)) * 0.35);
    };

    // touchmove: follow the finger in real-time (elastic spring)
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const { top, left, width, height } = magnet.getBoundingClientRect();
      xTo((touch.clientX - (left + width / 2)) * 0.35);
      yTo((touch.clientY - (top  + height / 2)) * 0.35);
    };

    // touchend: spring back to origin
    const handleTouchEnd = () => {
      xTo(0);
      yTo(0);
    };

    magnet.addEventListener("mousemove",  handleMouseMove);
    magnet.addEventListener("mouseleave", handleMouseLeave);
    magnet.addEventListener("touchstart", handleTouchStart, { passive: true });
    magnet.addEventListener("touchmove",  handleTouchMove,  { passive: true });
    magnet.addEventListener("touchend",   handleTouchEnd);
    magnet.addEventListener("touchcancel",handleTouchEnd);

    return () => {
      magnet.removeEventListener("mousemove",  handleMouseMove);
      magnet.removeEventListener("mouseleave", handleMouseLeave);
      magnet.removeEventListener("touchstart", handleTouchStart);
      magnet.removeEventListener("touchmove",  handleTouchMove);
      magnet.removeEventListener("touchend",   handleTouchEnd);
      magnet.removeEventListener("touchcancel",handleTouchEnd);
    };
  }, []);

  return <div ref={magnetRef} className="w-fit">{children}</div>;
}
