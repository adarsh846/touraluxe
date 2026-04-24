"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Magnetic } from "../Magnetic";

const SERVICES = [
  {
    title: "Luxury Travel",
    desc: "Access the inaccessible. Private villas, chartered yachts, and elite retreats.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
  },
  {
    title: "Sports Tours",
    desc: "VIP access, best seats, and exclusive backstage experiences at major events.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    title: "MICE Events",
    desc: "Corporate getaways, incentive programs, and world-class meetings.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h10" /><path d="M7 12h10" /><path d="M7 17h10" />
      </svg>
    ),
  },
  {
    title: "Global Retreats",
    desc: "Hand-picked, life-changing wellness and cultural immersions.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
      </svg>
    ),
  },
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
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6 opacity-0 will-change-transform">
            Beyond First Class.
          </h2>
          <p className="text-lg md:text-xl text-muted tracking-wide opacity-0 will-change-transform">
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
              className="opacity-0 h-full will-change-transform"
            >
              <Magnetic className="block w-full h-full">
                <div
                  className="group relative h-full p-8 pt-10 border border-white/10 rounded-2xl bg-zinc-900 transition-all duration-500 hover:bg-zinc-800 hover:border-white/20 will-change-transform cursor-pointer overflow-hidden"
                >
                  {/* Hover gradient glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
                    style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 60%)" }}
                  />

                  {/* Icon */}
                  <div className="mb-6 text-white/30 group-hover:text-white/70 transition-all duration-500 group-hover:translate-y-[-2px]">
                    {service.icon}
                  </div>

                  <h3 className="text-xl font-medium tracking-tight mb-4">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {service.desc}
                  </p>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/20 transition-all duration-700" />
                </div>
              </Magnetic>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}