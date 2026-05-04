"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useBooking, ModalView } from "@/components/BookingProvider";
import { X, ArrowLeft, AlertCircle } from "lucide-react";
import { Magnetic } from "../Magnetic";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Placeholder for content components
import { ServiceContent } from "@/components/modals/ServiceContent";
import { BookingContent } from "@/components/modals/BookingContent";
import { AboutContent } from "@/components/modals/AboutContent";
import { CtaContent } from "@/components/modals/CtaContent";
import { PackageContent } from "@/components/modals/PackageContent";

export function ModalShell() {
  const { isOpen, view, data, source, openModal, closeModal, isClosing, startClosing, goBack, canGoBack, error, errorTrigger, setError } = useBooking();
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<ModalView>(null);
  const [activeSource, setActiveSource] = useState<string>("");
  
  // Decoupled data states to prevent flicker during transitions
  const [servicesData, setServicesData] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [packageDetailData, setPackageDetailData] = useState<any>(null);
  
  // Directional transition state
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const prevHistoryLength = useRef(0);
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const headerMaskRef = useRef<HTMLDivElement>(null);

  // Internal Step Navigation Support
  const [internalCanGoBack, setInternalCanGoBack] = useState(false);
  const backHandlerRef = useRef<(() => boolean) | null>(null);

  const registerBackHandler = useCallback((handler: (() => boolean) | null) => {
    backHandlerRef.current = handler;
  }, []);

  const handleBackAction = useCallback(() => {
    if (backHandlerRef.current) {
      const handled = backHandlerRef.current();
      if (handled) return;
    }
    goBack();
  }, [goBack]);

  useEffect(() => {
    if (error && alertRef.current) {
      const element = alertRef.current;
      const tl = gsap.timeline();
      tl.fromTo(element, 
        { x: -4 },
        { 
          x: 4, 
          duration: 0.1, 
          repeat: 5, 
          yoyo: true, 
          ease: "power2.inOut"
        }
      ).set(element, { x: 0 });
    }
  }, [errorTrigger]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync active states with provider
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    // Determine transition direction based on history change
    const currentHistoryLength = (window as any).navigation_history_length || 0; 
    // Actually, I can use a simpler method: just compare with the previous state
    
    if (view && view !== activeView) {
      // Logic for direction: if we are going back to a view that was previously active, or history shrunk
      // For now, let's use a simple depth map
      const viewDepth: Record<string, number> = { 'SERVICES': 1, 'PACKAGE': 2, 'BOOKING': 3, 'ABOUT': 1, 'CTA': 1 };
      const newDepth = viewDepth[view as string] || 0;
      const oldDepth = viewDepth[activeView as string] || 0;
      
      setDirection(newDepth >= oldDepth ? 'forward' : 'backward');
      
      setActiveView(view);
      setActiveSource(source);

      // Distribute data to the correct layer's memory
      if (view === 'SERVICES') setServicesData(data);
      if (view === 'BOOKING') setBookingData(data);
      if (view === 'PACKAGE') setPackageDetailData(data);

      if (!activeView) {
        // Initial open logic
      } else {
        // Reset header mask state via DOM directly
        if (headerMaskRef.current) {
          headerMaskRef.current.style.opacity = "0.85";
        }

        // Reset scroll position for all views to ensure clean state
        const scrollContainers = document.querySelectorAll('.scrollbar-hide');
        scrollContainers.forEach(container => {
          container.scrollTop = 0;
        });
      }
    } else if (view && data && (view === 'BOOKING' || view === 'SERVICES' || view === 'PACKAGE')) {
      // Data-only update for current view
      setActiveSource(source);
      if (view === 'SERVICES') setServicesData(data);
      if (view === 'BOOKING') setBookingData(data);
      if (view === 'PACKAGE') setPackageDetailData(data);
    }
  }, [view, data, source, activeView]);

  // Entrance/Exit Animations
  useEffect(() => {
    if (isOpen && !isClosing && panelRef.current) {
      (window as any).__lenis?.stop();
      document.body.style.overflow = "hidden";

      const tl = gsap.timeline();
      gsap.set(overlayRef.current, { opacity: 0, backdropFilter: "blur(0px)" });
      gsap.set(panelRef.current, { y: 100, opacity: 0, scale: 0.95, pointerEvents: "none" });

      tl.to(overlayRef.current, { 
        opacity: 1, 
        backdropFilter: "blur(20px)", 
        duration: 0.4, 
        ease: "power3.out" 
      })
      .to(panelRef.current, { 
        y: 0, 
        opacity: 1, 
        scale: 1, 
        duration: 0.6, 
        ease: "expo.out",
        force3D: true,
        clearProps: "pointerEvents"
      }, "-=0.2");
    } else if (isClosing && panelRef.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          setActiveView(null);
          closeModal();
          (window as any).__lenis?.start();
          document.body.style.overflow = "unset";
        }
      });

      // Disable interactions immediately on close
      gsap.set(panelRef.current, { pointerEvents: "none" });

      tl.to(panelRef.current, { 
        y: 60, 
        opacity: 0, 
        scale: 0.97, 
        duration: 0.3, 
        ease: "power4.inOut" 
      })
      .to(overlayRef.current, { 
        opacity: 0, 
        backdropFilter: "blur(0px)", 
        duration: 0.2 
      }, "-=0.2");
    }
  }, [isOpen, isClosing, closeModal]);
  
  // Restore Keyboard Accessibility (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        startClosing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, startClosing]);

  const handleScroll = useCallback((scrolled: boolean) => {
    if (headerMaskRef.current) {
      gsap.to(headerMaskRef.current, {
        opacity: scrolled ? 0.95 : 0.85,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, []);

  const handleCloseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    startClosing();
  }, [startClosing]);

  if (!mounted) return null;

  return createPortal(
    <div 
      key="modal-portal" 
      className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-8 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen || isClosing ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none invisible'}`}
    >
      {/* Backdrop - Shared across all views */}
      <div 
        ref={overlayRef} 
        className="absolute inset-0 bg-black/85 transition-opacity" 
        onClick={handleCloseClick} 
      />

      {/* Modal Shell Panel */}
      <div 
        ref={panelRef} 
        className="relative w-full max-w-[1100px] h-[90vh] bg-[#1c1c1e] border border-white/20 rounded-3xl overflow-hidden pointer-events-auto shadow-2xl will-change-transform flex flex-col transform-gpu"
        data-lenis-prevent
      >
        {/* Global Error Alert */}
        {error && (
          <div className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-[500] w-full max-w-[90vw] md:max-w-max animate-in slide-in-from-top-12 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <div ref={alertRef} className="bg-black/90 backdrop-blur-3xl border border-white/20 px-4 md:px-6 py-2.5 md:py-3 rounded-full flex items-center justify-center md:justify-start gap-3 md:gap-4 shadow-[0_30px_60px_rgba(0,0,0,0.6)] mx-auto">
              <div className="shrink-0 p-1 md:p-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-3 md:w-3.5 h-3 md:h-3.5 text-red-500" />
              </div>
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-red-500/90 whitespace-nowrap">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Cinematic Grain Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-[80] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        
        {/* Shared Progressive Mask (iOS Style) */}
        <div 
          ref={headerMaskRef}
          className="pointer-events-none absolute top-0 left-0 right-0 h-24 md:h-32 transition-all duration-1000 backdrop-blur-[5px] z-[90] transform-gpu will-change-[opacity,backdrop-filter]" 
          style={{
            opacity: 0.85,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.05) 85%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
          }}
        />

        {/* Shared Top Controls */}
        <div className="absolute top-5 left-5 right-5 z-[100] flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto">
            <Magnetic>
              <div className="relative group block">
                {/* iOS 26 Deep Shadow & Glow */}
                <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
                <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />

                <div className="relative flex items-center justify-center bg-[#f5f5f7] rounded-full transition-all duration-700 group-hover:scale-[1.05] overflow-hidden border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] w-24 h-9 md:w-28 md:h-10">
                  <div className="relative w-full h-full transition-all duration-500 flex items-center justify-center">
                    <Image
                      src="/assets/logo-transparent.webp"
                      alt="TouraLuxe Logo"
                      fill
                      priority
                      quality={75}
                      sizes="112px"
                      className="object-contain scale-[2.1] translate-y-[4px] brightness-[0.05]"
                    />
                  </div>
                </div>
              </div>
            </Magnetic>
          </div>
          
          <div className="flex items-center gap-3 pointer-events-auto">
            {(canGoBack || internalCanGoBack) && (
              <Magnetic>
                <div className="relative group block">
                  {/* iOS 26 Deep Shadow & Glow */}
                  <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
                  <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
                  <button 
                    onClick={handleBackAction} 
                    className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-500 hover:bg-white hover:text-black text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  >
                    <ArrowLeft size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </Magnetic>
            )}
            <Magnetic>
              <div className="relative group block">
                {/* iOS 26 Deep Shadow & Glow */}
                <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
                <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
                <button 
                  onClick={handleCloseClick} 
                  className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-500 hover:bg-white hover:text-black text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </Magnetic>
          </div>
        </div>

        {/* Persistent View Stack - Industry Grade Performance */}
        <div className="relative flex-1 w-full h-full overflow-hidden will-change-transform transform-gpu">
          {/* Services Layer */}
          <div 
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu will-change-[opacity,transform] 
              ${activeView === 'SERVICES' 
                ? 'opacity-100 translate-x-0 z-10 pointer-events-auto scale-100' 
                : direction === 'forward' 
                  ? 'opacity-0 -translate-x-12 z-0 pointer-events-none scale-[0.98]' 
                  : 'opacity-0 translate-x-12 z-0 pointer-events-none scale-[1.02]'}`}
          >
            <ServiceContent data={servicesData} isActive={activeView === 'SERVICES'} onScroll={handleScroll} openModal={openModal} />
          </div>

          {/* Booking Layer */}
          <div 
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu will-change-[opacity,transform] 
              ${activeView === 'BOOKING' 
                ? 'opacity-100 translate-x-0 z-10 pointer-events-auto scale-100' 
                : direction === 'forward' 
                  ? 'opacity-0 translate-x-24 z-0 pointer-events-none scale-[1.05]' 
                  : 'opacity-0 -translate-x-24 z-0 pointer-events-none scale-[0.95]'}`}
          >
            <BookingContent 
              data={bookingData} 
              isActive={activeView === 'BOOKING'} 
              source={activeSource} 
              onScroll={handleScroll} 
              startClosing={startClosing} 
              setInternalCanGoBack={setInternalCanGoBack}
              registerBackHandler={registerBackHandler}
            />
          </div>

          {/* About Layer */}
          <div 
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu will-change-[opacity,transform] 
              ${activeView === 'ABOUT' 
                ? 'opacity-100 translate-x-0 z-10 pointer-events-auto scale-100' 
                : 'opacity-0 translate-x-24 z-0 pointer-events-none'}`}
          >
            <AboutContent isActive={activeView === 'ABOUT'} onScroll={handleScroll} startClosing={startClosing} />
          </div>

          {/* CTA Layer */}
          <div 
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu will-change-[opacity,transform] 
              ${activeView === 'CTA' 
                ? 'opacity-100 translate-x-0 z-10 pointer-events-auto scale-100' 
                : 'opacity-0 translate-x-24 z-0 pointer-events-none'}`}
          >
            <CtaContent isActive={activeView === 'CTA'} onScroll={handleScroll} startClosing={startClosing} />
          </div>

          {/* Package Detail Layer */}
          <div 
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu will-change-[opacity,transform] 
              ${activeView === 'PACKAGE' 
                ? 'opacity-100 translate-x-0 z-10 pointer-events-auto scale-100' 
                : direction === 'forward' 
                  ? 'opacity-0 translate-x-24 z-0 pointer-events-none scale-[1.05]' 
                  : 'opacity-0 -translate-x-24 z-0 pointer-events-none scale-[0.95]'}`}
          >
            <PackageContent data={packageDetailData} isActive={activeView === 'PACKAGE'} source={activeSource} onScroll={handleScroll} openModal={openModal} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
