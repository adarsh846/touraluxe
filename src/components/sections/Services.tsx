"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Image from "next/image";
import { Magnetic } from "../Magnetic";

const SERVICES = [
  {
    id: 1,
    title: "Luxury Travel",
    tagline: "Access the inaccessible.",
    desc: "Access the inaccessible. Private villas, chartered yachts, and elite retreats.",
    fullDesc: "We specialize in curating ultra-high-end travel experiences that go beyond the typical 'luxury' itinerary. From private villas in secluded Mediterranean coves to chartered superyachts in the Caribbean, our global network provides access to properties and locations that aren't listed on any public site.",
    image: "/luxury_villa_secluded_1777655165196.png",
    highlights: ["Private Villa Sourcing", "Superyacht Charters", "Elite Retreats", "Bespoke Itineraries"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Sports Tours",
    tagline: "The ultimate front row.",
    desc: "VIP access, best seats, and exclusive backstage experiences at major events.",
    fullDesc: "Experience global sporting events with unparalleled access. We provide VIP hospitality at major events like the Monaco Grand Prix, Wimbledon, and the World Cup. Beyond just tickets, we arrange meet-and-greets, backstage pit-lane tours, and private jet transfers directly to the host cities.",
    image: "/f1_monaco_vip_1777655187300.png",
    highlights: ["VIP Box Access", "Meet & Greets", "Pit Lane Tours", "Official Hospitality"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "MICE Events",
    tagline: "Corporate excellence redefined.",
    desc: "Corporate getaways, incentive programs, and world-class meetings.",
    fullDesc: "Elevate your corporate presence with flawlessly executed meetings, incentives, conferences, and events. We handle everything from location scouting in exotic destinations to high-tech staging and high-level security for your most important delegates.",
    image: "/corporate_event_exotic_1777655212281.png",
    highlights: ["Destination Management", "Incentive Programs", "High-Security Meetings", "Executive Retreats"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h10" /><path d="M7 12h10" /><path d="M7 17h10" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "Global Retreats",
    tagline: "Soul-enriching immersions.",
    desc: "Hand-picked, life-changing wellness and cultural immersions.",
    fullDesc: "Discover the world's most transformative wellness and cultural retreats. We hand-pick destinations that offer deep restorative power—from Ayurvedic centers in the Himalayas to silent meditation retreats in Kyoto's ancient temples. Every detail is managed to ensure complete peace of mind.",
    image: "/zen_retreat_kyoto_1777655233180.png",
    highlights: ["Ayurvedic Wellness", "Cultural Immersions", "Holistic Spas", "Mindfulness Retreats"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
      </svg>
    ),
  },
];

function ServiceModal({ 
  service, 
  onClose 
}: { 
  service: typeof SERVICES[0]; 
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Lock scroll
    const lenis = (window as any).__lenis;
    lenis?.stop();

    const tl = gsap.timeline();
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    tl.fromTo(panelRef.current, { y: 60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" }, 0.1);

    return () => lenis?.start();
  }, [service]);

  const handleClose = useCallback(() => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current, { y: 40, opacity: 0, scale: 0.97, duration: 0.3, ease: "power2.in" });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.25 }, 0.1);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999]">
      <div ref={overlayRef} className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={handleClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 pointer-events-none">
        <div ref={panelRef} data-lenis-prevent className="relative w-full max-w-[920px] h-[90vh] bg-[#1c1c1e] border border-white/[0.06] rounded-3xl overflow-hidden pointer-events-auto shadow-2xl">
          {/* Close Button */}
          <div className="absolute top-6 right-6 z-[100]">
            <Magnetic>
              <button onClick={handleClose} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all hover:bg-white/10" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1.5 1.5l13 13M14.5 1.5l-13 13" /></svg>
              </button>
            </Magnetic>
          </div>

          <div 
            ref={scrollRef} 
            onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 30)}
            className="w-full h-full overflow-y-auto scrollbar-hide"
          >
            {/* Hero */}
            <div className="relative w-full aspect-[16/9] md:aspect-[2.4/1] overflow-hidden bg-[#1c1c1e]">
              <Image src={service.image} alt={service.title} fill className="object-cover scale-[1.01]" priority />
              <div className="absolute inset-x-0 -bottom-px h-40 bg-gradient-to-t from-[#1c1c1e] to-transparent" />

              {/* Scroll Indicator - Clearly Visible */}
              <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-50 transition-all duration-700 ${isScrolled ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white drop-shadow-md">Scroll</span>
                <svg className="w-5 h-5 text-white drop-shadow-md" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
              </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="relative z-10 px-8 md:px-10 pb-10 -mt-8 bg-[#1c1c1e] rounded-t-3xl">
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
                  {service.highlights.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-white/40 flex-shrink-0" />
                      <span className="text-[15px] text-white/70">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/[0.06]">
                <Magnetic>
                  <button className="flex-1 py-4 px-8 rounded-full bg-white text-black font-semibold text-[15px] transition-all hover:scale-[1.02]">
                    Inquire About This Division
                  </button>
                </Magnetic>
                <Magnetic>
                  <button onClick={handleClose} className="flex-1 py-4 px-8 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/70 font-medium text-[15px] transition-all hover:scale-[1.02]">
                    Back to Services
                  </button>
                </Magnetic>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export function Services() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeService, setActiveService] = useState<typeof SERVICES[0] | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".services-header > *", { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 1.5, ease: "expo.out", stagger: 0.2, scrollTrigger: { trigger: ".services-header", start: "top 85%" } });
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(card, { y: 40, x: index % 2 === 0 ? -30 : 30, opacity: 0, scale: 0.98 }, { y: 0, x: 0, opacity: 1, scale: 1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 90%" } });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const handleRemoteOpen = (e: any) => {
      const serviceId = e.detail?.serviceId;
      const service = SERVICES.find(s => s.id === serviceId);
      if (service) {
        setActiveService(service);
      }
    };

    window.addEventListener('open-service-modal', handleRemoteOpen);
    return () => window.removeEventListener('open-service-modal', handleRemoteOpen);
  }, []);

  return (
    <section ref={containerRef} id="services" className="scroll-mt-20 pt-10 pb-20 md:pt-16 md:pb-32 px-6 w-full bg-black text-foreground min-h-screen flex flex-col items-center overflow-hidden">
      <div className="max-w-[1200px] w-full mx-auto">
        <div className="services-header mb-20 max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6 opacity-0">Beyond First Class.</h2>
          <p className="text-lg md:text-xl text-[#86868b] tracking-wide opacity-0">Our specialized divisions cater to every facet of high-end lifestyle and corporate excellence.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {SERVICES.map((service, index) => (
            <div key={service.title} ref={(el) => { cardsRef.current[index] = el; }} className="opacity-0 h-full" onClick={() => setActiveService(service)}>
              <Magnetic className="block w-full h-full">
                <div className="group relative h-full p-8 pt-10 border border-white/10 rounded-2xl bg-zinc-900 transition-all duration-500 hover:bg-zinc-800 hover:border-white/20 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl" style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 60%)" }} />
                  <div className="mb-6 text-white/30 group-hover:text-white/70 transition-all duration-500 group-hover:translate-y-[-2px]">{service.icon}</div>
                  <h3 className="text-xl font-medium tracking-tight mb-4">{service.title}</h3>
                  <p className="text-sm text-[#86868b] leading-relaxed">{service.desc}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/20 transition-all duration-700" />
                </div>
              </Magnetic>
            </div>
          ))}
        </div>
      </div>

      {activeService && <ServiceModal service={activeService} onClose={() => setActiveService(null)} />}
    </section>
  );
}