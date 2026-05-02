"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import Image from "next/image";
import { Magnetic } from "../Magnetic";
import { X } from "lucide-react";

export function CTA() {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        }
      });

      tl.to(".cta-word", {
        y: "0%",
        duration: 1.2,
        stagger: 0.08,
        ease: "power4.out",
      })
      .fromTo(
        ".cta-content",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "expo.out" },
        "-=0.8"
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
    setIsSubmitted(false);
    setIsScrolled(false);
    
    // Stop Lenis
    const lenis = (window as any).__lenis;
    lenis?.stop();

    // GSAP entrance
    setTimeout(() => {
      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current, 
        { opacity: 0, backdropFilter: "blur(0px)" }, 
        { opacity: 1, backdropFilter: "blur(20px)", duration: 1.0, ease: "power3.out" }
      );
      tl.fromTo(panelRef.current, 
        { y: 80, opacity: 0, scale: 0.96 }, 
        { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "expo.out" }, 
        0.1
      );
    }, 0);
  };

  const closeModal = useCallback(() => {
    const tl = gsap.timeline({ 
      onComplete: () => {
        setIsModalOpen(false);
        const lenis = (window as any).__lenis;
        lenis?.start();
      },
      defaults: { ease: "power4.inOut" }
    });
    tl.to(panelRef.current, { y: 40, opacity: 0, scale: 0.98, duration: 0.7 });
    tl.to(overlayRef.current, { opacity: 0, backdropFilter: "blur(0px)", duration: 0.5 }, 0.1);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    gsap.to(".modal-form", {
      opacity: 0, y: -10, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        setIsSubmitted(true);
        gsap.fromTo(
          ".success-message",
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "expo.out" }
        );
      },
    });
  };

  return (
    <>
      <section 
        ref={containerRef}
        id="contact"
        className="relative py-40 px-6 w-full text-[#1d1d1f] overflow-visible flex items-center justify-center min-h-[80vh] bg-transparent"
      >
        <div 
          ref={contentRef}
          className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-8"
        >
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] flex flex-wrap justify-center gap-x-[0.3em]">
            {"Ready to transcend the ordinary?".split(" ").map((word, i) => (
              <span key={i} className="overflow-hidden inline-flex pt-2 pb-1 -my-2">
                <span className="cta-word inline-block translate-y-[110%] will-change-transform text-[#1d1d1f]">
                  {word}
                </span>
              </span>
            ))}
          </h2>
          
          <p className="cta-content opacity-0 text-lg md:text-xl text-[#1d1d1f]/60 max-w-xl font-normal tracking-wide will-change-transform">
            Connect with our travel curators to design your next unparalleled experience.
          </p>

          <div className="cta-content opacity-0 will-change-transform">
            <Magnetic>
              <button
                onClick={openModal}
                className="mt-4 inline-block rounded-full bg-[#1d1d1f] px-8 py-4 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Begin Your Journey
              </button>
            </Magnetic>
          </div>
        </div>
      </section>

      {/* Improved Contact Modal - Portaled to Body Root to escape stacking contexts */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[999999]">
          <div 
            ref={overlayRef} 
            className="absolute inset-0 bg-black/98 md:bg-black/85 backdrop-blur-2xl" 
            onClick={closeModal} 
          />
          <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 pointer-events-none">
            <div 
              ref={panelRef} 
              data-lenis-prevent 
              className="relative w-full max-w-[920px] h-[90vh] bg-[#1c1c1e] border border-white/[0.06] rounded-3xl overflow-hidden pointer-events-auto shadow-2xl will-change-transform"
            >
              {/* iOS 26-style Hyper-Smooth Progressive Mask — Unified Proportions */}
              <div 
                className="pointer-events-none absolute top-0 left-0 right-0 h-24 md:h-32 transition-all duration-1000 backdrop-blur-[5px] z-[90]" 
                style={{
                  opacity: isScrolled ? 0.95 : 0.85,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.05) 85%, transparent 100%)",
                  maskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
                }}
              />

              {/* Top Controls */}
              <div className="absolute top-6 left-6 right-6 z-[100] flex justify-between items-center pointer-events-none">
                <div className="pointer-events-auto">
                  <Magnetic>
                    <div className="relative group will-change-transform">
                      {/* Multi-layered Shadow for Deep Floating Effect */}
                      <div className="absolute inset-0 bg-black/60 blur-2xl rounded-full translate-y-3 scale-95 opacity-80" />
                      <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
                      
                      <div className="relative flex items-center justify-center bg-white rounded-full w-28 h-10 overflow-hidden cursor-default transition-all duration-500 group-hover:scale-[1.05]">
                        <div className="relative w-28 h-10">
                          <Image
                            src="/assets/logo-transparent.webp"
                            alt="TouraLuxe Logo"
                            fill
                            priority
                            quality={75}
                            sizes="112px"
                            className="object-contain scale-[2.1] translate-y-[4px]"
                          />
                        </div>
                      </div>
                    </div>
                  </Magnetic>
                </div>
                
                <div className="pointer-events-auto">
                  <Magnetic>
                    <div className="relative group will-change-transform">
                      {/* Matching shadow for close button */}
                      <div className="absolute inset-0 bg-black/60 blur-xl rounded-full translate-y-2 scale-90 opacity-60" />
                      <button 
                        onClick={closeModal} 
                        className="relative w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all duration-500 hover:bg-white/10 text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </Magnetic>
                </div>
              </div>

              <div 
                ref={scrollRef} 
                onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 30)}
                className="w-full h-full overflow-y-auto scrollbar-hide"
              >
                {/* Hero Image */}
                <div className="relative w-full aspect-[4/3] md:aspect-[2.4/1] overflow-hidden bg-[#1c1c1e]">
                  <Image 
                    src="/private_jet_interior_sunset_1777656427557.png" 
                    alt="Private Jet Interior" 
                    fill 
                    className="object-cover scale-[1.01]" 
                    priority 
                  />
                  <div className="absolute inset-x-0 -bottom-px h-32 md:h-40 bg-gradient-to-t from-[#1c1c1e] to-transparent" />
                  
                  {/* Scroll Indicator */}
                  <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-50 transition-all duration-700 ${isScrolled ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white drop-shadow-md">Scroll</span>
                    <svg className="w-5 h-5 text-white drop-shadow-md" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 6l4 4 4-4" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 px-6 md:px-12 pb-20 md:pb-16 -mt-8 bg-[#1c1c1e] rounded-t-3xl">
                  {!isSubmitted ? (
                    <div className="max-w-xl mx-auto">
                      <div className="mb-8 md:mb-10 mt-10 text-center">
                        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">Curated Inquiry</span>
                        <h3 className="text-2xl md:text-4xl font-semibold tracking-tight text-white mt-2 leading-tight">Let&apos;s craft your experience.</h3>
                        <p className="text-sm md:text-base text-[#86868b] mt-3">Provide your details and our lead curators will reach out within 24 hours.</p>
                      </div>

                      <form onSubmit={handleSubmit} className="modal-form grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868b] ml-1">Full Name</label>
                          <input required type="text" placeholder="Your full name" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 md:py-4 text-sm md:text-[15px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868b] ml-1">Email Address</label>
                          <input required type="email" placeholder="your@email.com" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 md:py-4 text-sm md:text-[15px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all" />
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-2">
                          <label className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868b] ml-1">Dream Destination</label>
                          <input type="text" placeholder="e.g. Maldives, Swiss Alps, Amalfi Coast" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 md:py-4 text-sm md:text-[15px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all" />
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-2">
                          <label className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868b] ml-1">Your Vision</label>
                          <textarea rows={4} placeholder="Share your vision for the perfect trip..." className="w-full bg-white/[0.03] border border-white/10 rounded-3xl px-5 py-4 text-sm md:text-[15px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all resize-none" />
                        </div>
                        
                        <div className="md:col-span-2 pt-4 mb-12">
                          <Magnetic className="w-full">
                            <button type="submit" className="w-full py-4.5 md:py-5 rounded-full bg-white text-black font-bold text-sm md:text-[15px] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl">
                              Send Inquiry
                            </button>
                          </Magnetic>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="success-message flex flex-col items-center justify-center gap-6 py-20 text-center max-w-sm mx-auto">
                      <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-3xl font-semibold text-white tracking-tight">Inquiry Received</h3>
                        <p className="text-[#86868b] mt-3 leading-relaxed">Thank you. Your request is being prioritized. A curator will contact you shortly to begin the design process.</p>
                      </div>
                      <Magnetic>
                        <button onClick={closeModal} className="mt-4 px-10 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all mb-12">
                          Return to Site
                        </button>
                      </Magnetic>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
