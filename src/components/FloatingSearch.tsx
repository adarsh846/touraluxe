"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import gsap from "gsap";
import { Search, ArrowRight, MapPin, Compass, Sparkles } from "lucide-react";
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

export function FloatingSearch() {
  const [searchValue, setSearchValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [placeholder, setPlaceholder] = useState("Where will your next journey begin?");
  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { openBooking, isOpen } = useBooking();

  // Instant autocomplete / Suggest-ahead dropdown state
  const [packages, setPackages] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [whatsappNumber, setwhatsappNumber] = useState("");

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

  // Generate suggestions list on the client in real-time (< 1ms)
  const suggestions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (query.length < 2) return [];

    const list = new Map<string, { label: string; type: 'destination' | 'package' | 'theme'; extra?: string }>();

    // 1. Direct and Substring matches in our visual manifest
    packages.forEach(pkg => {
      if (pkg.location && pkg.location.toLowerCase().includes(query)) {
        list.set(`loc:${pkg.location.trim()}`, { label: pkg.location.trim(), type: 'destination', extra: 'Available Escape' });
      }
      if (pkg.destination && pkg.destination.toLowerCase().includes(query)) {
        list.set(`dest:${pkg.destination.trim()}`, { label: pkg.destination.trim(), type: 'destination', extra: 'Destination' });
      }
      if (pkg.title && pkg.title.toLowerCase().includes(query)) {
        list.set(`pkg:${pkg.title.trim()}`, { label: pkg.title.trim(), type: 'package', extra: pkg.location || 'Luxury Experience' });
      }
    });

    // 2. Direct match in major worldwide hotspots
    const matchedGlobals = MAJOR_DESTINATIONS.filter(dest => 
      dest.toLowerCase().startsWith(query) || (dest.toLowerCase().includes(query) && query.length >= 4)
    ).slice(0, 4);

    matchedGlobals.forEach(dest => {
      list.set(`global:${dest.trim()}`, { label: dest.trim(), type: 'destination', extra: 'Global Destination' });
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
        list.set(`fuzzy:${item.dest}`, { label: item.dest, type: 'destination', extra: 'Did you mean?' });
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
        if (w < 400) {
          setPlaceholder("Search");
        } else {
          setPlaceholder("Search destinations");
        }
      } else {
        setPlaceholder("Where will your next journey begin?");
      }

      // Only update initialHeightRef if screen width actually changed (orientation/resize)
      // to prevent mobile virtual keyboard opening from overriding the default layout height.
      if (w !== lastWidthRef.current) {
        lastWidthRef.current = w;
        initialHeightRef.current = window.innerHeight;
      }
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
      isKeyboardOpenRef.current = keyboardActive; // Keep ref in sync for scroll guard

      if (keyboardActive) {
        setIsVisible(true);
      } else {
        // Auto-blur input when keyboard is dismissed to reset focus state correctly
        if (document.activeElement instanceof HTMLInputElement && 
            document.activeElement.placeholder.includes("Search")) {
          document.activeElement.blur();
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
    if (window.scrollY > 100) {
      setIsVisible(false);
    }

    const handleScroll = () => {
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
  }, []); // Empty deps — scroll handler always reads from refs, never from stale state

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
    <div
      ref={searchContainerRef}
      className={cn(
        "fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-[45] w-full max-w-4xl px-4 flex items-center justify-center gap-3 transition-all duration-700",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      )}
    >
      {/* Predictive Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full mb-3 w-[calc(100%-2rem)] max-w-lg bg-[#0c0c0e]/95 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col p-1.5 z-[50]">
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          triggerSearch();
        }}
        ref={pillRef}
        className="relative inline-flex w-auto items-center p-1.5 md:p-2 bg-black/80 md:bg-black/90 border border-white/10 rounded-full backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),0_0_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-[border-color] duration-300"
        onMouseMove={(e) => handleGlowMove(e.clientX, e.clientY)}
        onMouseEnter={(e) => handleGlowMove(e.clientX, e.clientY)}
        onMouseLeave={handleGlowLeave}
        onTouchStart={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
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

        <div ref={inputAreaRef} className="flex-none flex items-center gap-2 px-3 md:px-4 py-2 relative z-10 overflow-hidden">
          <Search className="text-white/50 shrink-0" size={14} />
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

        <div className="shrink-0 relative z-10">
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
      </form>

      {whatsappNumber && (
        <WhatsAppButton phoneNumber={whatsappNumber} isInline />
      )}
    </div>
  );
}
