"use client";

import { useEffect } from "react";

export function ClientFixes() {
  useEffect(() => {
    // ─── SCROLL TOP FIX ON REFRESH ───
    // Force the browser to always start at the top on refresh
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // Only suppress native cursor on non-touch (pointer: fine) devices.
    const isPointerDevice = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isPointerDevice) return;

    document.body.classList.add("cursor-none");

    // ─── AGGRESSIVE SAFARI CURSOR SUPPRESSION ───
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
