"use client";

import { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";
import { ChevronRight, Clock, Users, Compass, ShieldCheck, MapPin, Sparkles, Calendar } from "lucide-react";
import { Magnetic } from "../Magnetic";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import gsap from "gsap";

export const PackageContent = memo(({ 
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
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'highlights' | 'inclusions'>('overview');
  const tabContentRef = useRef<HTMLDivElement>(null);
  const [globalTaxRate, setGlobalTaxRate] = useState(0);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (data.tax_percentage) setGlobalTaxRate(parseFloat(data.tax_percentage));
      })
      .catch(() => {});

    const channel = supabase
      .channel('site_settings_package_content')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'key=eq.tax_percentage' }, 
        (payload: any) => {
          if (payload.new && payload.new.value) {
            setGlobalTaxRate(parseFloat(payload.new.value));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Kinetic Tab Transition Logic
  useEffect(() => {
    if (tabContentRef.current) {
      gsap.fromTo(tabContentRef.current, 
        { opacity: 0, y: 15, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power4.out" }
      );
    }
  }, [activeTab]);

  if (!experience) return null;
  const isTaxApplied = globalTaxRate > 0 && experience?.tax_status === "Inclusive of Taxes";

  return (
    <div className="relative w-full h-full overflow-hidden selection:bg-white selection:text-black flex flex-col lg:block">
      {/* THE STAGE: Global Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={experience.image}
          alt={experience.title}
          fill
          className="object-cover scale-110"
          quality={100}
          priority
        />
        {/* Global Atmosphere: Unified shadow and light for maximum legibility */}
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-black/90 lg:from-black/80 via-transparent to-black/90 lg:to-black/80" />
        <div className="absolute inset-0 bg-black/10 backdrop-brightness-[0.7] backdrop-blur-[1px]" />
      </div>

      {/* THE HERO: Narrative Layer */}
      <div className="relative lg:absolute lg:inset-y-0 lg:left-0 w-full lg:w-1/2 h-[45vh] lg:h-full z-10 p-6 lg:p-24 flex flex-col justify-end lg:justify-center pointer-events-none">
        <div className="max-w-2xl animate-in fade-in slide-in-from-left-12 duration-1000 pointer-events-auto">
          <div className="flex flex-col gap-2 lg:gap-4 mb-4 lg:mb-8">
            <div className="flex items-center gap-2 pl-1">
              <MapPin size={10} className="text-white/60" />
              <span className="text-[clamp(7px,1.5vw,10px)] font-black uppercase tracking-[0.4em] text-white/80">{experience.location}</span>
            </div>
          </div>
          
          <h1 className="text-[clamp(2.2rem,8vw,6rem)] lg:text-[clamp(4rem,10vw,8.5rem)] font-bold tracking-tight text-white leading-[0.9] lg:leading-[0.82] mb-4 lg:mb-8 drop-shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
            {experience.title.split(' ').map((word: string, i: number) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h1>
          
          <p className="text-[clamp(0.8rem,2vw,1.2rem)] lg:text-[clamp(1.2rem,2.5vw,2.2rem)] text-white/80 font-medium tracking-tight italic max-w-xl drop-shadow-md">
            {experience.tagline}
          </p>

          {/* Price Anchor */}
          <div className="mt-[clamp(1.5rem,5vh,3rem)] lg:mt-12 flex flex-col gap-2 lg:gap-4 drop-shadow-lg">
            <div className="flex items-baseline gap-3">
              <span className="text-[clamp(1.5rem,4vw,2.5rem)] lg:text-[clamp(2.5rem,5vw,5rem)] font-bold tracking-tighter text-white tabular-nums">
                {(() => {
                  const base = parseInt(experience.price.toString().replace(/[^0-9]/g, "")) || 0;
                  const finalPrice = isTaxApplied ? base + (base * globalTaxRate / 100) : base;
                  return `${experience.currency || "₹"}${finalPrice.toLocaleString('en-IN')}`;
                })()}
              </span>
              <div className="flex flex-col">
                <span className="text-[8px] lg:text-sm text-white/60 font-black uppercase tracking-widest">Investment</span>
                <span className="text-[6px] lg:text-[9px] text-white/30 font-bold uppercase tracking-widest">/ Individual</span>
              </div>
            </div>
            
            {experience.tax_status && (
              <div className="flex items-center gap-2 px-2.5 lg:px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 w-fit">
                <ShieldCheck size={8} className="text-white/40" />
                <span className="text-[6px] lg:text-[8px] font-black uppercase tracking-[0.2em] text-white/40">{experience.tax_status}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* THE DISCOVERY: HUD Panel */}
      <div className={cn(
        "relative lg:absolute lg:inset-y-0 lg:right-0 w-full lg:w-[600px] h-[55vh] lg:h-full z-20 flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu overflow-hidden backdrop-blur-[2px]",
        isActive ? 'opacity-100 translate-y-0 lg:translate-x-0' : 'opacity-0 translate-y-12 lg:translate-x-full'
      )}>
        {/* Navigation Bridge */}
        <div className="px-6 lg:px-12 pt-8 lg:pt-32 pb-4 lg:pb-8 shrink-0 flex justify-center lg:justify-start">
          <div className="inline-flex items-center gap-1 lg:gap-2 p-1.5 lg:p-2 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full overflow-x-auto scrollbar-hide max-w-full">
            {[
              { id: 'overview', label: 'Brief', icon: Compass },
              { id: 'itinerary', label: 'Journey', icon: MapPin },
              { id: 'highlights', label: 'Vibe', icon: Sparkles },
              { id: 'inclusions', label: 'Access', icon: ShieldCheck }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3 lg:px-6 py-2 lg:py-3 rounded-full transition-all duration-500 whitespace-nowrap",
                  activeTab === tab.id ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-105" : "text-white/60 hover:text-white/90 hover:bg-white/5"
                )}
              >
                <tab.icon size={12} className={cn("transition-transform duration-500", activeTab === tab.id ? "scale-100" : "scale-90 opacity-50")} />
                <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Flow */}
        <div className="flex-1 p-6 lg:p-12 overflow-y-auto relative scrollbar-hide">
          <div ref={tabContentRef} className="h-full flex flex-col">
            {activeTab === 'overview' && (
              <div className="space-y-6 lg:space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000">
                <p className="text-base lg:text-2xl leading-relaxed lg:leading-[1.6] text-white/90 font-medium tracking-tight drop-shadow-lg">
                  {experience.description}
                </p>
                
                {/* HUD Stat Bridge */}
                <div className="grid grid-cols-2 gap-3 lg:gap-6">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] group/card hover:bg-white/10 transition-all duration-500">
                    <Clock size={16} className="text-white/40 mb-2 lg:mb-3 group-hover/card:text-white transition-colors" />
                    <span className="block text-[7px] lg:text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Duration</span>
                    <span className="text-sm lg:text-xl font-bold text-white tracking-tight">{experience.duration}</span>
                  </div>
                  {experience.guests && (
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] group/card hover:bg-white/10 transition-all duration-500">
                      <Users size={16} className="text-white/40 mb-2 lg:mb-3 group-hover/card:text-white transition-colors" />
                      <span className="block text-[7px] lg:text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Ideal For</span>
                      <span className="text-sm lg:text-xl font-bold text-white tracking-tight">{experience.guests}</span>
                    </div>
                  )}
                  {experience.season && (
                    <div className="col-span-2 bg-white/5 backdrop-blur-md border border-white/10 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] group/card hover:bg-white/10 transition-all duration-500">
                      <Calendar size={16} className="text-white/40 mb-2 lg:mb-3 group-hover/card:text-white transition-colors" />
                      <span className="block text-[7px] lg:text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Travel Season</span>
                      <span className="text-sm lg:text-xl font-bold text-white tracking-tight">{experience.season}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'itinerary' && experience.itinerary && experience.itinerary.length > 0 && (
              <div className="space-y-6 lg:space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000 pb-24">
                {experience.itinerary.map((item: any, i: number) => (
                  <div key={i} className="relative pl-10 lg:pl-16 group/day">
                    {i !== experience.itinerary.length - 1 && (
                      <div className="absolute left-[19px] lg:left-[27px] top-10 lg:top-14 bottom-0 w-[1px] bg-white/5 group-hover/day:bg-white/20 transition-colors duration-500" />
                    )}
                    <div className="absolute left-0 top-0 w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover/day:bg-white group-hover/day:scale-110 transition-all duration-500 z-10">
                      <span className="text-[8px] lg:text-xs font-black text-white/40 group-hover/day:text-black">D{item.day}</span>
                    </div>
                    <div className="flex flex-col gap-1 lg:gap-3 pt-2 lg:pt-4">
                      <h4 className="text-base lg:text-2xl font-bold text-white tracking-tight leading-tight">{item.title}</h4>
                      <p className="text-xs lg:text-base text-white/60 leading-relaxed font-medium max-w-lg">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'highlights' && (
              <div className="space-y-3 lg:space-y-6 animate-in fade-in slide-in-from-right-8 duration-1000 pb-24">
                {experience.highlights?.map((item: string, i: number) => (
                  <div key={i} className="group/item flex items-center gap-4 lg:gap-8 p-4 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-500">
                    <Sparkles size={16} className="text-white/20 group-hover/item:text-white group-hover/item:scale-110 transition-all duration-500" />
                    <span className="text-sm lg:text-2xl text-white font-medium tracking-tight leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'inclusions' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 animate-in fade-in slide-in-from-right-8 duration-1000 pb-24">
                {experience.inclusions?.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-4 lg:p-6 rounded-xl lg:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-500">
                    <ShieldCheck size={16} className="text-white/20" />
                    <span className="text-xs lg:text-base font-bold text-white/70 tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Hub */}
        <div className="p-6 lg:p-12 pt-4 lg:pt-0 shrink-0 flex justify-center lg:justify-end">
          <Magnetic>
            <button 
              onClick={() => {
                const finalSource = source ? `${source}_EXPERIENCE_${experience.title.toUpperCase().replace(/\s+/g, '_')}` : `EXPERIENCE_${experience.title.toUpperCase().replace(/\s+/g, '_')}`;
                openModal('BOOKING', experience, finalSource);
              }}
              className="group/btn inline-flex items-center gap-4 lg:gap-8 bg-white/10 backdrop-blur-3xl border border-white/20 px-6 lg:px-10 py-3 lg:py-5 rounded-full transition-all duration-700 hover:bg-white/20 hover:shadow-[0_0_50px_rgba(255,255,255,0.15)] active:scale-95"
            >
              <div className="flex flex-col items-start">
                <span className="text-[6px] lg:text-[8px] font-black uppercase tracking-[0.4em] text-white/40 mb-0.5">Proceed to</span>
                <span className="text-[8px] lg:text-xs font-black uppercase tracking-[0.3em] text-white max-w-[120px] lg:max-w-none truncate lg:overflow-visible">
                  Reserve {experience.title}
                </span>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white text-black flex items-center justify-center group-hover/btn:translate-x-2 transition-transform duration-500 shadow-lg">
                <ChevronRight size={16} strokeWidth={3} />
              </div>
            </button>
          </Magnetic>
        </div>
      </div>
    </div>
  );
});
