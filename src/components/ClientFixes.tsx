"use client";

import { useEffect } from "react";

export function ClientFixes() {
  useEffect(() => {
    // Only suppress native cursor on non-touch (pointer: fine) devices.
    // On touchscreens, the native cursor is needed and must remain visible.
    const isPointerDevice = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isPointerDevice) return;

    // Apply cursor-none Tailwind class to body only on pointer/mouse devices
    document.body.classList.add("cursor-none");

    // ─── AGGRESSIVE SAFARI CURSOR SUPPRESSION ───
    // This is the definitive runtime fix for Safari's pointer engine.
    const style = document.createElement("style");
    const blank = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    
    style.innerHTML = `
      * , *:hover, *:active, *:focus, *:focus-within, 
      a, button, [role="button"], input, select, textarea, label {
        cursor: url('${blank}'), none !important;
        -webkit-cursor: none !important;
      }
      html, body {
        cursor: url('${blank}'), none !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}
