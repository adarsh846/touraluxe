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

    // Use quickTo for high-frequency events to recycle tween instances and eliminate GC pressure
    const xCursor = gsap.quickTo(cursor, "x", { duration: 0.1, ease: "power2.out", force3D: true });
    const yCursor = gsap.quickTo(cursor, "y", { duration: 0.1, ease: "power2.out", force3D: true });
    const xFollower = gsap.quickTo(follower, "x", { duration: 0.4, ease: "power3.out", force3D: true });
    const yFollower = gsap.quickTo(follower, "y", { duration: 0.4, ease: "power3.out", force3D: true });

    let isHovered = false;

    const handleHover = () => {
      if (isHovered) return;
      isHovered = true;
      gsap.to(follower, {
        scale: 1, // Full 80px sharp scale
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        mixBlendMode: "difference",
        duration: 0.3,
        force3D: true,
      });
    };

    const handleUnhover = () => {
      if (!isHovered) return;
      isHovered = false;
      gsap.to(follower, {
        scale: 0.4, // Down to 32px visually
        backgroundColor: "transparent",
        mixBlendMode: "normal",
        duration: 0.3,
        force3D: true,
      });
    };

    const moveCursor = (e: MouseEvent) => {
      xCursor(e.clientX);
      yCursor(e.clientY);
      xFollower(e.clientX);
      yFollower(e.clientY);

      const target = e.target as HTMLElement;
      if (target) {
        const interactive = target.closest("a, button, [role='button'], .interactive, input, select, textarea");
        if (interactive) {
          handleHover();
        } else {
          handleUnhover();
        }
      }
    };

    const handleMouseLeaveWindow = () => {
      handleUnhover();
    };

    const handleClick = () => {
      // If click triggers unmount of the hovered element, reset cursor scaling immediately
      setTimeout(() => {
        handleUnhover();
      }, 50);
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseleave", handleMouseLeaveWindow);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", handleMouseLeaveWindow);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <>
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[1000001] mix-blend-difference hidden md:block will-change-transform"
        style={{ transform: "translate(-50%, -50%)" }}
      />
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-20 h-20 border border-white/30 rounded-full pointer-events-none z-[1000000] hidden md:block will-change-transform"
        style={{ transform: "translate(-50%, -50%) scale(0.4)" }}
      />
    </>
  );
}
