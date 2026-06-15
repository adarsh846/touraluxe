"use client";
import { useEffect } from "react";
import { prefetchManifests } from "@/lib/manifestCache";

export function PwaRegister() {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }

    // Idle-time prefetch: warm the package & destination manifests
    // so the Search/Booking modal opens into a fully-populated cache.
    prefetchManifests();
  }, []);

  return null;
}
