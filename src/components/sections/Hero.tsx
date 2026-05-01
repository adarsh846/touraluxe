"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeroMobile } from "./HeroMobile";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════════
 * CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════ */
const FRAME_COUNT = 511;
// We revert to the original, pristine JPEGs for maximum quality!
const DESKTOP_SEQ = "/assets/cave-sequence-60";

// Progressive loading pass intervals
const SKELETON_STEP = 8;

// LRU memory caps — prevents OOM on constrained devices
const DESKTOP_CACHE_CAP = 180;

const SKELETON_SET = new Set<number>();
for (let i = 0; i < FRAME_COUNT; i += SKELETON_STEP) SKELETON_SET.add(i);
SKELETON_SET.add(0);
SKELETON_SET.add(FRAME_COUNT - 1);

function framePath(base: string, n: number) {
  return `${base}/frame_${String(n).padStart(4, "0")}.jpg`;
}

/* ═══════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════ */
export function HeroDesktop() {
  const containerRef = useRef<HTMLElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const media = mediaRef.current;
    const canvas = canvasRef.current;
    const ctx2d = canvas?.getContext("2d", { alpha: false, desynchronized: true });
    if (!container || !media || !canvas || !ctx2d) return;

    /* ── Device & capability detection ── */
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seqPath = DESKTOP_SEQ;
    
    // Original dimensions to preserve exact aspect ratio and framing
    const srcW = 1920;
    const srcH = 1080;
    const CACHE_CAP = DESKTOP_CACHE_CAP;
    const useImageBitmap = typeof createImageBitmap === "function";

    /* ── Network-aware concurrency ── */
    const getMaxConcurrent = (): number => {
      const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (conn?.saveData) return 2;
      const ect = conn?.effectiveType;
      if (ect === "slow-2g" || ect === "2g") return 2;
      if (ect === "3g") return 4;
      return 10;
    };

    /* ── Mutable state ── */
    let destroyed = false;
    let targetFrame = 0;
    let smoothFrame = 0;
    let rafId = 0;
    let rafRunning = false;
    let drawnFrame = -1;
    let isPaused = false;
    let refreshTimer: number | null = null;
    const abortCtrl = new AbortController();

    const loaded = new Set<number>();
    const loading = new Set<number>();
    const cache = new Map<number, ImageBitmap | HTMLImageElement>();
    const lruOrder: number[] = [];
    const frameAbortControllers = new Map<number, AbortController>();
    let activeLoads = 0;
    let maxConcurrent = getMaxConcurrent();

    /* ── Network change listener ── */
    const connApi = (navigator as unknown as { connection?: EventTarget }).connection;
    const onConnectionChange = () => { maxConcurrent = getMaxConcurrent(); };
    connApi?.addEventListener?.("change", onConnectionChange);

    const onVisibility = () => {
      isPaused = document.hidden;
      if (!isPaused) pumpBoot();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* ── Apple-Level Preload Injection ── */
    // Inject link tags into head to force browser network priority for the first few critical frames
    const preloadFrames = [0, SKELETON_STEP, SKELETON_STEP * 2];
    preloadFrames.forEach((n) => {
      const url = framePath(seqPath, n);
      if (!document.querySelector(`link[href="${url}"]`)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = url;
        document.head.appendChild(link);
      }
    });

    /* ── LRU CACHE ── */
    const touchLRU = (n: number) => {
      const idx = lruOrder.indexOf(n);
      if (idx !== -1) lruOrder.splice(idx, 1);
      lruOrder.push(n);
    };

    const evictIfNeeded = () => {
      let attempts = 0;
      while (lruOrder.length > CACHE_CAP && attempts < lruOrder.length) {
        const candidate = lruOrder[0];
        attempts++;

        if (SKELETON_SET.has(candidate)) {
          lruOrder.push(lruOrder.shift()!);
          continue;
        }

        if (Math.abs(candidate - Math.round(smoothFrame)) < 30) {
          lruOrder.push(lruOrder.shift()!);
          continue;
        }

        lruOrder.shift();
        const entry = cache.get(candidate);
        if (entry && "close" in entry) (entry as ImageBitmap).close();
        cache.delete(candidate);
        loaded.delete(candidate);
      }
    };

    /* ── CANVAS RENDER ENGINE (GPU-COMPOSITED) ── */
    const sizeCanvas = () => {
      // Render at source resolution (1:1). The GPU compositor handles display
      // scaling via CSS `object-cover` on the canvas element — zero CPU cost.
      // Retina upscaling in canvas is a trap: 4x pixels + scaled drawImage = 100% CPU.
      if (canvas.width !== srcW || canvas.height !== srcH) {
        canvas.width = srcW;
        canvas.height = srcH;
        drawnFrame = -1;
      }
      ctx2d.imageSmoothingEnabled = false;
    };

    const drawCover = (img: ImageBitmap | HTMLImageElement) => {
      // Blazing fast 1:1 blit — no scaling, no math, one GPU-friendly memcpy.
      ctx2d.drawImage(img as CanvasImageSource, 0, 0);
    };

    const nearestLoaded = (f: number): number => {
      if (loaded.has(f)) return f;
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (f - d >= 0 && loaded.has(f - d)) return f - d;
        if (f + d < FRAME_COUNT && loaded.has(f + d)) return f + d;
      }
      return -1;
    };

    const localDensity = (center: number, radius: number): number => {
      let count = 0;
      const lo = Math.max(0, center - radius);
      const hi = Math.min(FRAME_COUNT - 1, center + radius);
      for (let i = lo; i <= hi; i++) {
        if (loaded.has(i)) count++;
      }
      return count / (hi - lo + 1);
    };

    const drawFrame = (f: number) => {
      const actual = nearestLoaded(f);
      if (actual === -1 || actual === drawnFrame) return;
      const img = cache.get(actual);
      if (!img) return;
      drawCover(img);
      drawnFrame = actual;
      touchLRU(actual);
    };

    /* ── FRAME LOADING ── */
    const loadFrame = (n: number): Promise<void> => {
      if (loaded.has(n) || loading.has(n) || n < 0 || n >= FRAME_COUNT) {
        return Promise.resolve();
      }
      loading.add(n);
      activeLoads++;

      const url = framePath(seqPath, n);
      const frameAbort = new AbortController();
      frameAbortControllers.set(n, frameAbort);
      
      const onGlobalAbort = () => frameAbort.abort();
      abortCtrl.signal.addEventListener("abort", onGlobalAbort);

      const onDone = (entry: ImageBitmap | HTMLImageElement) => {
        if (destroyed) {
          if ("close" in entry) (entry as ImageBitmap).close();
          return;
        }
        cache.set(n, entry);
        loaded.add(n);
        touchLRU(n);
        evictIfNeeded();
        drawFrame(Math.round(smoothFrame));

        // Report progress for skeleton frames to the preloader
        if (SKELETON_SET.has(n)) {
          const loadedSkeletonCount = Array.from(SKELETON_SET).filter(f => loaded.has(f)).length;
          const progress = Math.round((loadedSkeletonCount / SKELETON_SET.size) * 100);
          (window as any).__heroProgress = progress;
          window.dispatchEvent(new CustomEvent("hero-progress", { detail: progress }));
        }
      };

      const cleanup = () => {
        loading.delete(n);
        frameAbortControllers.delete(n);
        abortCtrl.signal.removeEventListener("abort", onGlobalAbort);
        activeLoads--;
      };

      if (useImageBitmap) {
        return fetch(url, { signal: frameAbort.signal })
          .then((r) => {
            if (!r.ok) throw new Error("Network error");
            return r.blob();
          })
          .then((blob) => createImageBitmap(blob))
          .then(onDone)
          .catch(() => undefined)
          .then(cleanup);
      }

      const img = new Image();
      img.decoding = "async";
      const onImageAbort = () => { img.src = ""; };
      frameAbort.signal.addEventListener("abort", onImageAbort);
      img.src = url;
      return img
        .decode()
        .then(() => onDone(img))
        .catch(() => undefined)
        .finally(() => {
          frameAbort.signal.removeEventListener("abort", onImageAbort);
          cleanup();
        });
    };

    let bootFrames: number[] = [];
    let bootCursor = 0;

    const pumpBoot = () => {
      if (destroyed || isPaused) return;
      while (activeLoads < maxConcurrent && bootCursor < bootFrames.length) {
        const n = bootFrames[bootCursor++];
        if (loaded.has(n) || loading.has(n)) continue;
        loadFrame(n).then(pumpBoot);
      }
    };

    // The core of the 60fps sliding window! 
    // SKELETON-FIRST strategy: loads every 8th frame across the entire sequence
    // before filling in local gaps. This ensures global coverage within ~300ms,
    // so fast scrolling on first load always has a frame within 4 positions.
    const prioritizeQueue = () => {
      const center = Math.round(targetFrame);
      const radius = 60;
      
      // Abort inflight requests that are too far away to free up connections instantly
      for (const [loadingFrame, controller] of frameAbortControllers.entries()) {
        if (Math.abs(loadingFrame - center) > radius + 20 && !SKELETON_SET.has(loadingFrame)) {
          controller.abort();
        }
      }

      const newQueue: number[] = [];
      const queued = new Set<number>();
      
      // PHASE 1: Skeleton frames first — global coverage sorted by distance from center.
      // 64 frames total. On a fast connection (10 concurrent), fully loaded in ~7 batches.
      // After this phase, every scroll position has a visible frame within 4 positions.
      const skeletonPending: number[] = [];
      for (let i = 0; i < FRAME_COUNT; i += SKELETON_STEP) {
        if (!loaded.has(i) && !loading.has(i)) skeletonPending.push(i);
      }
      skeletonPending.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
      for (const f of skeletonPending) { newQueue.push(f); queued.add(f); }
      
      // PHASE 2: Local gap-fill — dense coverage around the current scroll position.
      // Only runs after skeleton frames are queued, filling in the gaps for smooth playback.
      const start = Math.max(0, center - 15);
      const end = Math.min(FRAME_COUNT - 1, center + radius);
      const localPending: number[] = [];
      for (let i = start; i <= end; i++) {
        if (!loaded.has(i) && !loading.has(i) && !queued.has(i)) localPending.push(i);
      }
      localPending.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
      newQueue.push(...localPending);

      bootFrames = newQueue;
      bootCursor = 0;
      pumpBoot();
    };

    /* ── RENDER LOOP ── */
    // Decouples canvas drawing from scroll events to lock to monitor refresh rate (60fps)
    const startRAF = () => {
      if (rafRunning || destroyed) return;
      rafRunning = true;
      rafId = requestAnimationFrame(renderLoop);
    };

    const renderLoop = () => {
      if (destroyed) { rafRunning = false; return; }

      const dist = targetFrame - smoothFrame;
      // Calculate how many frames around our current position are actually loaded.
      // If density is low (frames missing), lerp drops heavily so the animation "waits" instead of skipping frames.
      const density = localDensity(Math.round(smoothFrame), 15);
      const lerp = 0.18 + density * 0.17;
      
      smoothFrame += Math.abs(dist) < 0.3 ? dist : dist * lerp;

      drawFrame(Math.round(smoothFrame));
      
      // Continuously update the preloader window to follow the scroll
      prioritizeQueue();

      if (Math.abs(dist) < 0.01) {
        rafRunning = false;
        return;
      }
      rafId = requestAnimationFrame(renderLoop);
    };

    const refreshScroll = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 80);
    };

    /* ── SYNCHRONOUS BOOT ── */
    sizeCanvas();
    startRAF();
    // Initial fetch trigger
    prioritizeQueue();

    window.addEventListener("resize", sizeCanvas);
    refreshScroll();

    /* ── GSAP Animations ── */
    const gsapCtx = gsap.context(() => {
      // 1. Initial media fade in (1.5s is snappy — frame 0 is typically decoded within 200ms)
      gsap.fromTo(media, { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.5, ease: "expo.out" });

      // 2. Scroll indicator logic + breathing chevron pulse
      // Separated into entrance wrapper and scroll inner to prevent GSAP overwrite conflicts
      gsap.fromTo(".scroll-entrance", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.5, ease: "expo.out", delay: 1 });
      gsap.to(".scroll-chevron", { y: 4, repeat: -1, yoyo: true, duration: 1.2, ease: "sine.inOut" });
      gsap.to(".scroll-indicator", {
        opacity: 0, y: -10, ease: "none",
        scrollTrigger: { trigger: containerRef.current, start: "top top", end: "120px top", scrub: true }
      });

      // 3. Cinematic Text Reveal Master Timeline
      // Uses compositor-only properties (opacity, transform).
      gsap.set(textContentRef.current, { opacity: 0, scale: 0.85, y: 40 });
      
      const textTl = gsap.timeline();
      
      // Empty tween to pad timeline to the final section (Start reveal at frame 291 - last 220 frames)
      textTl.to({}, { duration: 291 }, 0);
      
      // 1. Reveal wrapper — pure compositor path (opacity + scale + y)
      textTl.to(textContentRef.current, {
        opacity: 1, scale: 1, y: 0, ease: "power2.out", duration: 220
      }, 291);

      // 2. 3D Staggered word reveal
      textTl.fromTo(".word", 
        { y: 80, opacity: 0, rotateX: -50, scale: 0.9 },
        { y: 0, opacity: 1, rotateX: 0, scale: 1, stagger: 5, ease: "power3.out", duration: 150 },
        305
      );
      
      // 3. Subhead fade in — compositor-only (no blur)
      textTl.fromTo(subheadRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, ease: "power2.out", duration: 100 },
        380
      );

      // 4. MAIN SCROLL SCRUB TRIGGER (Binds Canvas Frame Update + Text Reveal)
      // Premium Apple-style weight: ~7.5px per frame makes the scrub feel deliberate and cinematic.
      const scrollDist = Math.round(Math.max(window.innerHeight * 4, FRAME_COUNT * 7.5));
      
      if (!reduceMotion) {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: `+=${scrollDist}`,
          pin: true,
          pinSpacing: true,
          refreshPriority: 1, // Ensures this top-level pin is calculated before downstream sections
          animation: textTl, // Unifies the text animation with the main pin! No jitter.
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            targetFrame = Math.round(self.progress * (FRAME_COUNT - 1));
            startRAF();
          },
        });
      } else {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: `+=${window.innerHeight * 2}`,
          pin: true,
          pinSpacing: true,
        });
      }
    }, containerRef);

    /* ── CLEANUP ── */
    return () => {
      gsapCtx.revert(); // Revert FIRST to restore original DOM before React tries to remove it
      destroyed = true;
      abortCtrl.abort();
      if (refreshTimer) window.clearTimeout(refreshTimer);
      window.removeEventListener("resize", sizeCanvas);
      document.removeEventListener("visibilitychange", onVisibility);
      connApi?.removeEventListener?.("change", onConnectionChange);
      cancelAnimationFrame(rafId);
      for (const entry of cache.values()) {
        if ("close" in entry) (entry as ImageBitmap).close();
      }
      cache.clear();
      loaded.clear();
      lruOrder.length = 0;
    };
  }, []);

  return (
    <div className="w-full h-full">
      <section ref={containerRef} className="relative z-10 h-screen w-full flex items-center justify-center overflow-hidden bg-black text-white">
        <div ref={mediaRef} className="absolute inset-0 w-full h-full will-change-transform transform-gpu z-0 opacity-0 bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/cave-poster.webp"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover z-0 saturate-[1.30] contrast-[1.08]"
          />
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 h-full w-full object-cover will-change-transform transform-gpu z-[1] saturate-[1.30] contrast-[1.08]" 
            aria-hidden="true" 
          />

          {/* Minimal top fade for navbar legibility */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-[2]" />
          {/* Minimal bottom fade for scroll indicator */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-[2]" />

          {/* Film grain — organic texture at 2.5% opacity, invisible but removes digital flatness */}
          <div 
            className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none z-[3] transform-gpu" 
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
          />
        </div>

        {/* Tight text-only backing — just enough to separate text from busy backgrounds */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[4]">
          <div className="w-[120%] h-[50%] bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.35)_0%,_transparent_60%)]" />
        </div>

        <div ref={textContentRef} className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto will-change-transform" style={{ perspective: '1200px' }}>
          <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] font-semibold tracking-[-0.04em] leading-[1] mb-6 opacity-100 flex flex-wrap justify-center gap-x-4 md:gap-x-6" style={{ transform: 'translateZ(60px)', transformStyle: 'preserve-3d' }}>
            <span className="word inline-block opacity-0 text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#f5f5f7] to-[#d2d2d7]" style={{ filter: 'drop-shadow(0px 20px 40px rgba(0,0,0,0.3))' }}>Beyond</span>
            <span className="word inline-block opacity-0 text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#f5f5f7] to-[#d2d2d7]" style={{ filter: 'drop-shadow(0px 20px 40px rgba(0,0,0,0.3))' }}>travel.</span>
            <div className="basis-full h-0 md:h-4" />
            <span className="word inline-block opacity-0 text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#f5f5f7] to-[#d2d2d7]" style={{ filter: 'drop-shadow(0px 20px 40px rgba(0,0,0,0.3))' }}>Pure</span>
            <span className="word inline-block opacity-0 text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#f5f5f7] to-[#d2d2d7]" style={{ filter: 'drop-shadow(0px 20px 40px rgba(0,0,0,0.3))' }}>experience.</span>
          </h1>
          <p ref={subheadRef} className="text-[17px] md:text-[21px] font-normal tracking-[0.012em] leading-[1.4] opacity-0 will-change-transform mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#a1a1a6] via-[#d2d2d7] to-[#a1a1a6]" style={{ transform: 'translateZ(30px)' }}>
            Meticulously curated journeys for those who demand the exceptional.
          </p>
        </div>

        <div className="scroll-entrance absolute bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-0">
          <div className="scroll-indicator flex flex-col items-center gap-2">
            <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/40">Scroll</span>
            <svg className="scroll-chevron w-4 h-4 text-white/40" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * WRAPPER
 * ═══════════════════════════════════════════════════════════════════ */
export function Hero() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);

    // Initial refresh to ensure all downstream triggers align
    ScrollTrigger.refresh();

    return () => mql.removeEventListener("change", handler);
  }, []); // Only run once on mount

  if (!mounted) {
    // Return a stable black placeholder during SSR/Hydration to prevent layout shifts
    return <div className="w-full h-screen bg-black" />;
  }

  return (
    <div className="w-full">
      {isMobile ? <HeroMobile /> : <HeroDesktop />}
    </div>
  );
}
