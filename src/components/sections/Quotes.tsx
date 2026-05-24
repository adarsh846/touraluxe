"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Magnetic } from "../Magnetic";
import { useSettings } from "@/hooks/useSettings";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_QUOTES = [
  {
    quote: <>We don&apos;t sell trips.<br />We craft experiences.</>,
    author: "Elena R.",
    role: "Global CEO",
  },
  {
    quote: <>The world isn&apos;t far.<br />It&apos;s waiting.</>,
    author: "Marcus T.",
    role: "Philanthropist",
  },
  {
    quote: <>Not just where you go.<br />How you experience it.</>,
    author: "Sarah J.",
    role: "Creative Director",
  },
];


export function Quotes() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { settings } = useSettings();

  const QUOTES = (settings.editorial_quotes && JSON.parse(settings.editorial_quotes).length > 0) 
    ? JSON.parse(settings.editorial_quotes) 
    : DEFAULT_QUOTES;

  // Chips animations — run ONCE on mount only
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cache chip elements once — avoids repeated querySelectorAll on every scroll tick
      const chips = containerRef.current
        ? Array.from(containerRef.current.querySelectorAll<HTMLElement>(".quote-chip"))
        : [];

      // Pre-promote all chips to GPU compositor layers before any animation
      chips.forEach(chip => gsap.set(chip, { force3D: true }));

      // Chips entrance pop-in
      gsap.fromTo(
        chips,
        { opacity: 0, scale: 0.6 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.12,
          force3D: true,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 72%",
          },
        }
      );

      // Chips parallax float
      gsap.to(chips, {
        y: -70,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      });

      // Quote entrance timeline
      if (textRef.current) textRef.current.style.willChange = "transform, opacity";
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
      tl.fromTo(
        textRef.current,
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1.5,
          ease: "expo.out",
          force3D: true,
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []); // ← runs once only

  // Quote crossfade — runs on each index change only
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.to(textRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.5,
        ease: "power2.inOut",
      })
      .call(() => {})
      .to(textRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.1,
      }, "+=0.1");
    }, containerRef);

    return () => ctx.revert();
  }, [currentIndex]); // ← runs on slide change only

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [QUOTES.length]);

  return (
    <section 
      ref={containerRef}
      id="quotes"
      className="scroll-mt-0 w-full min-h-screen-stable flex items-center justify-center relative bg-transparent"
    >
      {/* ── Mobile Chips (3 chips) — safe positions, no overflow ── */}
      <div className="absolute inset-0 pointer-events-none z-[5] md:hidden">
        <div className="quote-chip will-change-transform absolute opacity-0 top-[18%] left-[4%] pointer-events-auto rotate-[-8deg]">
          <Magnetic>
            <div className="px-4 py-2 rounded-full text-black text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #a1c4fd, #c2e9fb)" }}>TIMELESS</div>
          </Magnetic>
        </div>
        <div className="quote-chip will-change-transform absolute opacity-0 top-[50%] right-[4%] pointer-events-auto rotate-[7deg]">
          <Magnetic>
            <div className="px-4 py-2 rounded-full text-black text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)" }}>BESPOKE</div>
          </Magnetic>
        </div>
        <div className="quote-chip will-change-transform absolute opacity-0 top-[78%] left-[4%] pointer-events-auto rotate-[-6deg]">
          <Magnetic>
            <div className="px-4 py-2 rounded-full text-black text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #fa709a, #fee140)" }}>PRESTIGE</div>
          </Magnetic>
        </div>
      </div>

      {/* ── Desktop Chips ── */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
        <div className="quote-chip will-change-transform absolute opacity-0 top-[12%] left-[4%] pointer-events-auto rotate-[-8deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-black text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #a1c4fd, #c2e9fb)" }}>TIMELESS</div></Magnetic>
        </div>
        <div className="quote-chip will-change-transform absolute opacity-0 top-[18%] right-[5%] pointer-events-auto rotate-[6deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-black text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #ff9a9e, #fecfef)" }}>ELITE</div></Magnetic>
        </div>
        <div className="quote-chip will-change-transform absolute opacity-0 top-[52%] left-[3%] pointer-events-auto rotate-[-5deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-black text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #89f7fe, #66a6ff)" }}>TAILORED</div></Magnetic>
        </div>
        <div className="quote-chip will-change-transform absolute opacity-0 top-[58%] right-[4%] pointer-events-auto rotate-[9deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-black text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)" }}>BESPOKE</div></Magnetic>
        </div>
        <div className="quote-chip will-change-transform absolute opacity-0 top-[80%] left-[5%] pointer-events-auto rotate-[4deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-black text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #fa709a, #fee140)" }}>PRESTIGE</div></Magnetic>
        </div>
        <div className="quote-chip will-change-transform absolute opacity-0 top-[78%] right-[5%] pointer-events-auto rotate-[-7deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-black text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #a18cd1, #fbc2eb)" }}>CURATED</div></Magnetic>
        </div>
      </div>

      {/* Main Quote Content */}
      <div className="max-w-[800px] mx-auto text-center relative z-10 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 text-9xl text-white/5 font-serif select-none pointer-events-none">
           &quot;
        </div>
        
        <p 
          key={`quote-${currentIndex}`}
          ref={textRef}
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          className="text-4xl md:text-7xl font-light italic tracking-tight leading-[1.1] will-change-transform text-black whitespace-pre-wrap"
        >
          {typeof QUOTES[currentIndex] === 'string' 
            ? QUOTES[currentIndex] 
            : QUOTES[currentIndex]?.quote || "The world is waiting. It's time to explore."}
        </p>

        {/* Minimal Progress Indicators */}
        <div className="absolute left-0 right-0 -bottom-16 flex justify-center gap-3">
          {QUOTES.map((_: any, idx: number) => (
            <Magnetic key={idx}>
              <button
                onClick={() => setCurrentIndex(idx)}
                className="group py-2 px-1 focus:outline-none"
                aria-label={`Go to quote ${idx + 1}`}
              >
                <div 
                  className={`h-px transition-all duration-500 ease-out ${
                    idx === currentIndex 
                      ? "w-8 bg-black" 
                      : "w-4 bg-black/20 group-hover:bg-black/50 group-hover:w-6"
                  }`}
                />
              </button>
            </Magnetic>
          ))}
        </div>
      </div>
    </section>
  );
}
