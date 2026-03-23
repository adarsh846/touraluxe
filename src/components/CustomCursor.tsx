"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    // Set initial High-Res down-scale (tracking starts at 32px visually but rasterized at 80px)
    gsap.set(follower, { scale: 0.4 });

    const moveCursor = (e: MouseEvent) => {
      // Main cursor (tight)
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: "power2.out",
        force3D: true,
      });

      // Follower (lagging for smoothness, High-Res rendering)
      gsap.to(follower, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.4,
        ease: "power3.out",
        force3D: true,
      });
    };

    const handleHover = () => {
      gsap.to(follower, {
        scale: 1, // Full 80px sharp scale
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        mixBlendMode: "difference",
        duration: 0.3,
        force3D: true,
      });
    };

    const handleUnhover = () => {
      gsap.to(follower, {
        scale: 0.4, // Down to 32px visually
        backgroundColor: "transparent",
        mixBlendMode: "normal",
        duration: 0.3,
        force3D: true,
      });
    };

    window.addEventListener("mousemove", moveCursor);

    const interactiveElements = document.querySelectorAll("a, button, .interactive");
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleHover);
      el.addEventListener("mouseleave", handleUnhover);
    });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleHover);
        el.removeEventListener("mouseleave", handleUnhover);
      });
    };
  }, []);

  return (
    <>
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block will-change-transform"
        style={{ transform: "translate(-50%, -50%)" }}
      />
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-20 h-20 border border-white/30 rounded-full pointer-events-none z-[9998] hidden md:block will-change-transform"
        style={{ transform: "translate(-50%, -50%) scale(0.4)" }}
      />
    </>
  );
}
