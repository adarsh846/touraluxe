"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 356;

// Isomorphic layout effect to prevent Next.js SSR warnings
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
            ctx.drawImage(framesRef.current[i], 0, 0, canvas.width, canvas.height);
            currentFrameRef.current = i;
            return;
          }
        }
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      currentFrameRef.current = idx;
    });
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Dynamically match internal canvas resolution to the loaded image resolution
    // This prevents the "black screen" on mobile where a smaller image occupies only a quadrant
    const firstImg = framesRef.current[0];
    if (firstImg && firstImg.width > 0) {
      canvas.width = firstImg.width;
      canvas.height = firstImg.height;
    } else {
      const isMobile = window.innerWidth < 768;
      canvas.width = isMobile ? 1920 : 3840;
      canvas.height = isMobile ? 1080 : 2160;
    }
    
    // 5. Wide Color Gamut (Display-P3) Rendering
    const ctx = canvas.getContext("2d", { 
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
      colorSpace: "display-p3"
    } as any) as CanvasRenderingContext2D;
    
    // Enable highest quality GPU downscaling/upscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    
    ctxRef.current = ctx;
    
    // Force immediate redraw
    currentFrameRef.current = -1;
    drawFrame(pendingFrameRef.current);
  }, [drawFrame]);

  // Load frames incrementally with IntersectionObserver & Dynamic Resolution
  useEffect(() => {
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    framesRef.current = images;
    
    let loadedCount = 0;
    let currentIndex = 0;
    let isPaused = false;
    let isActive = true;
    
    // 1. Dynamic Resolution Switching
    const isMobile = window.innerWidth < 768;
    const basePath = isMobile ? "/sequence-mobile/frame-" : "/sequence/frame-";
    const dynamicUrls = Array.from(
      { length: TOTAL_FRAMES },
      (_, i) => `${basePath}${String(i + 1).padStart(3, "0")}.jpg`
    );
    
    // 2. Sparse Loading Algorithm (Apple-tier streaming)
    // Instead of loading sequentially (1,2,3), we load sparsely (0, 355, 40, 80...).
    // This allows the entire scroll sequence to be scrubbable almost instantly (at lower FPS),
    // and naturally resolves to perfect 60fps as the remaining frames stream in.
    const getLoadOrder = (total: number) => {
      const order: number[] = [];
      const added = new Set<number>();
      const add = (i: number) => {
        if (!added.has(i) && i < total) {
          order.push(i);
          added.add(i);
        }
      };

      add(0);
      add(total - 1);
      
      const steps = [40, 20, 10, 5, 2, 1];
      for (const step of steps) {
        for (let i = 0; i < total; i += step) {
          add(i);
        }
      }
      return order;
    };

    const loadOrder = getLoadOrder(TOTAL_FRAMES);

    const loadNext = () => {
      if (!isActive || currentIndex >= TOTAL_FRAMES || isPaused) return;
      
      const targetIdx = loadOrder[currentIndex++];
      
      // 3. Blob Pre-caching (Apple-tier Network Bypass)
      // We fetch raw bytes via HTTP/2 and convert to local memory blobs. 
      // This completely bypasses the DOM's strict 6-connection image limit.
      fetch(dynamicUrls[targetIdx], { priority: "low" } as any)
        .then(res => res.blob())
        .then(blob => {
          if (!isActive) return;
          
          const objectUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.src = objectUrl;
          
          img.onload = () => {
            if (!isActive) {
              URL.revokeObjectURL(objectUrl);
              return;
            }
            images[targetIdx] = img;
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
            
            if (targetIdx === 0) {
              initCanvas();
              drawFrame(0);
              setIsLoaded(true);
            } else {
              if (targetIdx === pendingFrameRef.current || Math.abs(targetIdx - pendingFrameRef.current) < 5) {
                 drawFrame(pendingFrameRef.current);
              }
            }
            loadNext();
          };
          
          img.onerror = () => {
            if (!isActive) return;
            URL.revokeObjectURL(objectUrl);
            loadedCount++;
            loadNext();
          };
        })
        .catch(() => {
          if (!isActive) return;
          loadedCount++;
          loadNext();
        });
    };

    // Use a small pool of concurrent loaders to avoid network saturation
    const CONCURRENT_LOADERS = 4;
    
    const spawnWorkers = () => {
      isPaused = false;
      for (let i = 0; i < CONCURRENT_LOADERS; i++) {
        loadNext();
      }
    };

    // 2. Intersection-Aware Network Pausing
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (isPaused || currentIndex === 0) {
            spawnWorkers();
          }
        } else {
          isPaused = true;
        }
      },
      { rootMargin: "200px" } // Keep loading slightly off-screen
    );
    
    if (sectionRef.current) observer.observe(sectionRef.current);

    let lastWidth = window.innerWidth;
    const handleResize = () => {
      // Only trigger a full canvas rebuild if the width changes (orientation change).
      // This prevents massive stuttering on mobile when the URL bar hides/shows during scroll.
      if (Math.abs(window.innerWidth - lastWidth) > 10) {
        lastWidth = window.innerWidth;
        initCanvas();
      }
    };

    window.addEventListener("resize", handleResize);
    initCanvas();
    
    return () => {
      isActive = false;
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      
      // 4. Aggressive Memory Garbage Collection
      framesRef.current.forEach(img => {
        if (img) {
          try { URL.revokeObjectURL(img.src); } catch(e){}
          img.src = "";
        }
      });
      framesRef.current = [];
    };
  }, [drawFrame, initCanvas]);

  // GSAP ScrollTrigger — Manual Pinning & Scrubbing
  useIsomorphicLayoutEffect(() => {
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

      // 6. Reactive Vignette Lighting
      gsap.to(".hero-vignette", {
        opacity: 0,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "56.3% top", // Frame 200
          scrub: true,
        },
      });

      // Scroll indicator (Fades immediately)
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
      <div ref={pinRef} className="absolute top-0 left-0 w-full h-[100dvh] overflow-hidden bg-black">
        {/* Hardware-Accelerated Canvas with Cinematic Color Grading */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover" 
          id="hero-canvas" 
          style={{
            // Cinematic punch: slightly brighter, higher contrast, deeper colors
            filter: "brightness(1.05) contrast(1.1) saturate(1.1)"
          }}
        />

        {/* 6. Reactive Vignette Lighting (Deepened for focus) */}
        <div
          className="hero-vignette absolute inset-0 pointer-events-none will-change-opacity"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)",
            transform: "translateZ(0)"
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
            <h1 className="hero-title text-[9.5vw] sm:text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tighter leading-[1.1] sm:leading-[1] mb-4 sm:mb-6 text-white flex flex-col items-center justify-center gap-y-1 sm:gap-y-2">
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
            <p className="hero-subhead text-[4vw] sm:text-xl md:text-2xl lg:text-3xl max-w-[90%] sm:max-w-3xl mx-auto font-medium tracking-tight text-white/80 opacity-0">
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
