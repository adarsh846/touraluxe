"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 356;
const FRAME_PATH = "/sequence/frame-";

const frameUrls = Array.from(
  { length: TOTAL_FRAMES },
  (_, i) => `${FRAME_PATH}${String(i + 1).padStart(3, "0")}.jpg`
);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(-1);
  const rafRef = useRef<number>(0);
  const pendingFrameRef = useRef(0);

  const drawFrame = useCallback((index: number) => {
    if (index === currentFrameRef.current) return;
    pendingFrameRef.current = index;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const idx = pendingFrameRef.current;
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;

      const img = framesRef.current[idx];
      if (!img || !img.complete) {
        for (let i = idx; i >= 0; i--) {
          if (framesRef.current[i]?.complete) {
            coverFit(ctx, canvas, framesRef.current[i]);
            currentFrameRef.current = i;
            return;
          }
        }
        return;
      }
      coverFit(ctx, canvas, img);
      currentFrameRef.current = idx;
    });
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Use device pixel ratio for crystal clear Retina display rendering
    // Cap at 2 to prevent massive memory usage on 3x/4x screens
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Set actual internal canvas resolution
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    // Ensure CSS forces it to fill the screen
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Request maximum GPU acceleration
    ctxRef.current = canvas.getContext("2d", { 
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    
    // Force immediate redraw of current frame at new resolution
    currentFrameRef.current = -1;
    drawFrame(pendingFrameRef.current);
  }, [drawFrame]);

  // Load frames
  useEffect(() => {
    let loaded = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    const firstImg = new Image();
    firstImg.src = frameUrls[0];
    firstImg.onload = () => {
      images[0] = firstImg;
      framesRef.current = images;
      resizeCanvas();
      drawFrame(0);
    };

    frameUrls.forEach((url, i) => {
      if (i === 0) { images[0] = firstImg; return; }
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loaded++;
        images[i] = img;
        framesRef.current = images;
        setLoadProgress(Math.round(((loaded + 1) / TOTAL_FRAMES) * 100));
        if (loaded + 1 >= TOTAL_FRAMES) setIsLoaded(true);
      };
      img.onerror = () => {
        loaded++;
        if (loaded + 1 >= TOTAL_FRAMES) setIsLoaded(true);
      };
    });

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame, resizeCanvas]);

  // GSAP ScrollTrigger — Manual Pinning & Scrubbing
  useEffect(() => {
    if (!isLoaded) return;

    const ctx = gsap.context(() => {
      // 1. Frame scrub logic (Continuous flight from 0 to 100%)
      const obj = { frame: 0 };
      gsap.to(obj, {
        frame: TOTAL_FRAMES - 1,
        snap: "frame",
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
        onUpdate: () => drawFrame(Math.round(obj.frame)),
      });

      // 2. Manual Pinning (Simulated Sticky)
      gsap.to(pinRef.current, {
        y: () => (sectionRef.current?.offsetHeight || 0) - window.innerHeight,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      // 3. Staggered Text Reveal
      // Words fade in and unblur sequentially as the drone enters the wide valley
      gsap.fromTo(
        ".hero-title .word",
        { opacity: 0, y: 40, filter: "blur(8px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)",
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "56.3% top", // Exactly frame 200 (200 / 355 = ~56.3%)
            end: "75% top",
            scrub: true,
          },
        }
      );

      gsap.fromTo(
        ".hero-subhead",
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "58.3% top",
            end: "78% top",
            scrub: true,
          },
        }
      );

      // 5. Scroll indicator (Fades immediately)
      gsap.to(".scroll-indicator", {
        opacity: 0, y: -10, ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "3% top",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [isLoaded, drawFrame]);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full bg-black text-white"
      style={{ height: "600vh" }}
    >
      {/* 
        Inner container for pinning. 
        We pin this div instead of the section, so GSAP's pin-spacer 
        is safely isolated from the flexbox layout of page.tsx.
      */}
      <div ref={pinRef} className="absolute top-0 left-0 w-full h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" id="hero-canvas" />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
          }}
        />

        {/* Loading */}
        {!isLoaded && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-medium tracking-[0.3em] uppercase text-white/40">
                {loadProgress}%
              </span>
            </div>
          </div>
        )}

        {/* Content overlay */}
        <div className="hero-content absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <div className="hero-content-wrapper max-w-4xl mx-auto will-change-transform">
            <h1 className="hero-title text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tighter leading-[1] mb-6 text-white flex flex-col items-center justify-center gap-y-2">
              <div className="flex flex-wrap justify-center gap-x-[0.2em]">
                <span className="word inline-block opacity-0">We</span>
                <span className="word inline-block opacity-0">don&apos;t</span>
                <span className="word inline-block opacity-0">sell</span>
                <span className="word inline-block opacity-0">trips.</span>
              </div>
              <div className="flex flex-nowrap whitespace-nowrap justify-center gap-x-[0.2em]">
                <span className="word inline-block text-white/90 opacity-0">We</span>
                <span className="word inline-block text-white/90 opacity-0">craft</span>
                <span className="word inline-block text-white/90 opacity-0">experiences.</span>
              </div>
            </h1>
            <p className="hero-subhead text-xl md:text-2xl lg:text-3xl max-w-3xl mx-auto font-medium tracking-tight text-white/80 opacity-0">
              A new standard in luxury travel. Immersive, exclusive, and tailored entirely to your desires.
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator absolute bottom-16 md:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/40">
            Scroll
          </span>
          <svg
            className="w-4 h-4 text-white/40 animate-bounce"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>
      </div>
    </section>
  );
}

function coverFit(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: HTMLImageElement
) {
  const cw = canvas.width;
  const ch = canvas.height;
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  ctx.drawImage(img, (cw - sw) / 2, (ch - sh) / 2, sw, sh);
}
