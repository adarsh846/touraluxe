"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Image from "next/image";
import { Magnetic } from "../Magnetic";

const EXPERIENCES = [
  {
    id: 1,
    title: "Alpine Chalet Retreat",
    location: "Swiss Alps",
    image: "/assets/chalet.jpg",
  },
  {
    id: 2,
    title: "Coastal Villa Mastery",
    location: "Amalfi Coast, Italy",
    image: "/assets/villa.jpg",
  },
  {
    id: 3,
    title: "Private Island Sanctuary",
    location: "Baa Atoll, Maldives",
    image: "/assets/island.jpg",
  },
];

export function Featured() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title reveal
      gsap.fromTo(titleRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, ease: "expo.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
          }
        }
      );

      // Items slide-in with alternating horizontal movement
      itemsRef.current.forEach((item, index) => {
        if (!item) return;
        
        // Initial reveal
        gsap.fromTo(
          item,
          { 
            y: 100,
            x: index % 2 === 0 ? -60 : 60,
            opacity: 0,
          },
          {
            y: 0,
            x: 0,
            opacity: 1,
            duration: 1.8,
            ease: "expo.out",
            scrollTrigger: {
              trigger: item,
              start: "top 90%",
            },
          }
        );

        // Sublayer parallax on the image internal
        const img = item.querySelector("img");
        if (img) {
          // Add initial scale to give room for parallax movement
          gsap.set(img, { scale: 1.15 });

          gsap.to(img, {
            yPercent: 10,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            }
          });
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      id="experiences"
      className="relative z-10 py-32 px-6 w-full bg-[#fafafa] dark:bg-[#0a0a0a] min-h-screen flex flex-col justify-center"
    >
      <div className="max-w-[1200px] w-full mx-auto">
        <h2 
          ref={titleRef}
          className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-16 opacity-0"
        >
          Curated Experiences.
        </h2>

        <div className="flex flex-col gap-12 md:gap-24">
          {EXPERIENCES.map((exp, index) => (
            <div 
              key={exp.id}
              ref={(el) => { itemsRef.current[index] = el; }}
              className="group relative flex flex-col md:flex-row gap-8 items-center opacity-0 will-change-transform"
            >
              {/* Image Container with strict hover constraints */}
              <div className="relative w-full md:w-2/3 aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5">
                <Image
                  src={exp.image}
                  alt={exp.title}
                  fill
                  className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              </div>

              {/* Text Content */}
              <div className="w-full md:w-1/3 flex flex-col items-start gap-4 p-4 md:p-8">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {exp.location}
                </span>
                <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground">
                  {exp.title}
                </h3>
                <Magnetic>
                  <button className="mt-4 border-b border-foreground/30 pb-1 text-sm font-medium transition-colors hover:border-foreground uppercase tracking-wider text-muted hover:text-foreground">
                    View Details
                  </button>
                </Magnetic>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}