"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import gsap from "gsap";
import { Search, ArrowRight, MapPin, Compass, Sparkles, X } from "lucide-react";
import { useBooking } from "./BookingProvider";
import { Magnetic } from "./Magnetic";
import { cn } from "@/lib/utils";
import { getPackageManifest } from "@/lib/manifestCache";
import { MAJOR_DESTINATIONS } from "@/lib/geography";
import { WhatsAppButton } from "./WhatsAppButton";

// Jaro-Winkler helper for typo-tolerant suggest-ahead matching
function getJaroWinkler(s1: string, s2: string): number {
  let m = 0;
  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1 === s2) return 1;

  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  for (let i = 0; i < s1.length; i++) {
    const low = Math.max(0, i - range);
    const high = Math.min(i + range + 1, s2.length);
    for (let j = low; j < high; j++) {
      if (!s1Matches[i] && !s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
  }

  if (m === 0) return 0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
  }

  const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
  const p = 0.1;
  let l = 0;
  while (s1[l] === s2[l] && l < 4) l++;

  return jaro + l * p * (1 - jaro);
}

// Capitalization helper to keep search inputs beautifully formatted in title case
function capitalizeWords(str: string): string {
  if (!str) return "";
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function FloatingSearch() {
  const [searchValue, setSearchValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [placeholder, setPlaceholder] = useState("Where will your next journey begin?");
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { openBooking, isOpen } = useBooking();

  useEffect(() => {
    const handleOpenSearch = () => {
      setIsVisible(prev => {
        const next = !prev;
        if (next) {
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 150);
        } else {
          if (inputRef.current) {
            inputRef.current.blur();
          }
        }
        return next;
      });
    };
    window.addEventListener("open-mobile-search", handleOpenSearch);
    return () => window.removeEventListener("open-mobile-search", handleOpenSearch);
  }, []);

  // Instant autocomplete / Suggest-ahead dropdown state
  const [packages, setPackages] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [whatsappNumber, setwhatsappNumber] = useState("");

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPreloaderCompleted, setIsPreloaderCompleted] = useState(false);

  useEffect(() => {
    const hasPreloaderFinished = typeof window !== "undefined" && (window as any).preloaderPlayed;
    if (hasPreloaderFinished) {
      setIsPreloaderCompleted(true);
    } else {
      const handleComplete = () => setIsPreloaderCompleted(true);
      window.addEventListener("preloaderComplete", handleComplete);
      return () => window.removeEventListener("preloaderComplete", handleComplete);
    }
  }, []);

  // Load packages manifest once on mount to warm client index
  useEffect(() => {
    getPackageManifest().then(data => {
      if (data) setPackages(data);
    }).catch(err => console.warn("Failed to load packages for search index:", err));

    import("@/lib/settingsCache").then(({ getSettings }) => {
      getSettings().then(data => {
        if (data.whatsapp_number) {
          setwhatsappNumber(data.whatsapp_number);
        } else if (data.contact_phone) {
          setwhatsappNumber(data.contact_phone);
        }
      });
    });
  }, []);

  // Clear search query when the modal closes (Apple UX standard)
  useEffect(() => {
    if (!isOpen) {
      setSearchValue("");
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const pillRef = useRef<HTMLFormElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textMeasureRef = useRef<HTMLSpanElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchActionRef = useRef<HTMLDivElement>(null);
  // Phase 1 target: full-width GSAP-owned wrapper (y, scale, opacity) — matches PackageContent islandContainerRef
  // The outer searchContainerRef is the pure CSS centering shell and is NEVER GSAP-animated
  const islandContainerRef = useRef<HTMLDivElement>(null);
  // Phase 2 target: w-fit plain wrapper (elastic scaleX, scaleY) — matches PackageContent islandInnerRef
  // MUST be a plain div with NO CSS transitions, otherwise transition-all intercepts elastic.out and destroys it
  const islandInnerRef = useRef<HTMLDivElement>(null);

  // Generate suggestions list on the client in real-time (< 1ms)
  const suggestions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (query.length < 2) return [];

    const list = new Map<string, { label: string; type: 'destination' | 'package' | 'theme'; extra?: string }>();

    const getPriority = (extra?: string) => {
      if (extra === 'Available Escape') return 5;
      if (extra === 'Destination') return 4;
      if (extra === 'Global Destination') return 2;
      if (extra === 'Did you mean?') return 1;
      return 3; // Packages / default
    };

    const addSuggestion = (item: { label: string; type: 'destination' | 'package' | 'theme'; extra?: string }) => {
      const key = item.label.trim().toLowerCase();
      const existing = list.get(key);
      if (!existing || getPriority(item.extra) > getPriority(existing.extra)) {
        list.set(key, { ...item, label: capitalizeWords(item.label) });
      }
    };

    // 1. Direct and Substring matches in our visual manifest
    packages.forEach(pkg => {
      if (pkg.destination && (
        pkg.destination.toLowerCase().includes(query) || 
        (pkg.location && pkg.location.toLowerCase().includes(query))
      )) {
        addSuggestion({ label: pkg.destination.trim(), type: 'destination', extra: 'Available Escape' });
      }
      if (pkg.title && pkg.title.toLowerCase().includes(query)) {
        addSuggestion({ label: pkg.title.trim(), type: 'package', extra: pkg.destination || 'Luxury Experience' });
      }
    });

    // 2. Direct match in major worldwide hotspots
    const matchedGlobals = MAJOR_DESTINATIONS.filter(dest => 
      dest.toLowerCase().startsWith(query) || (dest.toLowerCase().includes(query) && query.length >= 4)
    ).slice(0, 4);

    matchedGlobals.forEach(dest => {
      addSuggestion({ label: dest.trim(), type: 'destination', extra: 'Global Destination' });
    });

    // 3. Typo-tolerant suggestion if zero direct matches
    if (list.size === 0 && query.length >= 3) {
      const fuzzyGlobals = MAJOR_DESTINATIONS.map(dest => ({
        dest: dest.trim(),
        score: getJaroWinkler(query, dest.toLowerCase())
      }))
      .filter(item => item.score > 0.8)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

      fuzzyGlobals.forEach(item => {
        addSuggestion({ label: item.dest, type: 'destination', extra: 'Did you mean?' });
      });
    }

    return Array.from(list.values()).slice(0, 5);
  }, [searchValue, packages]);

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update showSuggestions status as query length updates
  useEffect(() => {
    if (searchValue.trim().length >= 2 && isFocused) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchValue, isFocused]);
  const hasMountedRef = useRef(false);
  const initialHeightRef = useRef(0);
  const lastWidthRef = useRef(0);
  // Guard: full entrance choreography fires only once on first load (like PackageContent's islandAnimatedRef)
  const desktopEntrancePlayedRef = useRef(false);

  const triggerSearch = useCallback((valueOverride?: string) => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
    const finalVal = (valueOverride !== undefined ? valueOverride : searchValue).trim();
    setShowSuggestions(false);
    setSelectedIndex(-1);
    openBooking(undefined, "FLOATING_SEARCH", finalVal || "Explore");
  }, [searchValue, openBooking]);

  // Check mobile & set dynamic placeholder
  useEffect(() => {
    const checkMobile = () => {
      const w = window.innerWidth;
      const mobile = w < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsVisible(false); // Hide by default on mobile, triggered by bottom nav
        if (w < 400) {
          setPlaceholder("Search");
        } else {
          setPlaceholder("Search destinations");
        }
      } else {
        setIsVisible(true);
        setPlaceholder("Where will your next journey begin?");
      }

      // Only update initialHeightRef if screen width actually changed (orientation/resize)
      // to prevent mobile virtual keyboard opening from overriding the default layout height.
      if (w !== lastWidthRef.current) {
        lastWidthRef.current = w;
        initialHeightRef.current = window.innerHeight;
      }
      setIsInitialized(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detect virtual keyboard state on mobile via visualViewport resize
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleVisualViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      const keyboardActive = isFocusedRef.current && (vv.height < initialHeightRef.current * 0.85);
      setIsKeyboardOpen(keyboardActive);
      isKeyboardOpenRef.current = keyboardActive;

      if (keyboardActive) {
        setIsVisible(true);
      } else {
        // Only blur — and therefore allow hiding — when the keyboard is definitively closed.
        // The keyboard open animation fires multiple visualViewport resize events; during that
        // animation, vv.height transiently sits between 85–95% of initial (not yet fully open,
        // not fully closed). Blurring in that transient window caused the search bar to
        // disappear immediately after appearing. We guard with a 95% threshold so we only
        // blur when the viewport is back near full height (keyboard is truly dismissed).
        const keyboardDefinitelyClosed = vv.height >= initialHeightRef.current * 0.95;
        if (keyboardDefinitelyClosed && document.activeElement === inputRef.current) {
          inputRef.current?.blur();
        }
      }
    };

    window.visualViewport.addEventListener("resize", handleVisualViewportChange, { passive: true });
    
    return () => {
      window.visualViewport?.removeEventListener("resize", handleVisualViewportChange);
    };
  }, []);

  const lastScrollY = useRef(0);
  const isFocusedRef = useRef(false);
  const isKeyboardOpenRef = useRef(false);

  // Smart Scroll Logic - runs once, refs used for real-time guard to avoid stale closure
  useEffect(() => {
    lastScrollY.current = window.scrollY;
    if (window.scrollY > 100 && !isMobile) {
      setIsVisible(false);
    }

    const handleScroll = () => {
      if (isMobile) return; // Bypass scroll-hiding on mobile
      
      // If the input is focused, keep the bar visible but do NOT blur it here.
      // Generic window 'scroll' events trigger on programmatic shifts (e.g. browser keyboard centering).
      // Blurring here would cause instant collapse upon tap.
      if (isFocusedRef.current) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;

      // Always show when near the top of the page
      if (currentScrollY < 50) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;
      if (diff > 15) {
        // Scrolling down -> hide
        setIsVisible(false);
        lastScrollY.current = currentScrollY;
      } else if (diff < -15) {
        // Scrolling up -> show
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Auto-blur search input and collapse virtual keyboard on manual touch drag gesture (mobile only)
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchMove = () => {
      if (isFocusedRef.current && inputRef.current) {
        inputRef.current.blur();
      }
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => window.removeEventListener("touchmove", handleTouchMove);
  }, [isMobile]);

  useIsomorphicLayoutEffect(() => {
    // searchContainerRef = CSS centering shell (-translate-x-1/2), NEVER animated by GSAP
    // islandContainerRef = Phase 1 target: y, scale, opacity (full-width flex wrapper)
    // islandInnerRef     = Phase 2 target: elastic scaleX/Y (w-fit plain div, zero CSS transitions)
    // pillRef            = the visual form pill (only border-color CSS transition, no transform conflict)
    const islandEl = islandContainerRef.current;
    const innerEl = islandInnerRef.current; // Phase 2 elastic target
    if (!islandEl) return;

    // Hold off until preloader finishes
    if (!isPreloaderCompleted) {
      gsap.set(islandEl, { opacity: 0 });
      return;
    }

    const startY = isMobile ? -120 : 80;
    const hideY  = isMobile ? -120 : 80;

    if (isVisible) {
      gsap.killTweensOf(islandEl);
      if (innerEl) gsap.killTweensOf(innerEl);
      if (inputAreaRef.current)    gsap.killTweensOf(inputAreaRef.current);
      if (searchActionRef.current) gsap.killTweensOf(searchActionRef.current);

      if (!isMobile) {
        // ─── FIRST-LOAD: Exact PackageContent 4-phase Apple Dynamic Island choreography ───
        // islandEl  ≡ islandContainerRef in PackageContent (Phase 1: y / scale / opacity)
        // innerEl   ≡ islandInnerRef in PackageContent    (Phase 2: elastic scaleX / scaleY)
        // inputAreaRef  ≡ segmentsRef                     (Phase 3: opacity / x)
        // searchActionRef ≡ actionRef                     (Phase 4: opacity / scale)
        if (!desktopEntrancePlayedRef.current) {
          desktopEntrancePlayedRef.current = true;

          // Initial compressed-seed state — identical to PackageContent gsap.set calls
          gsap.set(islandEl, { y: 80, opacity: 0, scale: 0.3 });
          if (innerEl) gsap.set(innerEl, { scaleX: 0.45, scaleY: 0.75 });
          if (inputAreaRef.current)    gsap.set(inputAreaRef.current,    { opacity: 0, x: 20 });
          if (searchActionRef.current) gsap.set(searchActionRef.current, { opacity: 0, scale: 0.6 });

          // Preloader exit is complete — 0.1s is enough for browser paint to settle
          const tl = gsap.timeline({ delay: 0.1 });

          // Phase 1: Seed rises from bottom — expo.out 0.6s
          tl.to(islandEl, {
            y: 0, opacity: 1, scale: 1,
            duration: 0.6, ease: 'expo.out', force3D: true,
            clearProps: 'scale,y,opacity',
          })
          // Phase 2: w-fit wrapper elastically expands to full pill width — elastic.out(1.1,0.45) 0.9s
          .to(innerEl, {
            scaleX: 1, scaleY: 1,
            duration: 0.9, ease: 'elastic.out(1.1, 0.45)', force3D: true,
            clearProps: 'scaleX,scaleY',
          }, '-=0.4');

          // Phase 3: Input area slides in — power3.out 0.5s
          if (inputAreaRef.current) {
            tl.to(inputAreaRef.current, {
              opacity: 1, x: 0,
              duration: 0.5, ease: 'power3.out', force3D: true,
              clearProps: 'opacity,x',
            }, '-=0.65');
          }

          // Phase 4: Explore button pops in — back.out(1.5) 0.4s
          if (searchActionRef.current) {
            tl.to(searchActionRef.current, {
              opacity: 1, scale: 1,
              duration: 0.4, ease: 'back.out(1.5)', force3D: true,
              clearProps: 'opacity,scale',
            }, '-=0.45');
          }

        } else {
          // Subsequent show: lightweight slide up only
          gsap.fromTo(islandEl,
            { y: hideY, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out', force3D: true, clearProps: 'scale,y,opacity' }
          );
        }
      } else {
        // Mobile: spring drop from top
        gsap.fromTo(islandEl,
          { y: startY, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'elastic.out(1.1, 0.75)', force3D: true, clearProps: 'scale,y,opacity' }
        );
      }
    } else {
      gsap.killTweensOf(islandEl);
      if (innerEl) gsap.killTweensOf(innerEl);
      if (inputAreaRef.current)    gsap.killTweensOf(inputAreaRef.current);
      if (searchActionRef.current) gsap.killTweensOf(searchActionRef.current);

      gsap.to(islandEl, {
        y: hideY, opacity: 0, scale: 0.95,
        duration: 0.4, ease: 'power3.inOut', force3D: true,
      });
    }
  }, [isVisible, isMobile, isPreloaderCompleted]);


  // iOS 26 Pointer-Tracking Glow
  const handleGlowMove = useCallback((clientX: number, clientY: number) => {
    if (!pillRef.current || !glowRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    glowRef.current.style.background = `
      radial-gradient(ellipse 300px 180px at ${x}px ${y}px, rgba(255,251,240,0.15), rgba(255,255,255,0.02) 60%, transparent 100%),
      radial-gradient(ellipse 500px 300px at ${x}px ${y}px, rgba(255,255,255,0.03), transparent 70%),
      radial-gradient(ellipse 800px 500px at ${x}px ${y}px, rgba(255,255,255,0.01), transparent 80%)
    `;
    glowRef.current.style.opacity = '1';
    pillRef.current.style.borderColor = 'rgba(255,255,255,0.35)';
  }, []);

  const handleGlowLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = '0';
    if (pillRef.current) pillRef.current.style.borderColor = 'rgba(255,255,255,0.1)';
  }, []);

  // Dynamic Island Elastic Resizing Engine
  useEffect(() => {
    if (!textMeasureRef.current || !inputAreaRef.current) return;

    const calculate = () => {
      if (!textMeasureRef.current || !inputAreaRef.current) return;

      if (isMobile) {
        gsap.killTweensOf(inputAreaRef.current);
        gsap.set(inputAreaRef.current, { clearProps: "width" });
        return;
      }

      const textWidth = textMeasureRef.current.scrollWidth;
      const iconWidth = 14 + 8; // icon size + gap-2
      const inputPadding = isMobile ? 24 : 32;
      const minTextWidth = isMobile ? 40 : 60;

      const activeBuffer = searchValue ? (isMobile ? 40 : 60) : 0;
      // Add a 12px safety buffer to account for cross-browser text rendering differences
      const naturalWidth = Math.max(textWidth, minTextWidth) + iconWidth + inputPadding + activeBuffer + 12;

      const vw = window.innerWidth;
      const buttonEl = pillRef.current?.querySelector('button') as HTMLElement | null;
      const buttonWidth = buttonEl?.offsetWidth || (isMobile ? 90 : 140);
      const pillPadding = isMobile ? 12 : 16;
      // Instead of container padding, max width is vw - padding
      const maxInputWidth = vw - 32 - pillPadding - buttonWidth - 8;

      const targetWidth = Math.min(naturalWidth, maxInputWidth);

      const isFirstRender = !hasMountedRef.current;
      hasMountedRef.current = true;

      gsap.killTweensOf(inputAreaRef.current);
      gsap.to(inputAreaRef.current, {
        width: targetWidth,
        duration: isFirstRender ? 0.01 : 1.2,
        ease: isFirstRender ? "none" : "elastic.out(1, 0.4)",
        force3D: true,
      });
    };

    const raf = requestAnimationFrame(calculate);
    window.addEventListener('resize', calculate, { passive: true });

    // Recalculate once custom fonts are loaded to prevent fallback-font measurement mismatch
    if (typeof document !== "undefined" && (document as any).fonts) {
      (document as any).fonts.ready.then(calculate);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', calculate);
    };
  }, [searchValue, isMobile, placeholder]);

  return (
    <>
      {/* CSS centering shell — never GSAP-animated so -translate-x-1/2 is never clobbered */}
      <div
        ref={searchContainerRef}
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-[45] w-full px-4 flex items-center justify-center gap-3",
          isMobile ? "top-[76px] max-w-sm" : "bottom-10 max-w-4xl",
          !isInitialized && "opacity-0 invisible",
          !isVisible && "pointer-events-none"
        )}
      >
        {/* GSAP-owned island wrapper — matches PackageContent's islandContainerRef exactly */}
        <div
          ref={islandContainerRef}
          className="relative flex items-center justify-center gap-3 w-full transform-gpu will-change-[transform,opacity]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
        {/* Predictive Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className={cn(
            "absolute bg-[#0c0c0e]/95 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col p-1.5 z-[50]",
            isMobile ? "top-full mt-3 left-4 right-4" : "bottom-full mb-3 w-[calc(100%-2rem)] max-w-lg"
          )}>
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur on item select
                    setSearchValue(item.label);
                    triggerSearch(item.label);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200",
                    isSelected ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {item.type === 'destination' ? (
                    <MapPin size={13} className="text-white/40 shrink-0" />
                  ) : (
                    <Sparkles size={13} className="text-white/40 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase truncate">{item.label}</p>
                  </div>
                  {item.extra && (
                    <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/30 px-2 py-0.5 bg-white/5 rounded">
                      {item.extra}
                    </span>
                  )}
                </button>
              );
            })}
            
            <div className="hidden md:flex border-t border-white/5 mt-1.5 pt-1.5 px-3 pb-1 flex justify-between items-center text-[7px] font-black uppercase tracking-[0.15em] text-white/20">
              <span>Press ↑↓ to navigate</span>
              <span>Enter to select</span>
            </div>
          </div>
        )}

        {/* islandInnerRef: plain w-fit wrapper, NO CSS transitions — Phase 2 elastic scaleX/Y target.
            Matches PackageContent's islandInnerRef exactly. transition-all on form would kill elastic.out. */}
        <div
          ref={islandInnerRef}
          className="relative flex items-center justify-center w-fit transform-gpu will-change-transform"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            triggerSearch();
          }}
          ref={pillRef}
          className={cn(
            "relative items-center bg-[#0b0b0c] border border-white/10 rounded-full shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),0_0_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-[border-color] duration-300",
            isMobile 
              ? "flex w-full p-1.5 bg-[#0b0b0c]/90 backdrop-blur-xl border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)]" 
              : "inline-flex w-auto p-1.5 md:p-2"
          )}
          onMouseMove={(e) => !isMobile && handleGlowMove(e.clientX, e.clientY)}
          onMouseEnter={(e) => !isMobile && handleGlowMove(e.clientX, e.clientY)}
          onMouseLeave={handleGlowLeave}
          onTouchStart={(e) => !isMobile && handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => !isMobile && handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleGlowLeave}
        >
          <span 
            ref={textMeasureRef} 
            className="absolute invisible whitespace-pre font-medium uppercase tracking-[0.15em] md:tracking-[0.2em]"
            style={{
              fontSize: isMobile ? "clamp(10px, 2.8vw, 11px)" : "11px"
            }}
          >
            {searchValue || placeholder}
          </span>

          <div
            ref={glowRef}
            className="absolute inset-0 rounded-full pointer-events-none z-[1] transition-opacity duration-300"
            style={{ opacity: 0, mixBlendMode: 'screen' }}
          />

          <div 
            ref={inputAreaRef} 
            className={cn(
              "flex items-center gap-2 px-3 md:px-4 py-2 relative z-10 overflow-hidden",
              isMobile ? "flex-1 w-full" : "flex-none"
            )}
          >
            {isMobile ? (
              <button 
                type="submit" 
                disabled={!searchValue}
                className="text-white/50 active:scale-95 transition-transform shrink-0 disabled:pointer-events-none"
              >
                <Search size={14} className={cn(searchValue ? "text-white" : "text-white/50")} />
              </button>
            ) : (
              <Search className="text-white/50 shrink-0" size={14} />
            )}
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                isFocusedRef.current = true; // Sync ref immediately for scroll guard
                setIsVisible(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                isFocusedRef.current = false; // Sync ref immediately for scroll guard
                if (isMobile) {
                  setTimeout(() => {
                    if (!isFocusedRef.current) {
                      setIsVisible(false);
                    }
                  }, 200);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    const val = suggestions[selectedIndex].label;
                    setSearchValue(val);
                    triggerSearch(val);
                  } else {
                    triggerSearch();
                  }
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setSelectedIndex(-1);
                }
              }}
              placeholder={placeholder}
              className="w-full p-0 border-none bg-transparent text-white placeholder-white/50 placeholder-small font-medium uppercase tracking-[0.15em] md:tracking-[0.2em] outline-none"
              style={{
                fontSize: isMobile ? "clamp(10px, 2.8vw, 11px)" : "11px"
              }}
            />
          </div>

          {!isMobile && (
            <div ref={searchActionRef} className="shrink-0 relative z-10">
              <Magnetic>
                <button
                  type="submit"
                  style={{ background: "linear-gradient(135deg, #a18cd1, #fbc2eb)" }}
                  className="text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] px-5 md:px-8 py-3 md:py-4 rounded-full transition-all duration-700 shadow-xl flex items-center justify-center gap-1.5 border border-white/20 hover:brightness-110"
                >
                  <span>Explore</span>
                  <ArrowRight size={10} className="stroke-[3]" />
                </button>
              </Magnetic>
            </div>
          )}

          {isMobile && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                if (inputRef.current) {
                  inputRef.current.blur();
                }
                setShowSuggestions(false);
                setIsVisible(false);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white px-3 py-2 transition-colors duration-300 shrink-0"
            >
              Cancel
            </button>
          )}
        </form>
        </div>{/* /islandInnerRef */}

        {!isMobile && whatsappNumber && (
          <WhatsAppButton phoneNumber={whatsappNumber} isInline={true} />
        )}
        </div>{/* /islandContainerRef */}
      </div>
    </>
  );
}
