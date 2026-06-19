"use client";

import { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";
import { Magnetic } from "../Magnetic";
import { useSettings } from "@/hooks/useSettings";

export const AboutContent = memo(function AboutContent({ isActive, onScroll, startClosing }: { isActive: boolean, onScroll: (scrolled: boolean) => void, startClosing: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  const stats = settings.about_stats ? JSON.parse(settings.about_stats) : [
    { label: "Founded", value: "2026" },
    { label: "Global Reach", value: "120+ Cities" },
    { label: "Excellence", value: "Premium" },
    { label: "Execution", value: "Seamless" }
  ];

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <div 
        ref={scrollRef} 
        onScroll={(e) => onScroll(e.currentTarget.scrollTop > 30)}
        className="flex-1 w-full overflow-y-auto scrollbar-hide overscroll-behavior-contain transform-gpu"
        data-lenis-prevent
      >
        <div 
          className={`w-full flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu ${isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'}`}
        >
          {/* Hero Section */}
          <div className="relative w-full aspect-[4/3] md:aspect-[2/1] overflow-hidden bg-[#0a0a0b]">
            <Image 
              src={settings.about_hero_image || "/about_hero.webp"} 
              alt="TouraLuxe Vision" 
              fill 
              className="object-cover scale-[1.01] opacity-70 grayscale-[0.1]" 
              priority 
            />
            {/* Hyper-Smooth Progressive Blend */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0a0b]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
            
            {/* Header Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-[clamp(1rem,5vw,2rem)]">
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.4em] text-white/60 mb-4 drop-shadow-lg">
                {settings.about_hero_subtitle || "Luxury Redefined"}
              </span>
              <h2 className="text-[clamp(2.5rem,10vw,4.5rem)] font-semibold tracking-tighter text-white drop-shadow-2xl">
                {settings.about_hero_title || "About Us"}
              </h2>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-50 transition-all duration-700">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white drop-shadow-md">Scroll</span>
              <svg className="w-5 h-5 text-white drop-shadow-md" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </div>

          {/* Body Content */}
          <div className="px-[clamp(1.25rem,7vw,4rem)] py-[clamp(3rem,8vh,5rem)] max-w-4xl mx-auto pb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(2rem,6vw,4rem)]">
              {/* Vision */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[1px] bg-white/20" />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/40">
                    {settings.about_vision_subtitle || "Our Vision"}
                  </span>
                </div>
                <h3 className="text-[clamp(1.25rem,4vw,1.875rem)] font-medium text-white leading-tight">
                  {settings.about_vision_heading || "Setting new benchmarks in global travel."}
                </h3>
                <p className="text-[clamp(0.875rem,2.5vw,1rem)] text-pretty text-[#86868b] leading-relaxed">
                  {settings.about_vision_text || "To become a globally trusted travel and lifestyle brand delivering exceptional luxury experiences, innovative travel solutions, and personalized services. We aspire to redefine journeys through excellence, reliability, and customer satisfaction, creating memorable experiences while building lasting relationships and setting new benchmarks in travel, tourism, and corporate event management worldwide."}
                </p>
              </div>

              {/* Mission */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[1px] bg-white/20" />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/40">
                    {settings.about_mission_subtitle || "Our Mission"}
                  </span>
                </div>
                <h3 className="text-[clamp(1.5rem,4vw,2rem)] text-balance font-medium text-white leading-tight">
                  {settings.about_mission_heading || "Exceptional services, seamless execution."}
                </h3>
                <p className="text-[clamp(0.875rem,2.5vw,1rem)] text-pretty text-[#86868b] leading-relaxed">
                  {settings.about_mission_text || "To deliver exceptional travel and lifestyle services through personalized solutions, seamless execution, and innovative experiences. We are committed to quality, reliability, and customer satisfaction, providing luxury tours, corporate travel, and event management while building lasting relationships, exceeding expectations, and creating memorable journeys with professionalism, integrity, and global service excellence."}
                </p>
              </div>
            </div>

            <div className="mt-24 pt-12 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-12 md:gap-x-20 gap-y-8">
              {stats.map((stat: any, i: number) => (
                <div key={i} className="flex flex-col gap-1 min-w-[120px] text-center md:text-left">
                  <span className="text-[10px] uppercase tracking-widest text-[#86868b]">{stat.label}</span>
                  <span className="text-xl md:text-2xl font-semibold text-white">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-24 text-center">
              <p className="text-sm text-[#86868b] mb-8 italic">
                &quot;{settings.about_bottom_quote || "We don't just sell trips. We craft transcendent experiences."}&quot;
              </p>
              <Magnetic>
                <button 
                  onClick={() => startClosing()}
                  className="px-12 py-4 rounded-full bg-white text-black font-bold text-sm hover:scale-[1.02] transition-transform"
                >
                  {settings.about_bottom_button_text || "Explore Our World"}
                </button>
              </Magnetic>
            </div>
          </div>
        </div>
        </div>
      </div>
  );
});
