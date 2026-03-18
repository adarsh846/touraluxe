"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Magnetic } from "../Magnetic";

const TESTIMONIALS = [
  {
    quote: <>We don’t sell trips.<br />We craft experiences.</>,
    author: "Elena R.",
    role: "Global CEO",
  },
  {
    quote: <>The world isn’t far.<br />It’s waiting.</>,
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance Animation (Horizontal)
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

      // Create a smooth crossfade effect for auto-play
      const tl = gsap.timeline();
      
      tl.to([textRef.current, authorRef.current], {
        opacity: 0,
        y: -10,
        duration: 0.5,
        ease: "power2.inOut",
      })
      .call(() => {
        // Wait for fade out to change text (React state will update)
      })
      .to([textRef.current, authorRef.current], {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.1,
      }, "+=0.1");

    }, containerRef);

    // Set up interval for auto-playing testimonials
    const interval = setInterval(() => {
      ctx.revert(); // Revert any ongoing animations before starting new one
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000); // 6s per slide

    return () => {
      clearInterval(interval);
      ctx.revert();
    };
  }, [currentIndex]); // Re-run effect when index changes to trigger animation

  return (
    <section 
      ref={containerRef}
      id="testimonials"
      className="scroll-mt-20 py-32 px-6 w-full bg-black text-white min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      <div className="max-w-[800px] mx-auto text-center relative z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-14 text-8xl text-white/20 font-serif select-none pointer-events-none">
           &quot;
        </div>
        
        <p 
          key={`quote-${currentIndex}`} // Force re-render for clean animation state
          ref={textRef}
          className="text-3xl md:text-6xl font-medium tracking-tight leading-[1.1] mb-12 will-change-transform text-[#f5f5f7]"
        >
          {TESTIMONIALS[currentIndex].quote}
        </p>

        {/* Author metadata - currently hidden per brand styling update
        <div 
          key={`author-${currentIndex}`}
          ref={authorRef}
          className="flex flex-col items-center gap-2 will-change-transform"
        >
          <span className="text-sm font-semibold tracking-widest uppercase">
            {TESTIMONIALS[currentIndex].author}
          </span>
          <span className="text-xs text-white/50 tracking-wider">
            {TESTIMONIALS[currentIndex].role}
          </span>
        </div>
        */}

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
