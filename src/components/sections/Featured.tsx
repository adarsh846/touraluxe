"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Magnetic } from "../Magnetic";
import { useBooking } from "../BookingProvider";

gsap.registerPlugin(ScrollTrigger);

const EXPERIENCES = [
  {
    id: 1,
    title: "Alpine Chalet Retreat",
    location: "Swiss Alps",
    image: "/assets/chalet.webp",
    price: "€12,500",
    duration: "7 Nights",
    guests: "Up to 8",
    season: "Dec — Mar",
    tagline: "Where silence meets grandeur.",
    description:
      "Perched above the clouds in a hand-built timber chalet, this retreat is a masterclass in alpine luxury. Floor-to-ceiling windows frame the Matterhorn as a private chef prepares farm-to-table cuisine. Heli-ski pristine powder by day, unwind in a cedar-lined infinity spa by night.",
    highlights: [
      "Private helicopter transfers from Zürich",
      "Dedicated Michelin-trained private chef",
      "Exclusive heli-skiing with certified guides",
      "Cedar wood infinity spa with panoramic views",
      "Curated wine cellar with 200+ Swiss vintages",
      "Personal concierge available 24/7",
    ],
  },
  {
    id: 2,
    title: "Coastal Villa Mastery",
    location: "Amalfi Coast, Italy",
    image: "/assets/villa.webp",
    price: "€18,900",
    duration: "10 Nights",
    guests: "Up to 12",
    season: "May — Oct",
    tagline: "La dolce vita, redefined.",
    description:
      "A 17th-century cliffside villa restored to perfection, cascading down toward the Tyrrhenian Sea. Private terraces draped in bougainvillea, a salt-water infinity pool that dissolves into the horizon, and a personal yacht anchored below for spontaneous coastal exploration.",
    highlights: [
      "Restored 17th-century heritage architecture",
      "Private 65ft yacht with captain and crew",
      "Cliffside infinity pool with sea-level access",
      "Exclusive Pompeii after-hours private tour",
      "Amalfi lemon grove cooking masterclass",
      "Sunset sommelier sessions on the terrace",
    ],
  },
  {
    id: 3,
    title: "Private Island Sanctuary",
    location: "Baa Atoll, Maldives",
    image: "/assets/island.webp",
    price: "€32,000",
    duration: "14 Nights",
    guests: "Up to 6",
    season: "Year-round",
    tagline: "Your own coordinates on Earth.",
    description:
      "An entire island, exclusively yours. Crystal lagoons, untouched coral reefs, and a single overwater villa designed by Kengo Kuma. A marine biologist guides private reef explorations, while a wellness practitioner tailors daily rituals to the rhythm of the tides.",
    highlights: [
      "Entire private island — zero other guests",
      "Overwater villa designed by Kengo Kuma",
      "Personal marine biologist for reef expeditions",
      "Seaplane transfers from Malé",
      "Tailored Ayurvedic wellness program",
      "Underwater dining experience at 16ft depth",
    ],
  },
];

/* ── APPLE-STYLE MODAL ── */
export function Featured() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [experiences, setExperiences] = useState(EXPERIENCES);
  const { openModal } = useBooking();

  // Fetch packages from DB, fall back to hardcoded data
  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (data && data.length > 0) setExperiences(data);
      })
      .catch(() => {/* DB not available — use hardcoded fallback */});
  }, []);

  useEffect(() => {
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

      // Restore individual reveals to match original visual feel
      itemsRef.current.forEach((item, index) => {
        if (!item) return;

        gsap.fromTo(
          item,
          {
            y: 100,
            x: index % 2 === 0 ? -60 : 60,
            opacity: 0,
          },
          {
            y: 0,
            x: 0,
            opacity: 1,
            duration: 1.8,
            ease: "expo.out",
            scrollTrigger: {
              trigger: item,
              start: "top 90%",
            },
          }
        );

        // Optimized Parallax
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
  }, [experiences]);

  return (
    <section
      ref={containerRef}
      id="featured"
      className="relative z-10 py-32 px-6 w-full bg-[#0a0a0a] min-h-screen flex flex-col justify-center overflow-hidden"
    >
      <div className="max-w-[1200px] w-full mx-auto relative z-20">
        <h2
          ref={titleRef}
          className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-16 opacity-0"
        >
          Craft New Journey.
        </h2>

        <div className="flex flex-col gap-12 md:gap-24">
          {experiences.map((pkg: { id: string | number; title: string; location: string; image: string; price: string; duration: string; guests: string; currency?: string; }, idx: number) => (
            <div
              key={pkg.id}
              ref={(el) => { itemsRef.current[idx] = el; }}
              className="group relative flex flex-col md:flex-row gap-8 items-center opacity-0 transform-gpu will-change-transform"
            >
              {/* Image Container with strict hover constraints */}
              <div className="relative w-full md:w-2/3 aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 transform-gpu will-change-transform">
                <Image
                  src={pkg.image}
                  alt={pkg.title}
                  fill
                  className="object-cover will-change-transform transform-gpu"
                  quality={75}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 760px"
                />
              </div>

              {/* Text Content */}
              <div className="w-full md:w-1/3 flex flex-col items-start gap-4 p-4 md:p-8">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {pkg.location}
                </span>
                <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground">
                  {pkg.title}
                </h3>
                <span className="text-sm text-[#86868b] font-medium">{pkg.currency || ""}{Number(pkg.price.toString().replace(/[^0-9]/g, "")).toLocaleString('en-IN')} / Person · {pkg.duration}</span>
                <Magnetic>
                  <button
                    onClick={() => openModal('PACKAGE', pkg)}
                    className="mt-4 border-b border-foreground/30 pb-1 text-sm font-medium transition-colors hover:border-foreground uppercase tracking-wider text-muted hover:text-foreground"
                  >
                    View Details
                  </button>
                </Magnetic>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

