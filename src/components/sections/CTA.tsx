"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Image from "next/image";
import { Magnetic } from "../Magnetic";
import { useBooking } from "../BookingProvider";
import { useSettings } from "@/hooks/useSettings";

export function CTA() {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { openModal } = useBooking();
  const { settings } = useSettings();

  const title = settings.cta_title || "Ready to transcend the ordinary?";
  const description = settings.cta_description || "Connect with our travel curators to design your next unparalleled experience.";
  const buttonText = settings.cta_button_text || "Begin Your Journey";

  useEffect(() => {
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

  return (
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
          {title.split(" ").map((word, i) => (
            <span key={i} className="overflow-hidden inline-flex pt-2 pb-1 -my-2">
              <span className="cta-word inline-block translate-y-[110%] will-change-transform text-[#1d1d1f]">
                {word}
              </span>
            </span>
          ))}
        </h2>
        
        <p className="cta-content opacity-0 text-lg md:text-xl text-[#1d1d1f]/60 max-w-xl font-normal tracking-wide will-change-transform whitespace-pre-wrap">
          {description}
        </p>

        <div className="cta-content opacity-0 will-change-transform">
          <Magnetic>
            <button
              onClick={() => openModal('CTA')}
              className="mt-4 inline-block rounded-full bg-[#1d1d1f] px-8 py-4 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {buttonText}
            </button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}

