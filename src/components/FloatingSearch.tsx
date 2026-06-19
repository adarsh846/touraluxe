"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { Search, ArrowRight } from "lucide-react";
import { useBooking } from "./BookingProvider";
import { Magnetic } from "./Magnetic";
import { cn } from "@/lib/utils";

export function FloatingSearch() {
  const [searchValue, setSearchValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [placeholder, setPlaceholder] = useState("Where will your next journey begin?");
  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { openBooking, isOpen } = useBooking();

  // Clear search query when the modal closes (Apple UX standard)
  useEffect(() => {
    if (!isOpen) {
      setSearchValue("");
    }
  }, [isOpen]);

  const pillRef = useRef<HTMLFormElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textMeasureRef = useRef<HTMLSpanElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMountedRef = useRef(false);
  const initialHeightRef = useRef(0);
  const lastWidthRef = useRef(0);

  const triggerSearch = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
    openBooking(undefined, "FLOATING_SEARCH", searchValue.trim() || "Explore");
  }, [searchValue, openBooking]);

  // Check mobile & set dynamic placeholder
  useEffect(() => {
    const checkMobile = () => {
      const w = window.innerWidth;
      const mobile = w < 768;
      setIsMobile(mobile);
      if (mobile) {
        if (w < 350) {
          setPlaceholder("Where to?");
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
      
      const keyboardActive = vv.height < initialHeightRef.current * 0.85;
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
      // If the input is focused or keyboard is open, keep the bar visible but do NOT blur it here.
      // Generic window 'scroll' events trigger on programmatic shifts (e.g. browser keyboard centering).
      // Blurring here would cause instant collapse upon tap.
      if (isFocusedRef.current || isKeyboardOpenRef.current) {
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
      const naturalWidth = Math.max(textWidth, minTextWidth) + iconWidth + inputPadding + activeBuffer;

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
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', calculate);
    };
  }, [searchValue, isMobile, placeholder]);

  return (
    <div
      className={cn(
        "fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-[45] w-full max-w-4xl px-4 flex justify-center transition-all duration-700",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      )}
    >
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
          className={cn(
            "absolute invisible whitespace-pre font-medium uppercase",
            searchValue 
              ? "text-base md:text-[11px] tracking-wider md:tracking-[0.2em]" 
              : "text-[10px] md:text-[11px] tracking-[0.15em] md:tracking-[0.2em]"
          )}
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
              if (e.key === 'Enter') {
                triggerSearch();
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-white placeholder-white/50 placeholder-small text-base md:text-[11px] font-medium uppercase tracking-wider md:tracking-[0.2em] outline-none"
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
    </div>
  );
}
