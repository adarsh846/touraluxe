"use client";

import { useEffect } from "react";

export function ClientFixes() {
  useEffect(() => {
    // ─── AGGRESSIVE SAFARI CURSOR SUPPRESSION ───
    // This is the definitive runtime fix for Safari's pointer engine.
    // By injecting this style at runtime, we ensure it has the highest possible 
    // priority in the engine and cannot be overridden by late-rendered Tailwind utilities or transitions.
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
