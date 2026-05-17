"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Magnetic } from "../Magnetic";
import { Plane } from "lucide-react";
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
              <div key={i} className="flex flex-col md:flex-row gap-8 items-center animate-pulse transform-gpu" style={{ transform: "translate3d(0,0,0)" }}>
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
              const isEven = index % 2 === 0;
              
              // Custom poetical quotes based on the experience
              const poeticalQuotes: Record<number, string> = {
                1: "A choreographed sanctuary for seekers of secluded luxury and high-altitude perspective.",
                2: "A grand collective crossing of high mountain chains and untamed wild country.",
                3: "A precision climbing logistics expedition to the absolute edge of high solitude.",
                4: "An immortal honeymoon designed to capture absolute romantic perfection.",
                5: "A seamless, strategic alignment of world-class corporate gatherings and retreats.",
                6: "A fully custom vintage journey tailored meticulously to your absolute desires.",
                7: "A generative real-time digital itinerary crafted by TouraLuxe intelligence."
              };
              const quote = poeticalQuotes[exp.id] || "A bespoke sanctuary designed to deliver absolute comfort and pristine memories.";

              return (
                <div
                  key={exp.id}
                  ref={(el) => { if (el) itemsRef.current[index] = el; }}
                  className={`group relative flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-20 items-center opacity-0 transform-gpu`}
                  style={{ transform: "translate3d(0,0,0)" }}
                >
                  {/* Image Container — Stable gold-bordered card that scales image cleanly */}
                  <div className="relative w-full md:w-3/5 aspect-[4/3] rounded-[2.5rem] border border-white/10 group-hover:border-amber-400/80 bg-[#0a0a0b] overflow-hidden transform-gpu transition-all duration-700 shadow-2xl group-hover:shadow-[0_0_60px_rgba(251,191,36,0.12)]">
                    <Image
                      src={exp.image}
                      alt={exp.title}
                      fill
                      className="object-cover transform-gpu transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.25,1)] group-hover:scale-[1.04]"
                      quality={85}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 760px"
                      style={{ transform: "translate3d(0,0,0)" }}
                    />
                    
                    {/* Excursion Index stamp overlay */}
                    <div className="absolute top-8 left-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 z-10 text-[9px] font-black uppercase tracking-[0.3em] text-amber-400">
                      Excursion No. 0{index + 1}
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="w-full md:w-2/5 flex flex-col items-start gap-5 p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-400/80">
                        {exp.location}
                      </span>
                      {exp.flights_status === 'included' && (
                        <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                          <Plane size={9} />
                          <span>Flights Incl.</span>
                        </span>
                      )}
                      {exp.flights_status === 'on_request' && (
                        <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-blue-400/80 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                          <Plane size={9} />
                          <span>Flights on Req.</span>
                        </span>
                      )}
                    </div>
                    
                    <h3 
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      className="text-3xl md:text-5xl font-light italic tracking-tight text-white leading-[1.1] drop-shadow-md group-hover:text-amber-400/90 transition-colors duration-700 animate-pulse-once"
                    >
                      {exp.title}
                    </h3>
                    
                    {/* Poetical Concierge Summary */}
                    <p className="text-xs md:text-sm text-[#86868b] tracking-wide leading-relaxed font-light italic">
                      &ldquo;{quote}&rdquo;
                    </p>

                    {/* Luxury Travel Manifest details */}
                    <div className="grid grid-cols-3 gap-4 w-full py-4 my-2 border-y border-white/5 text-left">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Manifest</p>
                        <p className="text-[10px] font-bold text-white/70">8-12 Days</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Transit</p>
                        <p className="text-[10px] font-bold text-white/70">Private Luxe</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Stays</p>
                        <p className="text-[10px] font-bold text-white/70">Signature 5★</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg text-white/80 font-medium">
                          {pricing.formattedFinal} <span className="text-[9px] opacity-50 uppercase tracking-widest ml-1">/ Person</span>
                        </span>
                        {pricing.hasSavings && (
                          <span className="text-xs text-white/20 line-through">{pricing.formattedOriginal}</span>
                        )}
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">
                        {pricing.taxLabel}
                      </span>
                    </div>

                    <Magnetic>
                      <button
                        onClick={() => openModal('PACKAGE', exp)}
                        className="mt-4 bg-white/5 border border-white/10 hover:border-amber-400/80 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.25em] text-white/70 hover:text-white transition-all duration-700 hover:bg-white/[0.08]"
                      >
                        Request Access
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
