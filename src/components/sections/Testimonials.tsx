"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Magnetic } from "../Magnetic";

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
  {
    quote: <>We don't sell trips.<br />We craft experiences.</>,
    author: "Elena R.",
    role: "Global CEO",
  },
  {
    quote: <>The world isn't far.<br />It's waiting.</>,
    author: "Marcus T.",
    role: "Philanthropist",
  },
  {
    quote: <>Not just where you go.<br />How you experience it.</>,
    author: "Sarah J.",
    role: "Creative Director",
  },
];


export function Testimonials() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const authorRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Chips animations — run ONCE on mount only
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Chips entrance pop-in
      gsap.fromTo(
        ".testimonial-chip",
        { opacity: 0, scale: 0.6, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 72%",
          },
        }
      );

      // Chips parallax float
      gsap.to(".testimonial-chip", {
        y: -70,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.8,
        },
      });

      // Quote entrance on scroll
      gsap.fromTo(
        [textRef.current, authorRef.current],
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1.5,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []); // ← runs once only

  // Quote crossfade — runs on each index change only
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.to([textRef.current, authorRef.current], {
        opacity: 0,
        y: -10,
        duration: 0.5,
        ease: "power2.inOut",
      })
      .call(() => {})
      .to([textRef.current, authorRef.current], {
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
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      ref={containerRef}
      id="testimonials"
      className="scroll-mt-20 py-32 px-6 w-full bg-black text-white min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* ── Mobile Chips (3 chips) — safe positions, no overflow ── */}
      <div className="absolute inset-0 pointer-events-none z-0 md:hidden">
        <div className="testimonial-chip absolute opacity-0 top-[18%] left-[4%] pointer-events-auto rotate-[-8deg]">
          <Magnetic>
            <div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>TIMELESS</div>
          </Magnetic>
        </div>
        <div className="testimonial-chip absolute opacity-0 top-[50%] right-[4%] pointer-events-auto rotate-[7deg]">
          <Magnetic>
            <div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)" }}>BESPOKE</div>
          </Magnetic>
        </div>
        <div className="testimonial-chip absolute opacity-0 top-[78%] left-[4%] pointer-events-auto rotate-[-6deg]">
          <Magnetic>
            <div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #fa709a, #fee140)" }}>PRESTIGE</div>
          </Magnetic>
        </div>
      </div>

      {/* ── Desktop Chips (6 chips) — full layout ── */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
        <div className="testimonial-chip absolute opacity-0 top-[12%] left-[4%] pointer-events-auto rotate-[-8deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>TIMELESS</div></Magnetic>
        </div>
        <div className="testimonial-chip absolute opacity-0 top-[18%] right-[5%] pointer-events-auto rotate-[6deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #f093fb, #f5576c)" }}>ELITE</div></Magnetic>
        </div>
        <div className="testimonial-chip absolute opacity-0 top-[52%] left-[3%] pointer-events-auto rotate-[-5deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)" }}>TAILORED</div></Magnetic>
        </div>
        <div className="testimonial-chip absolute opacity-0 top-[58%] right-[4%] pointer-events-auto rotate-[9deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)" }}>BESPOKE</div></Magnetic>
        </div>
        <div className="testimonial-chip absolute opacity-0 top-[80%] left-[5%] pointer-events-auto rotate-[4deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #fa709a, #fee140)" }}>PRESTIGE</div></Magnetic>
        </div>
        <div className="testimonial-chip absolute opacity-0 top-[78%] right-[5%] pointer-events-auto rotate-[-7deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #a18cd1, #fbc2eb)" }}>CURATED</div></Magnetic>
        </div>
      </div>

      {/* Main Quote Content */}
      <div className="max-w-[800px] mx-auto text-center relative z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-14 text-8xl text-white/20 font-serif select-none pointer-events-none">
           &quot;
        </div>
        
        <p 
          key={`quote-${currentIndex}`}
          ref={textRef}
          className="text-3xl md:text-6xl font-medium tracking-tight leading-[1.1] mb-12 will-change-transform text-[#f5f5f7]"
        >
          {TESTIMONIALS[currentIndex].quote}
        </p>

        {/* Minimal Progress Indicators */}
        <div className="flex justify-center gap-3 mt-16">
          {TESTIMONIALS.map((_, idx) => (
            <Magnetic key={idx}>
              <button
                onClick={() => setCurrentIndex(idx)}
                className="group py-2 px-1 focus:outline-none"
                aria-label={`Go to testimonial ${idx + 1}`}
              >
                <div 
                  className={`h-px transition-all duration-500 ease-out ${
                    idx === currentIndex 
                      ? "w-8 bg-white" 
                      : "w-4 bg-white/20 group-hover:bg-white/50 group-hover:w-6"
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
