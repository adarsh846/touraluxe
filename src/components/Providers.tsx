"use client";

import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { usePathname } from "next/navigation";
import { BookingProvider } from "./BookingProvider";
import { AuthProvider } from "./AuthProvider";
import { ModalShell } from "./modals/ModalShell";
import { WhatsAppButton } from "./WhatsAppButton";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (isAdmin) return;

    // ... (lenis setup)
    const lenis = new Lenis({
      syncTouch: false, // Let mobile devices handle touch scrolling natively to prevent diagonal hijacking on horizontal carousels
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
    <AuthProvider>
      <BookingProvider>
        {children}
        <ModalShell />
        {!isAdmin && whatsappNumber && <WhatsAppButton phoneNumber={whatsappNumber} />}
      </BookingProvider>
    </AuthProvider>
  );
}
