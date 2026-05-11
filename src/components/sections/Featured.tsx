"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Magnetic } from "../Magnetic";
import { useBooking } from "../BookingProvider";
import { supabase } from "@/lib/supabase";
import { usePricing } from "@/hooks/usePricing";

gsap.registerPlugin(ScrollTrigger);

export function Featured() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openModal } = useBooking();
  const { computePrice } = usePricing();

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const { data, error } = await supabase
          .from("packages")
          .select("*")
          .eq("is_featured", true)
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .limit(5);

        if (error) throw error;
        setExperiences(data || []);
      } catch (err) {
        console.error("Failed to fetch featured journeys:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (isLoading || experiences.length === 0) return;

    const ctx = gsap.context(() => {
      // Title reveal
      gsap.fromTo(titleRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1.5, ease: "expo.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
          }
        }
      );

      // Card reveals
      itemsRef.current.forEach((item, index) => {
        if (!item) return;

        gsap.fromTo(item,
          { y: 100, x: index % 2 === 0 ? -60 : 60, opacity: 0 },
          {
            y: 0, x: 0, opacity: 1, duration: 1.8, ease: "expo.out",
            scrollTrigger: { trigger: item, start: "top 90%" }
          }
        );

        const img = item.querySelector("img");
        if (img) {
          gsap.set(img, { scale: 1.15, transformGpu: true });
          gsap.to(img, {
            yPercent: 12,
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

      ScrollTrigger.refresh();
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, experiences]);

  if (!isLoading && experiences.length === 0) return null;

  return (
    <section
      ref={containerRef}
      id="featured"
      className="relative z-10 py-32 px-6 w-full bg-[#0a0a0a] min-h-screen flex flex-col justify-center overflow-hidden"
    >
      <div className="max-w-[1200px] w-full mx-auto relative z-20">
        <h2
          ref={titleRef}
          className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-16 opacity-0"
        >
          Craft New Journey.
        </h2>

        <div className="flex flex-col gap-12 md:gap-24">
          {isLoading ? (
            // Shimmering Skeletons
            [1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col md:flex-row gap-8 items-center animate-pulse">
                <div className="w-full md:w-2/3 aspect-[4/3] rounded-2xl bg-white/5" />
                <div className="w-full md:w-1/3 space-y-4 p-4 md:p-8">
                  <div className="w-24 h-2 bg-white/10 rounded" />
                  <div className="w-48 h-8 bg-white/10 rounded" />
                  <div className="w-32 h-4 bg-white/10 rounded" />
                </div>
              </div>
            ))
          ) : (
            experiences.map((exp, index) => {
              const pricing = computePrice(exp);
              return (
                <div
                  key={exp.id}
                  ref={(el) => { itemsRef.current[index] = el; }}
                  className="group relative flex flex-col md:flex-row gap-8 items-center opacity-0 transform-gpu will-change-transform"
                >
                  {/* Image Container */}
                  <div className="relative w-full md:w-2/3 aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 transform-gpu will-change-transform">
                    <Image
                      src={exp.image}
                      alt={exp.title}
                      fill
                      className="object-cover will-change-transform transform-gpu"
                      quality={85}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 760px"
                    />
                  </div>

                  {/* Text Content */}
                  <div className="w-full md:w-1/3 flex flex-col items-start gap-4 p-4 md:p-8">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                      {exp.location}
                    </span>
                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                      {exp.title}
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base text-white/70 font-medium">
                          {pricing.formattedFinal} <span className="text-[10px] opacity-60 uppercase tracking-widest ml-1">/ Person</span>
                        </span>
                        {pricing.hasSavings && (
                          <span className="text-xs text-white/20 line-through">{pricing.formattedOriginal}</span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
                        {pricing.taxLabel}
                      </span>
                    </div>
                    <Magnetic>
                      <button
                        onClick={() => openModal('PACKAGE', exp)}
                        className="mt-6 border-b border-white/20 pb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white hover:border-white transition-all duration-700"
                      >
                        View Trip
                      </button>
                    </Magnetic>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
