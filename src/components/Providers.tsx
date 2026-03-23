"use client";

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // By forcing syncTouch, Lenis synchronizes the asynchronous touch drag threads natively onto the 
    // exact same requestAnimationFrame window rendering as GSAP. This eradicates the 1-frame disparity
    // causing parallax objects (chips, airplanes) to jitter on mobile glass while smoothly gliding on desktop trackpads!
    const lenis = new Lenis({
      syncTouch: true,
      touchMultiplier: 2, 
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
