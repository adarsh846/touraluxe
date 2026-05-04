"use client";

import { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Magnetic } from "../Magnetic";

export const PackageContent = memo(function PackageContent({ 
  data: experience, 
  isActive, 
  source,
  onScroll, 
  openModal 
}: { 
  data: any, 
  isActive: boolean, 
  source: string,
  onScroll: (scrolled: boolean) => void, 
  openModal: any 
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);



  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <div 
        ref={scrollRef} 
        onScroll={(e) => onScroll(e.currentTarget.scrollTop > 30)}
        className="flex-1 w-full overflow-y-auto scrollbar-hide overscroll-behavior-contain transform-gpu"
        data-lenis-prevent
      >
        {!experience ? null : (
          <div 
            className={`w-full flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu ${isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'}`}
          >
            {/* Hero Image */}
            <div className="relative w-full aspect-[16/9] md:aspect-[2.4/1] overflow-hidden bg-[#0a0a0b]">
              <Image
                src={experience.image}
                alt={experience.title}
                fill
                className="object-cover scale-[1.01] opacity-70 grayscale-[0.2]"
                quality={90}
                sizes="920px"
              />
              {/* Hyper-Smooth Progressive Blend */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0a0b]" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />

              {/* Price badge */}
              <div className="absolute bottom-8 left-8 flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight py-1">
                  {experience.currency || "€"}{Number(experience.price.toString().replace(/[^0-9]/g, "")).toLocaleString('en-IN')}
                </span>
                <div className="flex flex-col mb-1">
                  <span className="text-sm text-white/60 font-normal uppercase tracking-wider">
                    / Person
                  </span>
                  <span className="text-[9px] text-white/30 font-medium uppercase tracking-[0.1em] mt-0.5 whitespace-nowrap">
                    {experience.tax_status || "Inclusive of Taxes"}
                  </span>
                </div>
              </div>

              {/* Scroll Indicator */}
              <div className="absolute bottom-[clamp(1.5rem,5vh,2rem)] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce pointer-events-none z-50 transition-all duration-700">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/80 drop-shadow-md">Scroll</span>
                <svg className="w-4 h-4 text-white/60 drop-shadow-md" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div 
              ref={contentRef} 
              className="relative z-10 px-[clamp(1.5rem,6vw,4rem)] pb-8 -mt-8 bg-[#0a0a0b] rounded-t-3xl"
            >
              {/* Header */}
              <div className="mb-8 mt-8">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                  {experience.location}
                </span>
                <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mt-2 leading-[1.1]">
                  {experience.title}
                </h3>
                <p className="text-lg md:text-xl text-[#86868b] font-medium tracking-tight mt-2 italic">
                  {experience.tagline}
                </p>
              </div>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { label: "Duration", value: experience.duration },
                  experience.guests && { label: "Ideal For", value: experience.guests },
                ].filter(Boolean).map((meta: any) => (
                  <div
                    key={meta.label}
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.1]"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#86868b]">
                      {meta.label}
                    </span>
                    <span className="text-sm font-semibold text-white/90">{meta.value}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="mb-10">
                <p className="text-[17px] leading-[1.65] text-[#a1a1a6] font-normal">
                  {experience.description}
                </p>
              </div>

              {/* Highlights */}
              <div className="mb-10">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b] mb-5">
                  What&apos;s Included
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {experience.highlights?.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-gradient-to-br from-white/60 to-white/20 flex-shrink-0" />
                      <span className="text-[15px] text-white/70 leading-[1.5]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-20 pt-12 border-t border-white/[0.1] flex flex-col items-center gap-8 mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-[1px] w-8 bg-white/10" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Crafting Your Journey</span>
                  <div className="h-[1px] w-8 bg-white/10" />
                </div>
                <Magnetic>
                  <button 
                    onClick={() => {
                      const finalSource = source ? `${source}_EXPERIENCE_${experience.title.toUpperCase().replace(/\s+/g, '_')}` : `EXPERIENCE_${experience.title.toUpperCase().replace(/\s+/g, '_')}`;
                      openModal('BOOKING', experience, finalSource);
                    }}
                    className="group/btn flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center group-hover/btn:scale-110 transition-all duration-700 shadow-[0_0_40px_rgba(255,255,255,0.15)] group-hover/btn:shadow-[0_0_60px_rgba(255,255,255,0.25)]">
                      <ChevronRight size={28} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover/btn:text-white group-hover/btn:tracking-[0.5em] transition-all duration-700 mt-2">
                      Reserve This Journey
                    </span>
                  </button>
                </Magnetic>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
