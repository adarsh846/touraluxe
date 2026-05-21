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
  const [isVisible, setIsVisible] = useState(true);
  const { openBooking } = useBooking();
  
  const pillRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textMeasureRef = useRef<HTMLSpanElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);
  const lastScrollY = useRef(0);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Smart Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Show if scrolling up, hide if scrolling down (give 20px threshold)
      if (currentScrollY > lastScrollY.current + 20) {
        setIsVisible(false);
        lastScrollY.current = currentScrollY;
      } else if (currentScrollY < lastScrollY.current - 20) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
      }
      
      // Always show when at the very top or very bottom
      if (currentScrollY < 100) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    window.addEventListener('resize', calculate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', calculate);
    };
  }, [searchValue, isMobile]);

  return (
    <div 
      className={cn(
        "fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-[45] w-full max-w-4xl px-4 flex justify-center transition-all duration-700 transform-gpu",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      )}
    >
      <div 
        ref={pillRef}
        className="relative inline-flex items-center p-1.5 md:p-2 bg-black/80 md:bg-black/90 border border-white/10 rounded-full backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),0_0_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-[border-color] duration-300 transform-gpu"
        onMouseMove={(e) => handleGlowMove(e.clientX, e.clientY)}
        onMouseEnter={(e) => handleGlowMove(e.clientX, e.clientY)}
        onMouseLeave={handleGlowLeave}
        onTouchStart={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleGlowLeave}
      >
        <span ref={textMeasureRef} className="absolute invisible whitespace-pre text-[10px] md:text-[11px] font-medium uppercase tracking-wider md:tracking-[0.2em]">
          {searchValue || (isMobile ? "Search destinations" : "Where will your next journey begin?")}
        </span>

        <div 
          ref={glowRef}
          className="absolute inset-0 rounded-full pointer-events-none z-[1] transition-opacity duration-300"
          style={{ opacity: 0, mixBlendMode: 'screen' }}
        />
        
        <div ref={inputAreaRef} className="flex items-center gap-2 px-3 md:px-4 py-2 relative z-10 overflow-hidden">
          <Search className="text-white/50 shrink-0" size={14} />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={isMobile ? "Search destinations" : "Where will your next journey begin?"}
            className="w-full bg-transparent text-white placeholder-white/50 text-[10px] md:text-[11px] font-medium uppercase tracking-wider md:tracking-[0.2em] outline-none"
          />
        </div>

        <div className="shrink-0 relative z-10">
          <Magnetic>
            <button
              onClick={() => {
                openBooking(undefined, "FLOATING_SEARCH", searchValue.trim() || "Explore");
              }}
              className="bg-gradient-to-br from-yellow-400 to-amber-600 text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] px-5 md:px-8 py-3 md:py-4 rounded-full transition-all duration-700 shadow-xl flex items-center justify-center gap-1.5 border border-white/20 hover:brightness-110"
            >
              <span>Explore</span>
              <ArrowRight size={10} className="stroke-[3]" />
            </button>
          </Magnetic>
        </div>
      </div>
    </div>
  );
}
