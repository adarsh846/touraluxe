"use client";

import { useEffect, useRef, useState, useCallback, useMemo, Fragment } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useBooking, ModalView } from "@/components/BookingProvider";
import { X, ArrowLeft, AlertCircle, Check, LogOut } from "lucide-react";
import { Magnetic } from "../Magnetic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

// Placeholder for content components
import { ServiceContent } from "@/components/modals/ServiceContent";
import { BookingContent } from "@/components/modals/BookingContent";
import { AboutContent } from "@/components/modals/AboutContent";
import { CtaContent } from "@/components/modals/CtaContent";
import { PackageContent } from "@/components/modals/PackageContent";
import { PortalContent } from "@/components/modals/PortalContent";

export function ModalShell() {
  const { user, signOut } = useAuth();
  const { isOpen, view, data, source, openModal, closeModal, isClosing, startClosing, goBack, canGoBack, history, error, errorTrigger, setError } = useBooking();
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
  const modalRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const headerMaskRef = useRef<HTMLDivElement>(null);

  // Internal Step Navigation Support
  const [internalCanGoBack, setInternalCanGoBack] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [activeStep, setActiveStep] = useState(1);
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
    if (view && view !== activeView) {
      const viewDepth: Record<string, number> = { 'SERVICES': 1, 'PACKAGE': 2, 'BOOKING': 3, 'ABOUT': 1, 'CTA': 1, 'PORTAL': 2 };
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

  // Persistent Background Lock
  useEffect(() => {
    if (isOpen && !isClosing) {
      const lock = () => {
        (window as any).__lenis?.stop();
        document.body.style.setProperty("overflow", "hidden", "important");
        document.documentElement.style.setProperty("overflow", "hidden", "important");
      };
      lock();
      return () => {
        (window as any).__lenis?.start();
        document.body.style.removeProperty("overflow");
        document.documentElement.style.removeProperty("overflow");
      };
    }
  }, [isOpen, isClosing]);

  // Entrance/Exit Animations
  useEffect(() => {
    if (isOpen && !isClosing && modalRef.current) {
      const tl = gsap.timeline();
      // OPTIMIZATION: Do not animate backdropFilter radius. Just animate opacity of a static blurred div.
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(modalRef.current, { y: 100, opacity: 0, scale: 0.95, pointerEvents: "none" });

      tl.to(overlayRef.current, { 
        opacity: 1, 
        duration: 0.4, 
        ease: "power3.out" 
      })
      .to(modalRef.current, { 
        y: 0, 
        opacity: 1, 
        scale: 1, 
        duration: 0.6, 
        ease: "expo.out",
        force3D: true,
        clearProps: "pointerEvents"
      }, "-=0.2");
    } else if (isClosing && modalRef.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          setActiveView(null);
          closeModal();
        }
      });

      // Disable interactions immediately on close
      gsap.set(modalRef.current, { pointerEvents: "none" });

      tl.to(modalRef.current, { 
        y: 60, 
        opacity: 0, 
        scale: 0.97, 
        duration: 0.3, 
        ease: "power4.inOut" 
      })
      .to(overlayRef.current, { 
        opacity: 0, 
        duration: 0.3, 
        ease: "power3.in" 
      }, "-=0.1");
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
      data-modal-portal
      className={`fixed inset-0 z-[300] flex items-center justify-center p-0 overflow-hidden transform-gpu transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen || isClosing ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none invisible'}`}
    >
      {/* Backdrop - Shared across all views */}
      <div 
        ref={overlayRef} 
        onClick={startClosing}
        className="absolute inset-0 bg-black/40 backdrop-blur-3xl" 
      />

      {/* Modal Shell Panel */}
      <div 
        ref={modalRef}
        className="relative w-full h-[100svh] md:h-full bg-[#0a0a0b] shadow-2xl border-0 flex flex-col overflow-hidden transform-gpu"
        data-lenis-prevent
      >
        {/* Global Error Alert */}
        {error && (
          <div className="absolute bottom-[clamp(7rem,16vh,10rem)] md:top-9 left-1/2 -translate-x-1/2 z-[500] w-full px-6 md:px-0 md:max-w-max pointer-events-none animate-in slide-in-from-bottom-8 md:slide-in-from-top-4 duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <div ref={alertRef} className="relative w-full max-w-[min(450px,90vw)] md:max-w-max mx-auto bg-[#0a0a0b]/98 backdrop-blur-3xl border border-white/10 p-3 md:px-5 md:py-2.5 rounded-2xl md:rounded-full flex items-start md:items-center gap-3 shadow-2xl transition-all duration-500 pointer-events-auto min-w-0">
              <AlertCircle className="w-3.5 h-3.5 text-red-500/80 shrink-0 mt-0.5 md:mt-0" />
              <div className="flex-1 flex items-start justify-between gap-4 min-w-0">
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.12em] md:tracking-[0.15em] text-white/70 leading-normal md:leading-none py-0.5 md:py-0 min-w-0 break-words">
                  {error}
                </span>
                <button 
                  onClick={() => setError(null)}
                  className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors font-black pr-1 shrink-0 mt-0.5 md:mt-0"
                >
                  ✕
                </button>
              </div>
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
            paddingTop: "env(safe-area-inset-top, 0px)",
            opacity: 0.85,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.05) 85%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
          }}
        />

        {/* Shared Top Controls */}
        <div className="absolute left-[clamp(1.25rem,6vw,3rem)] right-[clamp(1.25rem,6vw,3rem)] z-[100] flex justify-between items-center pointer-events-none"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + clamp(1.25rem, 5vh, 2.5rem))"
          }}
        >
          <div className="flex-1 flex items-center justify-start pointer-events-auto">
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

          {/* DYNAMIC BREADCRUMBS (CHRONOLOGICAL PROGRESS - CENTER ANCHOR) */}
          <div className="flex-1 hidden lg:flex items-center justify-center pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-1000 cubic-bezier(0.23,1,0.32,1)">
            {activeView === 'BOOKING' && activeStep === 1 && currentPhase > 1 && (
              <div className="flex items-center gap-6 bg-black/40 backdrop-blur-3xl px-8 py-2.5 rounded-full border border-white/5 shadow-2xl">
                {[
                  { id: 1, label: "Discover" },
                  { id: 2, label: "Timeline" },
                  { id: 3, label: "Guests" },
                  { id: 4, label: "Finalize" }
                ].map((step, index, array) => (
                  <Fragment key={step.id}>
                    <div className="flex items-center gap-2.5 group/step">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-700 border",
                        step.id === currentPhase ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110" : 
                        step.id < currentPhase ? "bg-white/30 text-white border-transparent" : "border-white/20 text-white/40"
                      )}>
                        {step.id < currentPhase ? <Check size={10} strokeWidth={3} /> : `0${step.id}`}
                      </div>
                      {step.id === currentPhase && (
                        <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white animate-in fade-in slide-in-from-left-2 duration-700">
                          {step.label}
                        </span>
                      )}
                    </div>
                    {index < array.length - 1 && (
                      <div className={cn(
                        "w-6 h-[1px] transition-all duration-1000",
                        step.id < currentPhase ? "bg-white/40" : "bg-white/10"
                      )} />
                    )}
                  </Fragment>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center justify-end gap-3 pointer-events-auto">
            {(canGoBack || internalCanGoBack) && (activeView !== 'BOOKING' || activeStep !== 3) && (
              <Magnetic>
                <div className="relative group block">
                  {/* iOS 26 Deep Shadow & Glow */}
                  <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
                  <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
                  <button 
                    onClick={handleBackAction} 
                    className="relative px-5 h-10 md:h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center gap-3 transition-all duration-500 hover:bg-white hover:text-black text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-90 group/backbtn"
                  >
                    <ArrowLeft size={18} strokeWidth={2.5} className="group-hover/backbtn:-translate-x-1 transition-transform" />
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 group-hover:text-black/70 transition-colors animate-in fade-in slide-in-from-right-2 duration-700">
                      {(() => {
                        // Contextual Source Mapping - Harmonized Site Terminology
                        const getOrigin = (src: string) => {
                          const s = src?.toUpperCase() || "";
                          if (s.includes("SERVICES")) return "Services";
                          if (s.includes("ABOUT")) return "About";
                          // CTA and HERO origins both map back to the main discovery flow
                          if (s.includes("CTA") || s.includes("HERO") || s.includes("DISCOVER")) return "Discover";
                          return "Discover";
                        };

                        // 1. Internal Booking Logic (Phases/Steps)
                        if (activeView === 'BOOKING') {
                          if (activeStep === 2) return "Finalize";
                          if (currentPhase > 1) {
                            const phaseLabels = bookingData 
                              ? ["", "Package", "Timeline", "Guests", "Finalize"] 
                              : ["", "Discovery", "Timeline", "Guests", "Finalize"];
                            return phaseLabels[currentPhase - 1];
                          }
                          if (history.length > 0) {
                            const prev = history[history.length - 1].view;
                            return prev === 'PACKAGE' ? "Package" : getOrigin(activeSource);
                          }
                        }

                        // 2. Global History Logic (Previous View)
                        if (history.length > 0) {
                          const prev = history[history.length - 1].view;
                          if (prev === 'PACKAGE') return "Package";
                          if (prev === 'SERVICES') return "Services";
                          if (prev === 'ABOUT') return "About";
                          if (prev === 'CTA') return "Join"; // Keep for internal modal transitions
                        }

                        // 3. Fallback to Site Origin based on Source
                        return getOrigin(activeSource);
                      })()}
                    </span>
                  </button>
                </div>
              </Magnetic>
            )}
            {activeView === 'PORTAL' && user && (
              <Magnetic>
                <div className="relative group block">
                  {/* iOS 26 Deep Shadow & Glow */}
                  <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
                  <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
                  <button 
                    onClick={() => signOut()}
                    className="relative px-5 h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center gap-2.5 transition-all duration-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/50 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-90"
                  >
                    <LogOut size={12} />
                    Logout
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
                  className="relative w-10 h-10 md:w-10 md:h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-500 hover:bg-white hover:text-black text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-90"
                >
                  <X size={20} strokeWidth={2.5} />
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
              openModal={openModal}
              onPhaseChange={setCurrentPhase}
              onStepChange={setActiveStep}
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

          {/* Traveler Portal Layer */}
          <div 
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu will-change-[opacity,transform] 
              ${activeView === 'PORTAL' 
                ? 'opacity-100 translate-x-0 z-10 pointer-events-auto scale-100' 
                : direction === 'forward' 
                  ? 'opacity-0 translate-x-24 z-0 pointer-events-none scale-[1.05]' 
                  : 'opacity-0 -translate-x-24 z-0 pointer-events-none scale-[0.95]'}`}
          >
            <PortalContent isActive={activeView === 'PORTAL'} onScroll={handleScroll} />
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
