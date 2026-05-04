"use client";

import { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Magnetic } from "../Magnetic";

export const CtaContent = memo(function CtaContent({ isActive, onScroll, startClosing }: { isActive: boolean, onScroll: (scrolled: boolean) => void, startClosing: () => void }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      setIsSubmitted(false);
    }
  }, [isActive]);

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
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <div 
        ref={scrollRef} 
        onScroll={(e) => onScroll(e.currentTarget.scrollTop > 30)}
        className="flex-1 w-full overflow-y-auto scrollbar-hide overscroll-behavior-contain transform-gpu"
        data-lenis-prevent
      >
        <div 
          className={`w-full flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu ${isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'}`}
        >
          {/* Hero Image */}
        <div className="relative w-full aspect-[4/3] md:aspect-[2.4/1] overflow-hidden bg-[#0a0a0b]">
          <Image 
            src="/private_jet_interior_sunset_1777656427557.png" 
            alt="Private Jet Interior" 
            fill 
            className="object-cover scale-[1.01] opacity-70 grayscale-[0.2]" 
            priority 
          />
          {/* Hyper-Smooth Progressive Blend */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0a0b]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-50 transition-all duration-700">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white drop-shadow-md">Scroll</span>
            <svg className="w-5 h-5 text-white drop-shadow-md" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-[clamp(1.25rem,6vw,3rem)] pb-32 md:pb-24 -mt-8 bg-[#0a0a0b] rounded-t-3xl">
          {!isSubmitted ? (
            <div className="max-w-xl mx-auto">
              <div className="mb-8 md:mb-10 mt-10 text-center px-4">
                <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">Curated Inquiry</span>
                <h3 className="text-[clamp(1.5rem,5vw,2.25rem)] font-semibold tracking-tight text-white mt-2 leading-tight">Let&apos;s craft your experience.</h3>
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
              <button onClick={() => startClosing()} className="px-12 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-[10px] rounded-full hover:bg-white hover:text-black transition-all">Close Window</button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
});
