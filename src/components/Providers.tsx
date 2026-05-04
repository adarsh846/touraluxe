"use client";

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { BookingProvider } from "./BookingProvider";
import { ModalShell } from "./modals/ModalShell";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // ... (lenis setup)
    const lenis = new Lenis({
      syncTouch: true,
      touchMultiplier: 1.2,
      wheelMultiplier: 1.0,
      lerp: 0.1,
      infinite: false,
    });

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });

    (window as any).__lenis = lenis;

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    ScrollTrigger.addEventListener("refreshInit", () => lenis.stop());
    ScrollTrigger.addEventListener("refresh", () => lenis.start());

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return (
    <BookingProvider>
      {children}
      <ModalShell />
    </BookingProvider>
  );
}

