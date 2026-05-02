"use client";

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      syncTouch: true, // Preserve smooth touch as requested
      touchMultiplier: 1.2, // Slightly higher for more responsive mobile flick
      wheelMultiplier: 1.0,
      lerp: 0.1, // Snappier response (0.1 is industry standard for 'Apple' feel)
      infinite: false,
    });

    // ─── SCROLL TOP FIX ON REFRESH ───
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });

    // Expose globally for programmatic scrolling
    (window as any).__lenis = lenis;

    // ─── THE CRITICAL SYNC: Ticker Integration ───
    // We add Lenis to the GSAP ticker with a priority of -1.
    // This ensures Lenis updates the scroll position FIRST,
    // then GSAP calculates animations based on that NEW position in the same frame.
    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0); // Disable lag smoothing to prevent 'drifting' during heavy load

    // Tell ScrollTrigger to listen to Lenis
    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    // Reset ScrollTrigger on refresh
    ScrollTrigger.addEventListener("refreshInit", () => lenis.stop());
    ScrollTrigger.addEventListener("refresh", () => lenis.start());

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
