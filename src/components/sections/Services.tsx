"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Magnetic } from "../Magnetic";

const SERVICES = [
  { title: "Luxury Travel", desc: "Access the inaccessible. Private villas, chartered yachts, and elite retreats." },
  { title: "Sports Tours", desc: "VIP access, best seats, and exclusive backstage experiences at major events." },
  { title: "MICE Events", desc: "Corporate getaways, incentive programs, and world-class meetings." },
  { title: "Global Retreats", desc: "Hand-picked, life-changing wellness and cultural immersions." },
];

export function Services() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header reveal (Horizontal)
      gsap.fromTo(
        ".services-header > *",
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1.5,
          ease: "expo.out",
          stagger: 0.2,
          scrollTrigger: {
            trigger: ".services-header",
            start: "top 85%",
          },
        }
      );

      // Staggered reveal for service cards (Alternating horizontal entrance)
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { 
            y: 40,
            x: index % 2 === 0 ? -30 : 30, // Subtle horizontal nudge
            opacity: 0,
            scale: 0.98,
          },
          {
            y: 0,
            x: 0,
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      id="services"
      className="scroll-mt-20 pt-10 pb-20 md:pt-16 md:pb-32 px-6 w-full bg-black text-foreground min-h-screen flex flex-col items-center overflow-hidden"
    >
      <div className="max-w-[1200px] w-full mx-auto">
        <div className="services-header mb-20 max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6 opacity-0">
            Beyond First Class.
          </h2>
          <p className="text-lg md:text-xl text-muted tracking-wide opacity-0">
            Our specialized divisions cater to every facet of high-end lifestyle and corporate excellence.
          </p>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {SERVICES.map((service, index) => (
          <div
            key={service.title}
            ref={(el) => {
              cardsRef.current[index] = el;
            }}
            className="opacity-0 h-full"
          >
            <Magnetic>
              <div
                className="group h-full p-8 pt-12 border border-white/10 rounded-2xl bg-zinc-900 transition-colors hover:bg-zinc-800 will-change-transform cursor-pointer"
              >
                <h3 className="text-xl font-medium tracking-tight mb-4">
                  {service.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {service.desc}
                </p>
              </div>
            </Magnetic>
          </div>
        ))}
      </div>
    </div>
  </section>
  );
}