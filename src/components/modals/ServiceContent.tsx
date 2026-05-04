"use client";

import { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";
import gsap from "gsap";
import { supabase } from "@/lib/supabase";
import { Magnetic } from "../Magnetic";

export const ServiceContent = memo(function ServiceContent({ data: service, isActive, onScroll, openModal }: { data: any, isActive: boolean, onScroll: (scrolled: boolean) => void, openModal: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
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
              <div className="flex-1 flex flex-col min-h-[80vh] bg-[#0a0a0b]">
                {/* AI Header */}
                <div className="p-8 pt-24 border-b border-white/[0.1] bg-zinc-900/50 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white leading-none">Aether AI</h3>
                      <p className="text-xs text-[#86868b] mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Instant Concierge Active
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chat Content */}
                <div 
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth" 
                  data-lenis-prevent
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-10">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center text-white/30 mb-8 animate-pulse">
                        {service.icon}
                      </div>
                      <h4 className="text-2xl font-semibold text-white mb-4">Plan with Intelligence.</h4>
                      <p className="text-[#86868b] text-[15px] leading-relaxed">
                        Describe your dream journey. Aether will calculate logistics, curate properties, and banking the aircraft towards your next horizon.
                      </p>
                      <div className="grid grid-cols-1 gap-3 w-full mt-10">
                        {["Private villa in Maldives", "Alps helipad access", "Kyoto art tour"].map(prompt => (
                          <button key={prompt} onClick={() => setInput(prompt)} className="px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all">
                            "{prompt}"
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-2xl text-[15px] leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-white text-black font-medium rounded-tr-none' 
                            : 'bg-zinc-900 text-white border border-white/[0.1] rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-900 text-[#86868b] p-5 rounded-2xl rounded-tl-none flex items-center gap-1.5 border border-white/[0.1]">
                        <div className="w-1 h-1 rounded-full bg-current animate-bounce" />
                        <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSend} className="p-6 bg-zinc-900/50 border-t border-white/[0.1] flex gap-4">
                  <input 
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask Aether anything..."
                    className="flex-1 bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-[15px] text-white placeholder:text-[#48484a] focus:outline-none focus:border-white/20 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim()}
                    className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Hero */}
                <div className="relative w-full aspect-[16/9] md:aspect-[2.4/1] overflow-hidden bg-[#0a0a0b]">
                  <Image src={service.image} alt={service.title} fill className="object-cover scale-[1.01] opacity-70 grayscale-[0.2]" priority />
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
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">Discovery: Live Experiences</h4>
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
                        {livePackages.map((pkg) => (
                          <div 
                            key={pkg.id}
                            onClick={() => {
                              openModal('PACKAGE', pkg, `SERVICES_${service.title.toUpperCase().replace(/\s+/g, '_')}`);
                            }}
                            className="group relative aspect-[16/10] min-w-[280px] md:min-w-[400px] flex-shrink-0 rounded-[24px] overflow-hidden bg-[#2c2c2e] border border-white/5 cursor-pointer hover:border-white/20 transition-all duration-500 snap-start transform-gpu will-change-transform"
                          >
                            <Image src={pkg.image} alt={pkg.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute inset-x-5 bottom-5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">{pkg.location}</p>
                              <h5 className="text-[15px] font-bold text-white mb-1 group-hover:text-white transition-colors">{pkg.title}</h5>
                              <p className="text-[13px] font-medium text-white/60">
                                {pkg.currency || "₹"}{Number(pkg.price.replace(/[^0-9]/g, "")).toLocaleString('en-IN')} <span className="text-[10px] text-white/30 uppercase tracking-widest ml-1">/ Person</span>
                              </p>
                            </div>
                          </div>
                        ))}
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
                        className="whitespace-nowrap px-8 py-4 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-white/90 transition-all duration-500 shadow-xl"
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
