"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Magnetic } from "../Magnetic";

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
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


export function Testimonials() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Chips animations — run ONCE on mount only
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Chips entrance pop-in (stripped Y-axis to prevent collision with parallax scroll loops later)
      gsap.fromTo(
        ".testimonial-chip",
        { opacity: 0, scale: 0.6 },
        {
          opacity: 1,
          scale: 1,
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
        force3D: true,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      });

      // Quote entrance timeline
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
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      ref={containerRef}
      id="testimonials"
      className="scroll-mt-0 w-full min-h-[100vh] flex items-center justify-center relative bg-transparent"
    >
      {/* ── Mobile Chips (3 chips) — safe positions, no overflow ── */}
      <div className="absolute inset-0 pointer-events-none z-[5] md:hidden">
        <div className="testimonial-chip will-change-transform absolute opacity-0 top-[18%] left-[4%] pointer-events-auto rotate-[-8deg]">
          <Magnetic>
            <div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>TIMELESS</div>
          </Magnetic>
        </div>
        <div className="testimonial-chip will-change-transform absolute opacity-0 top-[50%] right-[4%] pointer-events-auto rotate-[7deg]">
          <Magnetic>
            <div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)" }}>BESPOKE</div>
          </Magnetic>
        </div>
        <div className="testimonial-chip will-change-transform absolute opacity-0 top-[78%] left-[4%] pointer-events-auto rotate-[-6deg]">
          <Magnetic>
            <div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #fa709a, #fee140)" }}>PRESTIGE</div>
          </Magnetic>
        </div>
      </div>

      {/* ── Desktop Chips ── */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
        <div className="testimonial-chip will-change-transform absolute opacity-0 top-[12%] left-[4%] pointer-events-auto rotate-[-8deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>TIMELESS</div></Magnetic>
        </div>
        <div className="testimonial-chip will-change-transform absolute opacity-0 top-[18%] right-[5%] pointer-events-auto rotate-[6deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #f093fb, #f5576c)" }}>ELITE</div></Magnetic>
        </div>
        <div className="testimonial-chip will-change-transform absolute opacity-0 top-[52%] left-[3%] pointer-events-auto rotate-[-5deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)" }}>TAILORED</div></Magnetic>
        </div>
        <div className="testimonial-chip will-change-transform absolute opacity-0 top-[58%] right-[4%] pointer-events-auto rotate-[9deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)" }}>BESPOKE</div></Magnetic>
        </div>
        <div className="testimonial-chip will-change-transform absolute opacity-0 top-[80%] left-[5%] pointer-events-auto rotate-[4deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #fa709a, #fee140)" }}>PRESTIGE</div></Magnetic>
        </div>
        <div className="testimonial-chip will-change-transform absolute opacity-0 top-[78%] right-[5%] pointer-events-auto rotate-[-7deg]">
          <Magnetic><div className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-widest uppercase cursor-default select-none shadow-lg" style={{ background: "linear-gradient(135deg, #a18cd1, #fbc2eb)" }}>CURATED</div></Magnetic>
        </div>
      </div>

      {/* Main Quote Content */}
      <div className="max-w-[800px] mx-auto text-center relative z-10 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-14 text-8xl text-[#1d1d1f]/20 font-serif select-none pointer-events-none">
           &quot;
        </div>
        
        <p 
          key={`quote-${currentIndex}`}
          ref={textRef}
          className="text-3xl md:text-6xl font-medium tracking-tight leading-[1.1] will-change-transform text-[#1d1d1f]"
        >
          {TESTIMONIALS[currentIndex].quote}
        </p>

        {/* <div className="font-medium text-lg md:text-xl text-[#1d1d1f]/60">
          <p>{TESTIMONIALS[currentIndex].author}</p>
          <p className="text-sm">{TESTIMONIALS[currentIndex].role}</p>
        </div> */}

        {/* Minimal Progress Indicators */}
        <div className="absolute left-0 right-0 -bottom-16 flex justify-center gap-3">
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
                      ? "w-8 bg-[#1d1d1f]" 
                      : "w-4 bg-[#1d1d1f]/20 group-hover:bg-[#1d1d1f]/50 group-hover:w-6"
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
