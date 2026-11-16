"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Magnetic } from "../Magnetic";
import { Plane, MapPin } from "lucide-react";
import { useBooking } from "../BookingProvider";
import { usePricing } from "@/hooks/usePricing";
import type { Package } from "@/lib/supabase";

gsap.registerPlugin(ScrollTrigger);

export const DEFAULT_FEATURED_PACKAGES: Package[] = [
  {
    id: "feat-alpine-sanctuary",
    title: "The Alpine Sanctuary",
    location: "Zermatt, Switzerland",
    image: "/assets/chalet.webp",
    price: "450000",
    original_price: "520000",
    duration: "7 Days, 6 Nights",
    guests: "Couples, Private Groups",
    season: "Nov – Apr",
    tagline: "An ultra-exclusive winter chalet nestled against the Matterhorn, offering private ski-in access and Michelin dining.",
    description: "Experience the pinnacle of alpine luxury with panoramic Matterhorn views, ski-in/ski-out private slope access, an expansive indoor heated wellness spa, and an internationally renowned private chef curating every dining moment.",
    highlights: [
      "Matterhorn Panoramic Chalet",
      "Private Ski-In / Ski-Out Access",
      "Dedicated Michelin-Trained Chef",
      "Helicopter Glacier Tour"
    ],
    inclusions: [
      "All Gourmet Meals & Wine Pairing",
      "Round-trip Private Helicopter Transfer",
      "Ski Pass & Dedicated Alpine Guide",
      "Full Spa Concierge Access"
    ],
    exclusions: [
      "Personal Winter Apparel",
      "Discretionary Gratuities"
    ],
    itinerary: [
      { day: "Day 1", title: "Helicopter Arrival & Chalet Induction", description: "Arrive via private helicopter from Zurich or Geneva directly to the Zermatt heliport. Welcome champagne reception and chalet orientation." },
      { day: "Day 2", title: "Private Glacier Skiing", description: "First tracks on the Matterhorn Glacier Paradise accompanied by your private Olympic-certified ski instructor." },
      { day: "Day 3", title: "Alpine Wellness & Fireside Dining", description: "Full restorative spa day featuring Swiss botanical therapies followed by an intimate 7-course fireside tasting menu." }
    ],
    category: ["Luxury Tours", "Adventure Tours"],
    is_published: true,
    is_featured: true,
    sort_order: 1,
    flights_status: "included" as const,
    flight_type: "Business Class",
    difficulty_level: "Easy",
    destination: "Switzerland",
    region: "Europe",
    trip_type: "luxury",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "feat-maldivian-atoll",
    title: "Private Atoll Sanctuary",
    location: "Baa Atoll, Maldives",
    image: "/assets/island.webp",
    price: "680000",
    original_price: "750000",
    duration: "6 Days, 5 Nights",
    guests: "Couples, Families",
    season: "Year-round",
    tagline: "Overwater residences situated on a UNESCO Biosphere Reserve, framed by turquoise lagoons and bespoke butler service.",
    description: "Suspended over sapphire waters in the heart of a UNESCO Biosphere Reserve. Features private infinity plunge pools, uninterrupted sunset vistas, bespoke marine biologist excursions with manta rays, and 24-hour dedicated butler care.",
    highlights: [
      "Overwater Infinity Residence",
      "UNESCO Marine Biologist Safari",
      "Private Sunset Yacht Charter",
      "24/7 Dedicated Island Butler"
    ],
    inclusions: [
      "Round-trip VIP Seaplane Transfer",
      "Daily Sunset Champagne & Canapés",
      "Private Sandbank Candlelit Dinner",
      "All-Inclusive Premium Dining & Sommelier Selection"
    ],
    exclusions: [
      "Motorized Deep Sea Big Game Fishing",
      "Imported Rare Vintage Spirits"
    ],
    itinerary: [
      { day: "Day 1", title: "Seaplane Touchdown & Island Welcome", description: "Scenic twin-otter seaplane flight across azure atolls. Private jetty welcome by your personal butler and luggage concierge." },
      { day: "Day 2", title: "Hanifaru Bay Biosphere Excursion", description: "Private expedition to snorkel alongside majestic manta rays and gentle whale sharks guided by the resident marine biologist." },
      { day: "Day 3", title: "Sunset Dhoni & Sandbank Serenade", description: "Embark on a traditional hand-crafted luxury Dhoni yacht for sunset champagne, followed by dinner on an uninhabited sandbank." }
    ],
    category: ["Luxury Tours", "Luxury Honeymoons"],
    is_published: true,
    is_featured: true,
    sort_order: 2,
    flights_status: "included" as const,
    flight_type: "First Class",
    difficulty_level: "Easy",
    destination: "Maldives",
    region: "Indian Ocean",
    trip_type: "luxury",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "feat-amalfi-haven",
    title: "Villa Belle Époque",
    location: "Amalfi Coast, Italy",
    image: "/assets/villa.webp",
    price: "520000",
    original_price: "590000",
    duration: "8 Days, 7 Nights",
    guests: "Couples, Private Parties",
    season: "May – Oct",
    tagline: "Cliffside cloisters overlooking the Tyrrhenian Sea, with chartered yacht access and cliffside infinity pools.",
    description: "Perched high on the dramatic cliffs of Positano, this historic cliffside estate combines classical Italian architecture with contemporary ultra-luxury amenities. Includes private Riva yacht charters to Capri and private sommelier cellar tastings.",
    highlights: [
      "Cliffside Panoramic Estate",
      "Private Riva Yacht to Capri",
      "Historic Sommelier Cellar",
      "Secluded Sea Access & Helipad"
    ],
    inclusions: [
      "Private Mercedes Maybach Transfers",
      "Daily Continental Breakfast & Private Chef Dinner",
      "Chartered Riva Yacht Day Excursion to Capri",
      "VIP Fast-Track Access to Amalfi Landmarks"
    ],
    exclusions: [
      "High-Season Harbor Docking Fees Outside Capri",
      "Personal Shopping Concierge Purchases"
    ],
    itinerary: [
      { day: "Day 1", title: "Naples Chauffeur & Cliffside Induction", description: "VIP tarmac greeting at Naples International. Private Maybach transfer along the coastal highway to your Positano sanctuary." },
      { day: "Day 2", title: "Capri Private Riva Yacht Charter", description: "Full-day cruise aboard a classic Riva Dolceriva yacht. Explore secluded sea caves and swim in crystal turquoise waters." },
      { day: "Day 3", title: "Sommelier Cellar & Lemongrove Dinner", description: "Private cellar tour with vintage Campanian pairings, followed by a candlelit dinner under centenarian lemon groves." }
    ],
    category: ["Luxury Tours", "Custom Journeys"],
    is_published: true,
    is_featured: true,
    sort_order: 3,
    flights_status: "on_request" as const,
    flight_type: "Business Class",
    difficulty_level: "Easy",
    destination: "Italy",
    region: "Europe",
    trip_type: "luxury",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }
];

export function Featured() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [experiences, setExperiences] = useState<Package[]>(DEFAULT_FEATURED_PACKAGES);
  const { openModal } = useBooking();
  const { computePrice } = usePricing();

  useEffect(() => {
    let isMounted = true;
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/packages?featured=true&limit=5");
        if (!res.ok) throw new Error("Failed to fetch featured journeys");
        const data = await res.json();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setExperiences(data);
        }
      } catch (err) {
        console.warn("Using curated featured journeys (database unreachable or offline):", err);
      }
    }
    fetchFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (experiences.length === 0) return;

    itemsRef.current = itemsRef.current.slice(0, experiences.length);

    const ctx = gsap.context(() => {
      // Pre-promote title to GPU layer
      if (titleRef.current) titleRef.current.style.willChange = "transform, opacity";

      // Title reveal
      gsap.fromTo(titleRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1.5, ease: "expo.out", force3D: true,
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
            once: true,
          }
        }
      );

      // Card reveals
      itemsRef.current.forEach((item, index) => {
        if (!item) return;

        const revealTarget = item.querySelector<HTMLElement>(".reveal-inner");
        if (revealTarget) {
          // Pre-promote so browser allocates compositor layer before animation starts
          revealTarget.style.willChange = "transform, opacity";
          gsap.fromTo(revealTarget,
            { y: 100, x: index % 2 === 0 ? -60 : 60, opacity: 0 },
            {
              y: 0, x: 0, opacity: 1, duration: 1.8, ease: "expo.out",
              force3D: true,
              scrollTrigger: { trigger: item, start: "top 90%", once: true }
            }
          );
        }

        const imgWrapper = item.querySelector<HTMLElement>(".parallax-bg");
        if (imgWrapper) {
          // Pre-promote image wrapper — critical for parallax smoothness
          imgWrapper.style.willChange = "transform";
          gsap.set(imgWrapper, { force3D: true });
          gsap.fromTo(imgWrapper,
            { yPercent: -15 },
            {
              yPercent: 15,
              ease: "none",
              force3D: true,
              scrollTrigger: {
                trigger: item,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.5, // Damped scrub prevents GPU re-rasterization on every tick
              }
            }
          );
        }
      });

      ScrollTrigger.refresh();
    }, containerRef);

    return () => ctx.revert();
  }, [experiences]);

  return (
    <section
      ref={containerRef}
      id="featured"
      className="relative z-10 py-[clamp(5rem,8vw,6rem)] px-6 w-full bg-[#0a0a0a] flex flex-col justify-center"
    >
      <div className="max-w-[1200px] w-full mx-auto relative z-20">
        <h2
          ref={titleRef}
          className="text-[clamp(2rem,8vw,3.75rem)] text-balance font-semibold tracking-tight text-white mb-16 opacity-0 leading-tight"
        >
          Craft New Journey.
        </h2>

        <div className="flex flex-col gap-[clamp(3rem,8vw,6rem)]">
          {experiences.map((exp, index) => {
            const pricing = computePrice(exp);
            const isEven = index % 2 === 0;
            
            const quote = exp.tagline || "A bespoke sanctuary designed to deliver absolute comfort and pristine memories.";

            return (
              <div
                key={exp.id}
                ref={(el) => { if (el) itemsRef.current[index] = el; }}
                className="group relative w-full"
              >
                <div 
                  className={`reveal-inner flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-[clamp(3rem,6vw,5rem)] items-center w-full opacity-0 transform-gpu`}
                  style={{ transform: "translate3d(0,0,0)" }}
                >
                  {/* Image Container — Stable gold-bordered card that scales image cleanly */}
                  <div className="relative w-full md:w-3/5 aspect-[4/3] rounded-[2.5rem] border border-white/10 group-hover:border-amber-400/80 bg-[#0a0a0b] overflow-hidden transform-gpu transition-[border-color,box-shadow] duration-700 shadow-2xl group-hover:shadow-[0_0_60px_rgba(251,191,36,0.12)]">
                    <div className="parallax-bg absolute inset-[-15%] w-[130%] h-[130%]">
                      <Image
                         src={exp.image}
                         alt={exp.title}
                         fill
                         className="object-cover transform-gpu transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.25,1)] group-hover:scale-110"
                         quality={85}
                         sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 760px"
                      />
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="w-full md:w-2/5 flex flex-col items-start gap-[clamp(1.25rem,3vw,1.5rem)] p-[clamp(1rem,3vw,1.5rem)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 leading-none max-w-[180px] sm:max-w-[240px] overflow-hidden">
                        <MapPin size={9} className="shrink-0" />
                        <span className="leading-none truncate">{exp.location}</span>
                      </span>
                      {exp.flights_status === 'included' && (
                        <span className="inline-flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 leading-none whitespace-nowrap">
                          <Plane size={9} className="shrink-0" />
                          <span className="leading-none">Flights Incl.</span>
                        </span>
                      )}
                      {exp.flights_status === 'on_request' && (
                        <span className="inline-flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-blue-400/80 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 leading-none whitespace-nowrap">
                          <Plane size={9} className="shrink-0" />
                          <span className="leading-none">Flights on Req.</span>
                        </span>
                      )}
                    </div>
                    
                    <h3 
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      className="text-[clamp(1.5rem,7vw,3rem)] text-balance font-light italic tracking-tight text-white leading-[1.1] drop-shadow-md group-hover:text-amber-400/90 transition-colors duration-700 animate-pulse-once"
                    >
                      {exp.title}
                    </h3>
                    
                    {/* Poetical Concierge Summary */}
                    <p className="text-xs md:text-sm text-[#a1a1a6] tracking-wide leading-relaxed font-normal italic">
                      &ldquo;{quote}&rdquo;
                    </p>

                    {/* Luxury Travel Manifest details */}
                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-y-3 gap-x-4 xs:gap-4 w-full py-4 my-2 border-y border-white/12 text-left">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#86868b] mb-1">Duration</p>
                        <p className="text-xs font-semibold text-white/95">{exp.duration || 'Flexible'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#86868b] mb-1">Ideal For</p>
                        <p className="text-xs font-semibold text-white/95">{exp.guests || 'Couples, Families'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#86868b] mb-1">Flight Status</p>
                        <p className="text-xs font-semibold text-white/95">
                          {exp.flights_status === 'included'
                            ? `Included ${exp.flight_type ? `(${exp.flight_type})` : ''}`
                            : exp.flights_status === 'on_request'
                            ? 'On Request'
                            : 'Excluded'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg text-white font-semibold">
                          {pricing.formattedFinal} <span className="text-[10px] text-white/60 uppercase tracking-widest ml-1 font-normal">/ Person</span>
                        </span>
                        {pricing.hasSavings && (
                          <span className="text-xs text-white/60 font-medium line-through decoration-rose-400/80">{pricing.formattedOriginal}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#86868b]">
                        {pricing.taxLabel}
                      </span>
                    </div>

                    <Magnetic>
                      <button
                        onClick={() => openModal('PACKAGE', exp)}
                        className="mt-4 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white px-7 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)] active:scale-95"
                      >
                        Request Access
                      </button>
                    </Magnetic>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
