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
  const [shouldRenderCSS, setShouldRenderCSS] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { openBooking, isOpen } = useBooking();

  // Sync CSS visibility with GSAP exit animation lifecycle to prevent premature unmounting
  useEffect(() => {
    if (isVisible) {
      setShouldRenderCSS(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRenderCSS(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOpenSearch = () => {
      // Clear any pending blur timeout to prevent race conditions on double tap
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }

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
          setShowSuggestions(false);
        }
        return next;
      });
    };
    window.addEventListener("open-mobile-search", handleOpenSearch);
    return () => {
      window.removeEventListener("open-mobile-search", handleOpenSearch);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
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

  const isResizingRef = useRef(false);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check mobile & set dynamic placeholder
  useEffect(() => {
    const checkMobile = () => {
      isResizingRef.current = true;
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        isResizingRef.current = false;
      }, 150);

      const w = window.innerWidth;
      const mobile = w < 1280; // Align with xl breakpoint (1280px)

      setIsMobile(prevMobile => {
        if (prevMobile !== mobile) {
          if (mobile) {
            // Mobile: On-demand only (Apple Spotlight standard) — hidden until Search button tapped
            setIsVisible(false);
            setPlaceholder(w < 400 ? "Search" : "Search destinations");
            if (islandContainerRef.current) {
              gsap.killTweensOf(islandContainerRef.current);
              gsap.set(islandContainerRef.current, { opacity: 0, y: -120 });
            }
          } else {
            // Desktop: Ambient floating search bar — visible by default near top
            setIsVisible(true);
            setPlaceholder("Where will your next journey begin?");
            desktopEntrancePlayedRef.current = true;
            if (islandContainerRef.current) {
              gsap.killTweensOf(islandContainerRef.current);
              gsap.set(islandContainerRef.current, { opacity: 1, y: 0 });
            }
          }
        } else if (mobile && !isFocusedRef.current) {
          // On mobile window resize when input is NOT focused: strictly keep hidden to prevent resize flashes
          setIsVisible(false);
        }
        return mobile;
      });

      if (lastWidthRef.current === 0) {
        lastWidthRef.current = w;
        initialHeightRef.current = window.innerHeight;

        if (mobile) {
          setIsVisible(false);
          setPlaceholder(w < 400 ? "Search" : "Search destinations");
        } else {
          setIsVisible(true);
          setPlaceholder("Where will your next journey begin?");
        }
      }

      setIsInitialized(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Detect virtual keyboard state on mobile via visualViewport resize
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleVisualViewportChange = () => {
      // ONLY handle visualViewport height shifts when search input is actively focused
      if (!isFocusedRef.current) return;

      const vv = window.visualViewport;
      if (!vv) return;

      const keyboardActive = isFocusedRef.current && (vv.height < initialHeightRef.current * 0.85);
      setIsKeyboardOpen(keyboardActive);
      isKeyboardOpenRef.current = keyboardActive;

      if (keyboardActive) {
        setIsVisible(true);
      } else {
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
    if (window.scrollY > 100 && window.innerWidth >= 1280) {
      setIsVisible(false);
    }

    const handleScroll = () => {
      if (window.innerWidth < 1280) return; // Bypass scroll-hiding on mobile/tablet widths
      
      // If the input is focused, keep the bar visible but do NOT blur it here.
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

      if (isResizingRef.current) {
        // Fast-path during rapid window resizing: set state instantly to avoid animation flashing
        gsap.set(islandEl, { y: 0, opacity: 1, scale: 1 });
        if (innerEl) gsap.set(innerEl, { scaleX: 1, scaleY: 1 });
        if (inputAreaRef.current)    gsap.set(inputAreaRef.current,    { opacity: 1, x: 0 });
        if (searchActionRef.current) gsap.set(searchActionRef.current, { opacity: 1, scale: 1 });
        return;
      }

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
        // ─── MOBILE: Apple Dynamic Island Elastic Spring Choreography ───
        const currentOpacity = Number(gsap.getProperty(islandEl, "opacity") || 0);

        if (currentOpacity < 0.1) {
          // Stage 1: Kinetic Seed Drop (expo.out) - compressed glass seed drops from top
          // Stage 2: Elastic Morph Expansion (elastic.out(1.1, 0.45)) - morphs & elastically stretches X/Y
          // Stage 3: Staggered Content Pop (power3.out & back.out) - input field & action pop in
          gsap.set(islandEl, { y: -120, opacity: 0, scale: 0.3 });
          if (innerEl) gsap.set(innerEl, { scaleX: 0.45, scaleY: 0.7 });
          if (inputAreaRef.current)    gsap.set(inputAreaRef.current,    { opacity: 0, x: -15 });
          if (searchActionRef.current) gsap.set(searchActionRef.current, { opacity: 0, scale: 0.5 });

          const tl = gsap.timeline();

          // Stage 1: Kinetic Seed Drop (expo.out 0.5s)
          tl.to(islandEl, {
            y: 0, opacity: 1, scale: 1,
            duration: 0.5, ease: 'expo.out', force3D: true,
            clearProps: 'scale,y,opacity',
          })
          // Stage 2: Elastic Morph Expansion along X/Y axes (elastic.out(1.1, 0.45) 0.85s)
          .to(innerEl, {
            scaleX: 1, scaleY: 1,
            duration: 0.85, ease: 'elastic.out(1.1, 0.45)', force3D: true,
            clearProps: 'scaleX,scaleY',
          }, '-=0.35');

          // Stage 3: Staggered Content Pop (power3.out 0.45s & back.out 0.4s)
          if (inputAreaRef.current) {
            tl.to(inputAreaRef.current, {
              opacity: 1, x: 0,
              duration: 0.45, ease: 'power3.out', force3D: true,
              clearProps: 'opacity,x',
            }, '-=0.6');
          }

          if (searchActionRef.current) {
            tl.to(searchActionRef.current, {
              opacity: 1, scale: 1,
              duration: 0.4, ease: 'back.out(1.5)', force3D: true,
              clearProps: 'opacity,scale',
            }, '-=0.45');
          }
        } else {
          // Rapid click interrupt: smoothly catch & restore from current mid-flight coordinates without hard jumps
          if (innerEl) gsap.to(innerEl, { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'power3.out', clearProps: 'scaleX,scaleY' });
          if (inputAreaRef.current) gsap.to(inputAreaRef.current, { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out', clearProps: 'opacity,x' });
          if (searchActionRef.current) gsap.to(searchActionRef.current, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)', clearProps: 'opacity,scale' });
          
          gsap.to(islandEl, {
            y: 0, opacity: 1, scale: 1,
            duration: 0.35, ease: 'expo.out', force3D: true,
            clearProps: 'scale,y,opacity'
          });
        }
      }
    } else {
      gsap.killTweensOf(islandEl);
      if (innerEl) gsap.killTweensOf(innerEl);
      if (inputAreaRef.current)    gsap.killTweensOf(inputAreaRef.current);
      if (searchActionRef.current) gsap.killTweensOf(searchActionRef.current);

      if (isResizingRef.current) {
        gsap.set(islandEl, { y: hideY, opacity: 0, scale: 0.3 });
        if (innerEl) gsap.set(innerEl, { scaleX: 0.45, scaleY: 0.7 });
        if (inputAreaRef.current)    gsap.set(inputAreaRef.current,    { opacity: 0, x: isMobile ? -15 : 20 });
        if (searchActionRef.current) gsap.set(searchActionRef.current, { opacity: 0, scale: 0.5 });
      } else {
        // ─── REVERSE APPLE DYNAMIC ISLAND EXIT CHOREOGRAPHY ───
        // Step 1: Content & Action contract (reverse of Stage 3 pop)
        // Step 2: Inner capsule morphs back to compressed seed (reverse of Stage 2 elastic expansion)
        // Step 3: Seed retracts back up into bezel (reverse of Stage 1 kinetic drop)
        const tlExit = gsap.timeline({
          onComplete: () => {
            if (innerEl) gsap.set(innerEl, { clearProps: 'scaleX,scaleY' });
            if (inputAreaRef.current)    gsap.set(inputAreaRef.current,    { clearProps: 'opacity,x' });
            if (searchActionRef.current) gsap.set(searchActionRef.current, { clearProps: 'opacity,scale' });
          }
        });

        // Step 1: Contract content and action buttons
        if (searchActionRef.current) {
          tlExit.to(searchActionRef.current, {
            opacity: 0, scale: 0.5,
            duration: 0.15, ease: 'back.in(1.5)', force3D: true
          }, 0);
        }

        if (inputAreaRef.current) {
          tlExit.to(inputAreaRef.current, {
            opacity: 0, x: isMobile ? -15 : 20,
            duration: 0.18, ease: 'power2.in', force3D: true
          }, 0);
        }

        // Step 2: Inner island elastically compresses back to seed dimensions
        if (innerEl) {
          tlExit.to(innerEl, {
            scaleX: 0.45, scaleY: isMobile ? 0.7 : 0.75,
            duration: 0.22, ease: 'power3.in', force3D: true
          }, 0.05);
        }

        // Step 3: Kinetic Seed retraction back into bezel/floor (-120 on mobile, +80 on desktop)
        tlExit.to(islandEl, {
          y: hideY, opacity: 0, scale: 0.3,
          duration: 0.3, ease: 'expo.in', force3D: true
        }, 0.1);
      }
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
        // Only clear the width property — do NOT killTweensOf(inputAreaRef) here,
        // as that would kill the Stage 3 opacity/x animation from the Dynamic Island
        // choreography, leaving inputAreaRef stuck at opacity:0 and hiding all text.
        if (inputAreaRef.current) {
          inputAreaRef.current.style.width = '';
        }
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
          "fixed left-1/2 -translate-x-1/2 z-[45] w-full px-4 flex items-center justify-center gap-3 transition-opacity duration-200",
          isMobile ? "top-[76px] w-[calc(100%-2.5rem)] max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl" : "bottom-10 max-w-4xl",
          (!isInitialized || !shouldRenderCSS) && "opacity-0 invisible pointer-events-none",
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

        {/* islandInnerRef: plain wrapper, NO CSS transitions — Phase 2 elastic scaleX/Y target.
            w-full on mobile (form fills container), w-fit on desktop (elastic expand works correctly) */}
        <div
          ref={islandInnerRef}
          className={cn(
            "relative flex items-center justify-center transform-gpu will-change-transform",
            isMobile ? "w-full" : "w-fit"
          )}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
        {/* iOS 26 gradient border ring — mobile & desktop */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none z-[2]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.10) 40%, rgba(255,255,255,0.03) 70%, rgba(255,255,255,0.01) 100%)",
            padding: "1px",
            borderRadius: "9999px",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "destination-out",
            maskComposite: "exclude",
          }}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            triggerSearch();
          }}
          ref={pillRef}
          className={cn(
            "relative items-center border rounded-full transition-[border-color] duration-300 bg-[#0a0a0b]/95 backdrop-blur-2xl border-white/[0.18]",
            isMobile
              ? "flex w-full p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_1px_0px_rgba(255,255,255,0.12)_inset,0_-1px_0px_rgba(0,0,0,0.5)_inset]"
              : "inline-flex w-auto p-1.5 md:p-2 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),0_0_40px_rgba(0,0,0,0.6),0_1px_0px_rgba(255,255,255,0.15)_inset,0_-1px_0px_rgba(0,0,0,0.5)_inset]"
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
                  if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                  blurTimeoutRef.current = setTimeout(() => {
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
            <div ref={searchActionRef} className="shrink-0 relative z-10">
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
            </div>
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
