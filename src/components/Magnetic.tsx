"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

export function Magnetic({ children }: { children: React.ReactElement }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;

    // Maximum elasticity — big overshoot, multiple bounces, dramatic pull
    const xTo = gsap.quickTo(inner, "x", { duration: 1.2, ease: "elastic.out(1.2, 0.2)" });
    const yTo = gsap.quickTo(inner, "y", { duration: 1.2, ease: "elastic.out(1.2, 0.2)" });

    const move = (clientX: number, clientY: number) => {
      const rect = wrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Strong pull — 0.6 multiplier
      xTo((clientX - centerX) * 0.6);
      yTo((clientY - centerY) * 0.6);
    };

    const reset = () => {
      xTo(0);
      yTo(0);
    };

    // ── Mouse ──
    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);

    // ── Touch ──
    const onTouchStart = (e: TouchEvent) => move(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => move(e.touches[0].clientX, e.touches[0].clientY);

    wrapper.addEventListener("mousemove", onMouseMove);
    wrapper.addEventListener("mouseleave", reset);
    wrapper.addEventListener("touchstart", onTouchStart, { passive: true });
    wrapper.addEventListener("touchmove", onTouchMove, { passive: true });
    wrapper.addEventListener("touchend", reset);
    wrapper.addEventListener("touchcancel", reset);

    return () => {
      wrapper.removeEventListener("mousemove", onMouseMove);
      wrapper.removeEventListener("mouseleave", reset);
      wrapper.removeEventListener("touchstart", onTouchStart);
      wrapper.removeEventListener("touchmove", onTouchMove);
      wrapper.removeEventListener("touchend", reset);
      wrapper.removeEventListener("touchcancel", reset);
    };
  }, []);

  return (
    // 16px invisible padding = larger catch zone for stronger pull
    <div ref={wrapperRef} className="relative w-fit" style={{ padding: "16px", margin: "-16px" }}>
      <div ref={innerRef} className="will-change-transform">
        {children}
      </div>
    </div>
  );
}
