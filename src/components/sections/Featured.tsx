"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Image from "next/image";
import { Magnetic } from "../Magnetic";

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
function PackageModal({
  experience,
  onClose,
}: {
  experience: (typeof EXPERIENCES)[0] | null;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!experience) return;

    // Lock scroll via Lenis (no position:fixed hack = no scroll jump)
    const lenis = (window as any).__lenis;
    lenis?.stop();

    // Entrance animation
    const tl = gsap.timeline();
    tl.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" }
    );
    tl.fromTo(
      panelRef.current,
      { y: 60, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" },
      0.1
    );
    tl.fromTo(
      contentRef.current?.children ? Array.from(contentRef.current.children) : [],
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: "expo.out" },
      0.25
    );

    return () => {
      lenis?.start();
    };
  }, [experience]);

  const handleClose = useCallback(() => {
    const tl = gsap.timeline({
      onComplete: onClose,
    });
    tl.to(panelRef.current, {
      y: 40,
      opacity: 0,
      scale: 0.97,
      duration: 0.3,
      ease: "power2.in",
    });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.25, ease: "power2.in" }, 0.1);
  }, [onClose]);

  if (!experience) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 pointer-events-none">
        <div
          ref={panelRef}
          className="relative w-full max-w-[920px] max-h-[90vh] overflow-y-auto rounded-3xl bg-[#1c1c1e] border border-white/[0.06] pointer-events-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* Close Button */}
          <div className="sticky top-4 float-right mr-4 mt-4 z-50">
            <Magnetic>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-all hover:bg-white/20 hover:scale-110"
                aria-label="Close"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-white/60"
                >
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </Magnetic>
          </div>

          {/* Hero Image */}
          <div className="relative w-full aspect-[16/9] md:aspect-[2.4/1] overflow-hidden rounded-t-3xl">
            <Image
              src={experience.image}
              alt={experience.title}
              fill
              className="object-cover"
              quality={90}
              sizes="920px"
            />
            {/* Bottom gradient fade into content */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#1c1c1e] to-transparent" />

            {/* Price badge */}
            <div className="absolute bottom-6 left-8 flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
                {experience.price}
              </span>
              <span className="text-sm text-white/50 font-normal">
                / {experience.duration.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Content */}
          <div ref={contentRef} className="px-8 md:px-10 pb-10 -mt-2">
            {/* Header */}
            <div className="mb-8">
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
                { label: "Guests", value: experience.guests },
                { label: "Season", value: experience.season },
              ].map((meta) => (
                <div
                  key={meta.label}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]"
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
                {experience.highlights.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-gradient-to-br from-white/60 to-white/20 flex-shrink-0" />
                    <span className="text-[15px] text-white/70 leading-[1.5]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/[0.06]">
              <button className="flex-1 py-4 px-8 rounded-full bg-white text-black font-semibold text-[15px] tracking-tight transition-all hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]">
                Reserve This Experience
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-4 px-8 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/70 font-medium text-[15px] tracking-tight transition-all hover:bg-white/[0.1] hover:text-white hover:scale-[1.02] active:scale-[0.98]"
              >
                Back to Journeys
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN SECTION ── */
export function Featured() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [experiences, setExperiences] = useState(EXPERIENCES);
  const [activeExperience, setActiveExperience] = useState<(typeof EXPERIENCES)[0] | null>(null);

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
          y: 0, opacity: 1, duration: 1, ease: "expo.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
          }
        }
      );

      // Items slide-in with alternating horizontal movement
      itemsRef.current.forEach((item, index) => {
        if (!item) return;

        // Initial reveal
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

        // Sublayer parallax on the image internal
        const img = item.querySelector("img");
        if (img) {
          // Add initial scale to give room for parallax movement
          gsap.set(img, { scale: 1.15 });

          gsap.to(img, {
            yPercent: 10,
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
    }, containerRef);

    return () => ctx.revert();
  }, [experiences]);

  return (
    <>
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
            {experiences.map((exp, index) => (
              <div
                key={exp.id}
                ref={(el) => { itemsRef.current[index] = el; }}
                className="group relative flex flex-col md:flex-row gap-8 items-center opacity-0 will-change-transform"
              >
                {/* Image Container with strict hover constraints */}
                <div className="relative w-full md:w-2/3 aspect-[4/3] rounded-2xl overflow-hidden bg-white/5">
                  <Image
                    src={exp.image}
                    alt={exp.title}
                    fill
                    className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
                    quality={75}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 760px"
                  />
                </div>

                {/* Text Content */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-4 p-4 md:p-8">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {exp.location}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground">
                    {exp.title}
                  </h3>
                  <span className="text-sm text-[#86868b] font-medium">{exp.price} · {exp.duration}</span>
                  <Magnetic>
                    <button
                      onClick={() => setActiveExperience(exp)}
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

      {/* Apple-style Modal */}
      <PackageModal
        experience={activeExperience}
        onClose={() => setActiveExperience(null)}
      />
    </>
  );
}
