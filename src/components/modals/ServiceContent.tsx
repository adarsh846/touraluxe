"use client";

import { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";
import gsap from "gsap";
import { supabase } from "@/lib/supabase";
import { Magnetic } from "../Magnetic";
import { usePricing } from "@/hooks/usePricing";
import { cn } from "@/lib/utils";
import { PackageBadges } from "@/components/ui/PackageBadges";

export const ServiceContent = memo(function ServiceContent({ data: service, isActive, onScroll, openModal }: { data: any, isActive: boolean, onScroll: (scrolled: boolean) => void, openModal: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { computePrice } = usePricing();
  
  // --- Discovery Logic ---
  const [livePackages, setLivePackages] = useState<any[]>([]);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);
  const [discoveryScrolled, setDiscoveryScrolled] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!service || service.id === 7) return; 

    const fetchDiscovery = async () => {
      setIsDiscoveryLoading(true);
      try {
        const { data, error } = await supabase
          .from('packages')
          .select('*')
          .contains('category', [service.title])
          .eq('is_published', true)
          .limit(6);
        
        if (data) setLivePackages(data);
      } catch (err) {
        console.error("Discovery Engine Stall:", err);
      } finally {
        setIsDiscoveryLoading(false);
      }
    };

    fetchDiscovery();
  }, [service]);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let aiResponse = "I'm banking the aircraft towards your next destination. How else can I refine this journey?";
      if (userMsg.toLowerCase().includes("beach")) aiResponse = "Excellent choice. I recommend a private villa in the Maldives or a secluded cove in the Amalfi Coast. Shall I cost a 7-day itinerary for you?";
      if (userMsg.toLowerCase().includes("mountains")) aiResponse = "The Alps are calling. I can secure a high-altitude lodge with private helipad access. Would you like to see the available dates?";
      
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <div 
        ref={scrollRef} 
        onScroll={(e) => onScroll(e.currentTarget.scrollTop > 30)}
        className="flex-1 w-full overflow-y-auto scrollbar-hide overscroll-behavior-contain transform-gpu"
        data-lenis-prevent
      >
        {!service ? null : (
          <div 
          className={`w-full flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu ${isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'}`}
        >
            {service.id === 7 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[85vh] bg-[#0a0a0b] px-6 pt-28 pb-16 md:pt-36 md:pb-24 text-center relative overflow-hidden">
                {/* Glow Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] bg-gradient-to-tr from-amber-400/20 via-purple-500/10 to-transparent rounded-full blur-[100px] md:blur-[130px] pointer-events-none z-0" />
                
                <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
                  {/* Floating Icon */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/80 shadow-2xl mb-8">
                    {service.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4">
                    AI Travel Planner
                  </h3>
                  
                  {/* Subtitle */}
                  <p className="text-lg md:text-xl text-[#86868b] font-medium tracking-tight mb-8 italic">
                    Coming Soon
                  </p>

                  {/* Description */}
                  <p className="text-white/60 text-sm md:text-base leading-relaxed mb-12 text-balance">
                    Our generative intelligence engine is currently being calibrated to choreograph private charters, ultra-exclusive villa bookings, and custom routes in real-time. Prepare to chart your next horizon with pure algorithmic perfection.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Magnetic>
                      <button 
                        onClick={() => openModal('BOOKING', undefined, 'AI_PLANNER_COMING_SOON')}
                        className="px-8 py-4 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                      >
                        Design Custom Journey
                      </button>
                    </Magnetic>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Hero */}
                <div className="relative w-full aspect-[16/9] md:aspect-[2.4/1] overflow-hidden bg-[#0a0a0b]">
                  <Image src={service.image} alt={service.title} fill className="object-cover scale-[1.01] opacity-70 grayscale-[0.2]" priority decoding="async" />
                  {/* Hyper-Smooth Progressive Blend */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0a0b]" />
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />

                  <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-50 transition-all duration-700`}>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white drop-shadow-md">Scroll</span>
                    <svg className="w-5 h-5 text-white drop-shadow-md" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
                  </div>
                </div>

                {/* Content */}
                <div ref={contentRef} className="relative z-10 px-8 md:px-10 pb-24 -mt-8 bg-[#0a0a0b] rounded-t-3xl">
                  <div className="mb-8 mt-8">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">Our Specialization</span>
                    <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mt-2">{service.title}</h3>
                    <p className="text-lg md:text-xl text-[#86868b] font-medium tracking-tight mt-2 italic">{service.tagline}</p>
                  </div>

                  <div className="mb-10">
                    <p className="text-[17px] leading-[1.65] text-[#a1a1a6]">{service.fullDesc}</p>
                  </div>

                  <div className="mb-10">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b] mb-5">Division Highlights</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {service.highlights?.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-white/40 flex-shrink-0" />
                          <span className="text-[15px] text-white/70">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discovery Section */}
                  <div className="mb-12 pt-10 border-t border-white/[0.1]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">Best destinations for {service.title}</h4>
                      </div>
                      {!isDiscoveryLoading && livePackages.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/20 text-[9px] font-black text-white/60 uppercase tracking-widest animate-pulse">Live</span>
                      )}
                    </div>

                    {isDiscoveryLoading ? (
                      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                        {[1, 2].map(i => (
                          <div key={i} className="aspect-[16/10] min-w-[280px] md:min-w-[380px] flex-shrink-0 rounded-[24px] bg-white/[0.02] border border-white/[0.05] animate-pulse" />
                        ))}
                      </div>
                    ) : livePackages.length > 0 ? (
                      <div 
                        onScroll={(e) => setDiscoveryScrolled(e.currentTarget.scrollLeft > 30)}
                        className="flex overflow-x-auto gap-4 pb-6 scrollbar-hide snap-x snap-mandatory"
                      >
                        {livePackages.map((pkg) => {
                          const pricing = computePrice(pkg);
                          return (
                            <div 
                              key={pkg.id}
                              onClick={() => {
                                openModal('PACKAGE', pkg, `SERVICES_${service.title.toUpperCase().replace(/\s+/g, '_')}`);
                              }}
                              className="group relative aspect-[16/11] min-w-[320px] md:min-w-[420px] flex-shrink-0 rounded-[24px] md:rounded-[32px] overflow-hidden bg-[#2c2c2e] border border-white/5 cursor-pointer hover:border-white/20 transition-all duration-700 snap-start transform-gpu will-change-transform"
                            >
                              <Image src={pkg.image} alt={pkg.title} fill className="object-cover transition-transform duration-[1.5s] group-hover:scale-110" decoding="async" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                              
                              {/* Status Badges Layer */}
                              <PackageBadges pkg={pkg} pricing={pricing} className="top-5 left-5 right-5" />
                              
                              {/* Overlay Content */}
                              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                <div className="flex items-end justify-between gap-4">
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <h5 className="text-[15px] md:text-lg font-bold text-white truncate drop-shadow-lg">{pkg.title}</h5>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{pkg.location}</p>
                                  </div>
                                  
                                  {/* Arrow Indicator */}
                                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                  </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-0.5">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-black text-white tracking-tighter">
                                      {pricing.formattedFinal}
                                    </span>
                                    {pricing.hasSavings && (
                                      <span className="text-xs font-bold text-white/20 line-through italic">
                                        {pricing.formattedOriginal}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[8px] font-black uppercase tracking-widest text-white/30">
                                    Per person · {pricing.taxLabel}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 px-8 rounded-[32px] bg-white/[0.02] border border-dashed border-white/20 flex flex-col items-center text-center">
                        <p className="text-[14px] text-white/60 font-medium italic">Our curators are currently preparing new missions in this sector.</p>
                      </div>
                    )}
                  </div>

                  {/* Custom Journey CTA */}
                  <div className="mb-12 p-6 md:p-8 rounded-[32px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.1] flex flex-col md:flex-row items-center justify-between gap-6 group">
                    <div className="flex-1 text-center md:text-left">
                      <h5 className="text-[15px] font-bold text-white mb-2">Seeking a Different Destination?</h5>
                      <p className="text-[13px] text-[#86868b] leading-relaxed">Share your dream destination, and our curators will handle the rest.</p>
                    </div>
                    <Magnetic>
                      <button 
                        onClick={() => openModal('BOOKING', undefined, `SERVICES_CUSTOM_${service.title.toUpperCase().replace(/\s+/g, '_')}`)}
                        className="whitespace-nowrap px-[clamp(1.5rem,3vw,2.5rem)] py-[clamp(0.75rem,2vw,1.25rem)] rounded-full bg-white text-black text-[clamp(9px,1.5vw,11px)] font-black uppercase tracking-widest hover:bg-white/90 transition-all duration-500 shadow-xl"
                      >
                        Design Your Own Journey
                      </button>
                    </Magnetic>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
