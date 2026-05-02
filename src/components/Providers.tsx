"use client";

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      syncTouch: false, // Fixes "dead zones" on mobile where buttons don't react to taps
      touchMultiplier: 1.0,
      lerp: 0.1,
    });

    // ─── SCROLL TOP FIX ON REFRESH ───
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });

    // Expose globally for programmatic scrolling from other components
    (window as any).__lenis = lenis;

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(onTick);

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
