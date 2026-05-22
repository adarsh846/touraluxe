"use client";

import { useEffect } from "react";
import gsap from "gsap";

export function GsapConfig() {
  useEffect(() => {
    // ─── ENTERPRISE GPU MEMORY MANAGEMENT ───
    // "auto" promotes elements to GPU layers ONLY during active animation,
    // then releases them immediately after. This prevents VRAM exhaustion
    // on mobile devices during fast scrolling — the same strategy used by
    // Apple.com and Google's Material Design components.
    gsap.config({ 
      force3D: "auto",
    });

    // We also forcefully set `ticker.lagSmoothing` so it doesn't arbitrarily downclock the engine
    gsap.ticker.lagSmoothing(1000, 16);
  }, []);

  return null;
}
