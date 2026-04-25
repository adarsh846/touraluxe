"use client";

import { useState, useEffect } from "react";
import { HeroSequence } from "./HeroSequence";
import { HeroStatic } from "./HeroStatic";

export function Hero() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Determine device type on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // During SSR and initial hydration, render a black placeholder 
  // to avoid React hydration mismatches between Server and Client
  if (isMobile === null) {
    return <section className="h-[100dvh] w-full bg-black" />;
  }

  // Render the lightweight static image parallax for mobile devices
  // Render the heavy 4K cinematic image sequence for desktop devices
  return isMobile ? <HeroStatic /> : <HeroSequence />;
}
