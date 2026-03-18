"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Magnetic } from "../Magnetic";

export function Marquee() {
  const sectionRef = useRef<HTMLElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const row4Ref = useRef<HTMLDivElement>(null);
  const row5Ref = useRef<HTMLDivElement>(null);
  const row6Ref = useRef<HTMLDivElement>(null);
  const row7Ref = useRef<HTMLDivElement>(null);
  const row8Ref = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Row Animations
      const rows = [row1Ref, row2Ref, row3Ref, row4Ref, row5Ref, row6Ref, row7Ref, row8Ref];
      rows.forEach((ref, i) => {
        const direction = i % 2 === 0 ? -1 : 1;
        gsap.to(ref.current, {
          xPercent: 50 * direction,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });

      // Floating chips with optimized parallax
      gsap.to(".marquee-chip", {
        y: -150,
        rotate: 15,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-30 min-h-[400px] bg-black text-white w-full overflow-hidden flex flex-col justify-center gap-[clamp(1rem,3vw,3rem)] py-20 md:py-32"
    >
      {/* Row 1: Left */}
      <div ref={row1Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-50 select-none whitespace-nowrap gap-[4vw]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            <span>Explore</span><span className="text-outline-white">Discover</span><span>Journey</span><span className="text-outline-white">Wander</span><span>Roam</span><span className="text-outline-white">Venture</span><span>Navigate</span><span className="text-outline-white">FUN</span><span>Excellence</span><span className="text-outline-white">Adventure</span>
          </div>
        ))}
      </div>

      {/* Row 2: Right */}
      <div ref={row2Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-45 select-none whitespace-nowrap ml-[-25%] gap-[4vw]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            <span className="text-outline-white">Mountains</span><span>Oceans</span><span className="text-outline-white">Cities</span><span>Islands</span><span className="text-outline-white">Horizons</span><span>Landscapes</span><span className="text-outline-white">Destinations</span><span>Worlds</span><span className="text-outline-white">Discovery</span><span>Bespoke</span>
          </div>
        ))}
      </div>

      {/* Row 3: Left */}
      <div ref={row3Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-40 select-none whitespace-nowrap gap-[4vw]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            <span>Curated</span><span className="text-outline-white">Elite</span><span>Luxury</span><span className="text-outline-white">Sanctuary</span><span>Unseen</span><span className="text-outline-white">Boundless</span><span>Transcendent</span><span className="text-outline-white">Sovereign</span><span>Unrivaled</span><span className="text-outline-white">Grandeur</span>
          </div>
        ))}
      </div>

      {/* Row 4: Right */}
      <div ref={row4Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-40 select-none whitespace-nowrap ml-[-25%] gap-[4vw]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            <span className="text-outline-white">Navigate</span><span>FUN</span><span className="text-outline-white">Journey</span><span>Worlds</span><span className="text-outline-white">Explore</span><span>Discover</span><span className="text-outline-white">Venture</span><span>Islands</span><span className="text-outline-white">Legacy</span><span>Zenith</span>
          </div>
        ))}
      </div>

      {/* Row 5: Left */}
      <div ref={row5Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-35 select-none whitespace-nowrap gap-[4vw]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            <span>Mountains</span><span className="text-outline-white">Oceans</span><span>Landscapes</span><span className="text-outline-white">Horizons</span><span>Roaming</span><span className="text-outline-white">Wandering</span><span>Destinations</span><span className="text-outline-white">Cities</span><span>Global</span><span className="text-outline-white">Apex</span>
          </div>
        ))}
      </div>

      {/* Row 6: Right */}
      <div ref={row6Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-30 select-none whitespace-nowrap ml-[-25%] gap-[4vw]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            <span className="text-outline-white">Beyond</span><span>Unseen</span><span className="text-outline-white">Boundless</span><span>Transcendent</span><span className="text-outline-white">Sovereign</span><span>Elite</span><span className="text-outline-white">Luxury</span><span>Excellence</span><span className="text-outline-white">Heritage</span><span>Sanctuary</span>
          </div>
        ))}
      </div>

      {/* Row 7: Left */}
      <div ref={row7Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-25 select-none whitespace-nowrap gap-[4vw]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            <span>Roaming</span><span className="text-outline-white">Wandering</span><span>Destinations</span><span className="text-outline-white">Cities</span><span>Global</span><span className="text-outline-white">Apex</span><span>Mountains</span><span className="text-outline-white">Oceans</span><span>Landscapes</span><span className="text-outline-white">Horizons</span>
          </div>
        ))}
      </div>

      {/* Row 8: Right */}
      <div ref={row8Ref} className="flex items-center text-[clamp(1.2rem,8vw,10rem)] sm:text-[clamp(1.5rem,6vw,10rem)] font-bold uppercase leading-none -tracking-[0.02em] opacity-25 select-none whitespace-nowrap ml-[-25%] gap-[4vw]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-[4vw]">
            <span className="text-outline-white">Beyond</span><span>Unseen</span><span className="text-outline-white">Boundless</span><span>Transcendent</span><span className="text-outline-white">Sovereign</span><span>Elite</span><span className="text-outline-white">Luxury</span><span>Excellence</span><span className="text-outline-white">Heritage</span><span>Sanctuary</span>
          </div>
        ))}
      </div>

      {/* Floating Personality Chips (Magnetic + GSAP Style) */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {/* High Left */}
        <div className="absolute top-[15%] left-[8%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-blue-500 to-indigo-600 backdrop-blur-md px-[clamp(1rem,2vw,2rem)] py-[clamp(0.5rem,1vw,1rem)] rounded-full rotate-[-20deg] text-[clamp(1rem,1.5vw,2rem)] font-bold border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              Premium
            </div>
          </Magnetic>
        </div>

        {/* Mid Left */}
        <div className="absolute top-[48%] left-[4%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-sky-400 to-blue-500 backdrop-blur-md px-[clamp(1rem,1.5vw,1.5rem)] py-[clamp(0.5rem,1vw,1rem)] rounded-full rotate-[-25deg] text-[clamp(1rem,1.5vw,2rem)] font-bold border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              Beyond
            </div>
          </Magnetic>
        </div>

        {/* Low Left */}
        <div className="absolute top-[82%] left-[12%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-amber-500 to-orange-600 backdrop-blur-md px-[clamp(0.8rem,1.2vw,1.2rem)] py-[clamp(0.4rem,0.8vw,0.8rem)] rounded-full rotate-[8deg] text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              Elite
            </div>
          </Magnetic>
        </div>

        {/* Top Center-Right */}
        <div className="absolute top-[22%] left-[55%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-cyan-400 to-blue-600 backdrop-blur-md px-[clamp(1rem,1.5vw,1.5rem)] py-[clamp(0.5rem,1vw,1rem)] rounded-full rotate-[-6deg] text-[clamp(1rem,1.2vw,1.5rem)] font-bold border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              Discover
            </div>
          </Magnetic>
        </div>

        {/* Low Center-Left */}
        <div className="absolute top-[72%] left-[35%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-fuchsia-500 to-purple-600 backdrop-blur-md px-[clamp(1.2rem,2.5vw,2.5rem)] py-[clamp(0.6rem,1.2vw,1.2rem)] rounded-full rotate-[15deg] text-[clamp(1.2rem,2.2vw,3rem)] font-bold border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              Explore
            </div>
          </Magnetic>
        </div>

        {/* High Right */}
        <div className="absolute top-[12%] left-[82%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-emerald-500 to-teal-600 backdrop-blur-md px-[clamp(0.8rem,1.2vw,1.2rem)] py-[clamp(0.4rem,0.8vw,0.8rem)] rounded-full rotate-[12deg] text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              Exclusive
            </div>
          </Magnetic>
        </div>

        {/* Mid Right */}
        <div className="absolute top-[52%] left-[88%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-orange-500 to-red-600 backdrop-blur-md px-[clamp(1rem,1.5vw,1.5rem)] py-[clamp(0.5rem,1vw,1rem)] rounded-full rotate-[-11deg] text-[clamp(1rem,1.2vw,1.5rem)] font-bold border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              Bespoke
            </div>
          </Magnetic>
        </div>

        {/* Low Right */}
        <div className="absolute top-[88%] left-[74%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-rose-500 to-pink-600 backdrop-blur-md px-[clamp(0.8rem,1.2vw,1.2rem)] py-[clamp(0.4rem,0.8vw,0.8rem)] rounded-full rotate-[22deg] text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              Unseen
            </div>
          </Magnetic>
        </div>

        {/* LUXURY - Mid-Upper Center-Left */}
        <div className="absolute top-[32%] left-[25%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-yellow-400 to-amber-600 backdrop-blur-md px-[clamp(1rem,2vw,2rem)] py-[clamp(0.5rem,1vw,1rem)] rounded-full rotate-[10deg] text-[clamp(1.1rem,1.8vw,2.5rem)] font-bold border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              LUXURY
            </div>
          </Magnetic>
        </div>

        {/* FUN - Mid-Lower Left */}
        <div className="absolute top-[62%] left-[8%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-purple-400 to-pink-500 backdrop-blur-md px-[clamp(1.2rem,2.5vw,2.5rem)] py-[clamp(0.6rem,1.2vw,1.2rem)] rounded-full rotate-[-15deg] text-[clamp(1.2rem,2.2vw,3rem)] font-bold border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              FUN
            </div>
          </Magnetic>
        </div>

        {/* ADVENTURE - Very High Center */}
        <div className="absolute top-[5%] left-[42%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-emerald-400 to-teal-600 backdrop-blur-md px-[clamp(1rem,1.5vw,1.5rem)] py-[clamp(0.5rem,1vw,1rem)] rounded-full rotate-[5deg] text-[clamp(1rem,1.2vw,1.5rem)] font-bold border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              ADVENTURE
            </div>
          </Magnetic>
        </div>

        {/* WONDER - Very Low Center */}
        <div className="absolute top-[85%] left-[38%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-indigo-500 to-purple-800 backdrop-blur-md px-[clamp(1rem,2vw,2rem)] py-[clamp(0.5rem,1vw,1rem)] rounded-full rotate-[-8deg] text-[clamp(1.1rem,1.4vw,1.6rem)] font-bold border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              WONDER
            </div>
          </Magnetic>
        </div>

        {/* LEISURE - Mid-Upper Center-Right */}
        <div className="absolute top-[35%] left-[72%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-cyan-400 to-sky-600 backdrop-blur-md px-[clamp(1rem,1.5vw,1.5rem)] py-[clamp(0.5rem,1vw,1rem)] rounded-full rotate-[18deg] text-[clamp(1rem,1.3vw,1.8rem)] font-bold border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              LEISURE
            </div>
          </Magnetic>
        </div>

        {/* MOMENTS - Central Anchor */}
        <div className="absolute top-[50%] left-[48%] pointer-events-auto">
          <Magnetic>
            <div className="marquee-chip bg-gradient-to-br from-orange-400 to-rose-600 backdrop-blur-md px-[clamp(1rem,2vw,2rem)] py-[clamp(0.5rem,1vw,1rem)] rounded-full rotate-[-4deg] text-[clamp(1rem,1.8vw,2rem)] font-bold border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white cursor-pointer interactive">
              MOMENTS
            </div>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}