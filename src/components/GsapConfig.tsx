"use client";

import { useEffect } from "react";
import gsap from "gsap";

export function GsapConfig() {
  useEffect(() => {
    // ─── AGGRESSIVE MOBILE GPU ACCELERATION ───
    // This forcibly upgrades ALL mathematical 'transform' and 'opacity' values configured inside GSAP 
    // throughout the entire TouraLuxe platform to utilize translate3d() under the hood natively.
    // This specifically pushes the layout composition directly onto mobile device GPUs (Metal/WebKit)
    // rather than running repaint cycles on the slower CPU cores!
    gsap.config({ 
      force3D: true, // Forces matrix3d/translate3d instead of standard 2D transforms natively on all properties
    });

    // We also forcefully set `ticker.lagSmoothing` so it doesn't arbitrarily downclock the engine
    gsap.ticker.lagSmoothing(1000, 16);
  }, []);

  return null;
}
