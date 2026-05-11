"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Image from "next/image";
import { Magnetic } from "../Magnetic";
import { useBooking } from "../BookingProvider";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/hooks/useSettings";

export const SERVICES = [
  {
    id: 1,
    title: "Luxury Tours",
    tagline: "Exclusive global access.",
    desc: "Bespoke luxury journeys across the world’s most exclusive destinations.",
    fullDesc: "We curate bespoke luxury journeys across the world’s most exclusive destinations—combining personalized itineraries, premium stays, and unforgettable experiences. From secluded Mediterranean villas to private island escapes, every journey is a masterpiece of comfort and discovery.",
    image: "/luxury_villa_secluded_1777655165196.png",
    highlights: ["Personalized Itineraries", "Premium Property Access", "Luxury Urban Transfers", "Visa Concierge Support"],
    cta: "Book Your Journey",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Group Trips",
    tagline: "Travel together, luxuriously.",
    desc: "Luxury backpacking and group journeys for those who seek connection and adventure.",
    fullDesc: "Inspired by the community spirit of the world's leading group travel sites, our Group Expeditions redefine collective travel. We combine the raw thrill of backpacking with the refinement of TouraLuxe. From shared villas in the Swiss Alps to curated group treks in Patagonia, we ensure you never travel alone while maintaining absolute comfort.",
    image: "/assets/services/group.png",
    highlights: ["Fixed-Date Departures", "Curated Group Villas", "Adventure Curation", "Community Events"],
    cta: "Join an Expedition",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "Adventure Tours",
    tagline: "Luxury at the edge.",
    desc: "High-altitude trekking, specialized biking, and elite survival experiences.",
    fullDesc: "For those who demand more than a vacation. Our Extreme division manages the logistics for high-risk, high-reward adventures. Whether it's a private biking expedition across the Spiti Valley or a guided ascent of a 6,000m peak, our precision planning keeps you safe at the edge of the world.",
    image: "/assets/services/extreme.png",
    highlights: ["Specialized Gear Logistics", "Elite Mountain Guides", "Off-Road Expeditions", "Satellite Comms Support"],
    cta: "Start Your Adventure",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "Luxury Honeymoons",
    tagline: "Absolute romantic perfection.",
    desc: "Choreographed romantic immersions where every detail is executed to achieve flawlessness.",
    fullDesc: "We craft the perfect beginning to your forever. Every detail—from the precise thread count of your linens to the timing of a private sunset dinner on a deserted sandbank—is choreographed to achieve absolute romantic perfection. Our Eternal Escapes are more than trips; they are immortal immersions in love, curated for those who demand nothing less than a flawless reality.",
    image: "/assets/services/honeymoon.png",
    highlights: ["Overwater Villas", "Private Island Dining", "Couples' Wellness", "Bespoke Romance Concierge"],
    cta: "Plan Your Honeymoon",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
  {
    id: 5,
    title: "MICE Events",
    tagline: "Corporate excellence redefined.",
    desc: "World-class Meetings, Incentives, Conferences, and Events across global destinations.",
    fullDesc: "Our MICE division delivers seamless, high-impact corporate programs that go beyond logistics. From executive board meetings and large-scale global summits to achievement-based incentive travel and gala events, we blend strategic expertise with elevated luxury to create meaningful, results-driven experiences.",
    image: "/corporate_event_exotic_1777655212281.png",
    highlights: ["Global Summit Curation", "Executive Board Meetings", "Corporate Incentive Programs", "Event Management Solutions"],
    cta: "Plan Your Event",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    id: 6,
    title: "Custom Journeys",
    tagline: "Luxury tailored to you.",
    desc: "Fully customized journeys tailored to your specific preferences and travel style.",
    fullDesc: "Taking the 'Customized Tours' from our heritage and elevating them to art. We design fully bespoke journeys that reflect your unique interests. From vintage car tours through the Italian countryside to private museum access, we deliver seamless, luxurious experiences crafted just for you.",
    image: "/assets/services/bespoke.png",
    highlights: ["Tailored Itineraries", "Private Access Tours", "Boutique Stays", "Personalized Welcome"],
    cta: "Design Your Tour",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4" /><path d="m4.9 4.9 2.9 2.9" /><path d="M2 12h4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M12 18v4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M18 12h4" /><path d="m16.2 7.8 2.9-2.9" />
      </svg>
    ),
  },
  {
    id: 7,
    title: "AI Travel Planner",
    tagline: "Instant luxe itineraries.",
    desc: "Instant, AI-driven travel planning that learns from your desires.",
    fullDesc: "Taking the innovation of TouraLuxe to the digital frontier. Our AI Travel Planner uses generative intelligence to build complex itineraries in real-time. Simply describe your mood, and our system will bank the aircraft towards your next dream destination, presenting a fully-costed plan in seconds.",
    image: "/assets/services/ai.png",
    highlights: ["Generative Planning", "Instant Price Breakdown", "Dynamic Scenic Sync", "24/7 AI Support"],
    cta: "Start Planning",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" />
      </svg>
    ),
  },
];






export function Services() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { openModal } = useBooking();
  const { settings } = useSettings();

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
        openModal('SERVICES', service);
      }
    };

    window.addEventListener('open-service-modal', handleRemoteOpen);
    return () => window.removeEventListener('open-service-modal', handleRemoteOpen);
  }, [openModal]);

  return (
    <section ref={containerRef} id="services" className="scroll-mt-20 pt-10 pb-20 md:pt-16 md:pb-32 px-6 w-full bg-black text-foreground min-h-screen flex flex-col items-center overflow-hidden">
      <div className="max-w-[1200px] w-full mx-auto">
        <div className="services-header mb-20 max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6 opacity-0">{settings.services_title || "Beyond First Class."}</h2>
          <p className="text-lg md:text-xl text-[#86868b] tracking-wide opacity-0 whitespace-pre-wrap">{settings.services_description || "Our specialized divisions cater to every facet of high-end lifestyle and corporate excellence."}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {SERVICES.map((service, index) => (
            <div key={service.title} ref={(el) => { cardsRef.current[index] = el; }} className="opacity-0 h-full" onClick={() => openModal('SERVICES', service)}>
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
    </section>
  );
}