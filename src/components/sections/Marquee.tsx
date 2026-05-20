"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Magnetic } from "../Magnetic";
import { useSettings } from "@/hooks/useSettings";

export function Marquee() {
  const sectionRef = useRef<HTMLElement>(null);
  const { settings } = useSettings();
  
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const row4Ref = useRef<HTMLDivElement>(null);
  const row5Ref = useRef<HTMLDivElement>(null);
  const row6Ref = useRef<HTMLDivElement>(null);
  const row7Ref = useRef<HTMLDivElement>(null);
  const row8Ref = useRef<HTMLDivElement>(null);

  const marqueeWords = settings.marquee_words ? settings.marquee_words.split(',') : [
    "Explore", "Discover", "Journey", "Wander", "Roam", "Venture", "Navigate", "FUN", "Excellence", "Adventure",
    "Mountains", "Oceans", "Cities", "Islands", "Horizons", "Landscapes", "Destinations", "Worlds", "Bespoke",
    "Curated", "Elite", "Luxury", "Sanctuary", "Unseen", "Boundless", "Transcendent", "Supreme", "Unrivaled", "Grandeur"
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Row Animations Consolidatied into a Single Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      const rows = [row1Ref, row2Ref, row3Ref, row4Ref, row5Ref, row6Ref, row7Ref, row8Ref];
      rows.forEach((ref, i) => {
        const direction = i % 2 === 0 ? -1 : 1;
        tl.to(ref.current, {
          xPercent: 50 * direction,
          ease: "none",
          force3D: true,
        }, 0); // All start at 0 (concurrently)
        
        // Promote to GPU layer
        gsap.set(ref.current, { willChange: "transform" });
      });

      // Chips: set invisible initially without y mutation
      gsap.set(".marquee-chip", { opacity: 0, scale: 0.6 });

      // Chips: pop-in entrance
      gsap.to(".marquee-chip", {
        opacity: 1,
        scale: 1,
        duration: 0.85,
        ease: "expo.out",
        stagger: 0.1,
        force3D: true,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          once: true,
        },
      });

      // Chips: parallax float after pop-in
      gsap.to(".marquee-chip", {
        y: -150,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-30 min-h-[400px] bg-black text-white w-full overflow-hidden flex flex-col justify-center gap-[clamp(1rem,3vw,3rem)] py-20 md:py-32 -mt-[1px]"
    >
      {/* Row 1: Left */}
      <div ref={row1Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-50 select-none whitespace-nowrap gap-[4vw] transform-gpu">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            {marqueeWords.slice(0, 10).map((word, idx) => (
              <span key={idx} className={idx % 2 !== 0 ? "text-outline-white" : ""}>{word}</span>
            ))}
          </div>
        ))}
      </div>

      {/* Row 2: Right */}
      <div ref={row2Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-45 select-none whitespace-nowrap ml-[-25%] gap-[4vw] transform-gpu">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            {marqueeWords.slice(10, 20).map((word, idx) => (
              <span key={idx} className={idx % 2 === 0 ? "text-outline-white" : ""}>{word}</span>
            ))}
          </div>
        ))}
      </div>

      {/* Row 3: Left */}
      <div ref={row3Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-40 select-none whitespace-nowrap gap-[4vw] transform-gpu">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            {marqueeWords.slice(20, 30).map((word, idx) => (
              <span key={idx} className={idx % 2 !== 0 ? "text-outline-white" : ""}>{word}</span>
            ))}
          </div>
        ))}
      </div>

      {/* Row 4: Right */}
      <div ref={row4Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-40 select-none whitespace-nowrap ml-[-25%] gap-[4vw] transform-gpu">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            {marqueeWords.slice(0, 10).reverse().map((word, idx) => (
              <span key={idx} className={idx % 2 === 0 ? "text-outline-white" : ""}>{word}</span>
            ))}
          </div>
        ))}
      </div>

      {/* Row 5: Left */}
      <div ref={row5Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-35 select-none whitespace-nowrap gap-[4vw] transform-gpu">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            {marqueeWords.slice(10, 20).reverse().map((word, idx) => (
              <span key={idx} className={idx % 2 !== 0 ? "text-outline-white" : ""}>{word}</span>
            ))}
          </div>
        ))}
      </div>

      {/* Row 6: Right */}
      <div ref={row6Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-30 select-none whitespace-nowrap ml-[-25%] gap-[4vw] transform-gpu">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            {marqueeWords.slice(20, 30).reverse().map((word, idx) => (
              <span key={idx} className={idx % 2 === 0 ? "text-outline-white" : ""}>{word}</span>
            ))}
          </div>
        ))}
      </div>

      {/* Row 7: Left */}
      <div ref={row7Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-25 select-none whitespace-nowrap gap-[4vw] transform-gpu">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            <span>Roaming</span><span className="text-outline-white">Wandering</span><span>Destinations</span><span className="text-outline-white">Cities</span><span>Global</span><span className="text-outline-white">Apex</span><span>Mountains</span><span className="text-outline-white">Oceans</span><span>Landscapes</span><span className="text-outline-white">Horizons</span>
          </div>
        ))}
      </div>

      {/* Row 8: Right */}
      <div ref={row8Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-25 select-none whitespace-nowrap ml-[-25%] gap-[4vw] transform-gpu">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            <span className="text-outline-white">Beyond</span><span>Unseen</span><span className="text-outline-white">Boundless</span><span>Transcendent</span><span className="text-outline-white">Supreme</span><span>Elite</span><span className="text-outline-white">Luxury</span><span>Excellence</span><span className="text-outline-white">Heritage</span><span>Sanctuary</span>
          </div>
        ))}
      </div>

      {/* ── Mobile Chips (6 chips, 3×2 grid) — shown only on small screens ── */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden md:hidden">

        {/* Row 1 */}
        <div className="marquee-chip absolute top-[18%] left-[4%] pointer-events-auto rotate-[11deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-2 rounded-full  text-xs font-bold border border-white/20 shadow-lg text-white cursor-pointer">
              PREMIUM
            </div>
          </Magnetic>
        </div>
        <div className="marquee-chip absolute top-[20%] right-[4%] pointer-events-auto rotate-[-14deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-emerald-400 to-teal-600 px-4 py-2 rounded-full  text-xs font-bold border border-white/20 shadow-lg text-white cursor-pointer">
              LUXURY
            </div>
          </Magnetic>
        </div>

        {/* Row 2 */}
        <div className="marquee-chip absolute top-[46%] left-[4%] pointer-events-auto rotate-[-8deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 px-4 py-2 rounded-full  text-xs font-bold border border-white/20 shadow-lg text-white cursor-pointer">
              FUN
            </div>
          </Magnetic>
        </div>
        <div className="marquee-chip absolute top-[48%] right-[4%] pointer-events-auto rotate-[18deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 px-4 py-2 rounded-full  text-xs font-bold border border-white/20 shadow-lg text-white cursor-pointer">
              DISCOVER
            </div>
          </Magnetic>
        </div>

        {/* Row 3 */}
        <div className="marquee-chip absolute top-[74%] left-[4%] pointer-events-auto rotate-[-21deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-4 py-2 rounded-full  text-xs font-bold border border-white/20 shadow-lg text-white cursor-pointer">
              ELITE
            </div>
          </Magnetic>
        </div>
        <div className="marquee-chip absolute top-[76%] right-[4%] pointer-events-auto rotate-[7deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 px-4 py-2 rounded-full  text-xs font-bold border border-white/20 shadow-lg text-white cursor-pointer">
              WONDER
            </div>
          </Magnetic>
        </div>

      </div>

      {/* ── Desktop Chips (12 chips, 3×4 grid) — hidden on mobile ── */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden hidden md:block">

        {/* ── ROW 1 (top: 8–14%) ── */}
        <div className="marquee-chip absolute top-[8%] left-[5%] pointer-events-auto rotate-[-15deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              PREMIUM
            </div>
          </Magnetic>
        </div>

        <div className="marquee-chip absolute top-[10%] left-[44%] pointer-events-auto rotate-[24deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-emerald-400 to-teal-600 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              ADVENTURE
            </div>
          </Magnetic>
        </div>

        <div className="marquee-chip absolute top-[8%] right-[6%] pointer-events-auto rotate-[-28deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              EXCLUSIVE
            </div>
          </Magnetic>
        </div>

        {/* ── ROW 2 (top: 30–38%) ── */}
        <div className="marquee-chip absolute top-[30%] left-[18%] pointer-events-auto rotate-[13deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-yellow-400 to-amber-600 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              LUXURY
            </div>
          </Magnetic>
        </div>

        <div className="marquee-chip absolute top-[34%] left-[56%] pointer-events-auto rotate-[-7deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              DISCOVER
            </div>
          </Magnetic>
        </div>

        <div className="marquee-chip absolute top-[32%] right-[5%] pointer-events-auto rotate-[32deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-cyan-400 to-sky-600 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              LEISURE
            </div>
          </Magnetic>
        </div>

        {/* ── ROW 3 (top: 56–64%) ── */}
        <div className="marquee-chip absolute top-[56%] left-[5%] pointer-events-auto rotate-[-20deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              FUN
            </div>
          </Magnetic>
        </div>

        <div className="marquee-chip absolute top-[58%] left-[44%] pointer-events-auto rotate-[8deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-orange-400 to-rose-600 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              MOMENTS
            </div>
          </Magnetic>
        </div>

        <div className="marquee-chip absolute top-[60%] right-[6%] pointer-events-auto rotate-[-12deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              BESPOKE
            </div>
          </Magnetic>
        </div>

        {/* ── ROW 4 (top: 82–88%) ── */}
        <div className="marquee-chip absolute top-[82%] left-[14%] pointer-events-auto rotate-[19deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              ELITE
            </div>
          </Magnetic>
        </div>

        <div className="marquee-chip absolute top-[84%] left-[46%] pointer-events-auto rotate-[25deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-700 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              WONDER
            </div>
          </Magnetic>
        </div>

        <div className="marquee-chip absolute top-[82%] right-[6%] pointer-events-auto rotate-[-26deg]">
          <Magnetic>
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 px-5 py-2.5 rounded-full  text-sm font-bold border border-white/20 shadow-xl text-white cursor-pointer">
              BEYOND
            </div>
          </Magnetic>
        </div>

      </div>
    </section>
  );
}
