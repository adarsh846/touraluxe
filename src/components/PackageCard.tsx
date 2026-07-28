"use client";

import { memo } from "react";
import Image from "next/image";
import { MapPin, ArrowRight, Plane } from "lucide-react";
import { Magnetic } from "@/components/Magnetic";
import { PackageBadges } from "@/components/ui/PackageBadges";
import { usePricing } from "@/hooks/usePricing";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════
// UNIFIED PACKAGE CARD — Single source of truth for all variants
// ═══════════════════════════════════════════════════════════════
//
// Variants:
//   "compact"    → Image on top, content body below (Destination pages, grids)
//   "editorial"  → Full-bleed image, cinematic overlay (Services, Discovery)
//   "trending"   → Full-bleed image, minimal overlay (BookingContent trending)

interface PackageCardProps {
  pkg: any;
  onClick: ((pkg: any) => void) | (() => void);
  variant?: "compact" | "editorial" | "trending";
  className?: string;
  /** External pricing — if omitted, computed internally via usePricing */
  pricing?: any;
  /** Match data for authority badges (Discovery results) */
  matchData?: {
    label: string;
    authority: string;
  };
  index?: number;
}

export const PackageCard = memo(function PackageCard({
  pkg,
  onClick,
  variant = "compact",
  className,
  pricing: externalPricing,
  matchData,
  index = 0,
}: PackageCardProps) {
  const { computePrice } = usePricing();
  const pricing = externalPricing || computePrice(pkg);
  const routeStart = pkg.route_start;
  const routeEnd = pkg.route_end;

  const handleClick = () => {
    // Support both (pkg) => void and () => void signatures
    (onClick as any)(pkg);
  };

  // ────────────────────────────────────
  // VARIANT: COMPACT (image-top layout)
  // ────────────────────────────────────
  if (variant === "compact") {
    return (
      <div className={cn("block w-full", className)}>
        <Magnetic intensity={0.05} className="block w-full h-full">
          <div
            className="group relative flex flex-col rounded-3xl overflow-hidden bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-white/20 transition-all duration-700 cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] h-full"
            onClick={handleClick}
          >
            {/* Cinematic Image Container */}
            <div className="relative w-full aspect-[16/10] overflow-hidden bg-white/5 shrink-0">
              <Image
                src={pkg.image}
                alt={pkg.title}
                fill
                className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 will-change-transform transform-gpu"
                quality={85}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <PackageBadges pkg={pkg} pricing={pricing} size="sm" />
            </div>

            {/* Card Body */}
            <div className="flex flex-col flex-1 p-5 md:p-6 justify-between gap-5 bg-[#0f0f12]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50">
                    {pkg.duration}
                  </span>
                  {pkg.flights_status === 'included' ? (
                    <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/15">
                      <Plane size={9} />
                      <span>Flights Included</span>
                    </div>
                  ) : pkg.flights_status === 'on_request' ? (
                    <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-sky-400/80 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/15">
                      <Plane size={9} />
                      <span>Flights on Request</span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg md:text-xl font-bold tracking-tight text-white leading-tight group-hover:text-amber-400 transition-colors duration-500">
                    {pkg.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-white/40">
                    <MapPin size={10} className="shrink-0" />
                    <span className="text-[8.5px] font-black uppercase tracking-[0.18em] truncate">
                      {routeStart ? `${routeStart}${routeEnd ? ` ➔ ${routeEnd}` : ""}` : pkg.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg md:text-xl font-black text-white tracking-tighter tabular-nums">
                        {pricing.formattedFinal}
                      </span>
                      {pricing.hasSavings && (
                        <span className="text-xs font-semibold text-white/75 line-through decoration-rose-400/90 italic tabular-nums">
                          {pricing.formattedOriginal}
                        </span>
                      )}
                    </div>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">
                      Per person · {pricing.taxLabel}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center translate-y-1 opacity-0 scale-90 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 shadow-lg shrink-0">
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Magnetic>
      </div>
    );
  }

  // ────────────────────────────────────────────
  // VARIANT: EDITORIAL (full-bleed image overlay)
  // ────────────────────────────────────────────
  if (variant === "editorial") {
    const resolvedMatchData = matchData || (pkg.match_label ? {
      label: pkg.match_label,
      authority: pkg.authority_type
    } : undefined);

    return (
      <div className={cn("flex-shrink-0 snap-center snap-always", className)}>
        <Magnetic intensity={0.04} className="w-full h-full block">
          <div
            onClick={handleClick}
            className={cn(
              "group/card relative w-full h-full rounded-3xl md:rounded-[28px] overflow-hidden cursor-pointer border transition-all duration-700 shadow-2xl lg:hover:translate-y-[-8px] lg:hover:scale-[1.01] transform-gpu backface-hidden",
              pkg.authority_type === 'gold'
                ? "border-amber-400/40 hover:border-amber-400/60 shadow-[0_10px_40px_-5px_rgba(251,191,36,0.2)] hover:shadow-[0_15px_50px_-5px_rgba(251,191,36,0.3)]"
                : pkg.authority_type === 'silver'
                  ? "border-white/10 hover:border-white/20 shadow-[0_10px_30px_-5px_rgba(255,255,255,0.05)] hover:shadow-[0_15px_40px_-5px_rgba(255,255,255,0.1)]"
                  : "border-white/[0.03] hover:border-white/10 hover:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.5)]"
            )}
          >
            {/* Hero Image */}
            <div className="absolute inset-0">
              <Image
                src={pkg.image}
                alt={pkg.title}
                fill
                className="object-cover transition-transform duration-[2s] group-hover/card:scale-[1.08] transform-gpu backface-hidden"
                decoding="async"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />

            {/* Status Badges */}
            <PackageBadges
              pkg={pkg}
              pricing={pricing}
              matchData={resolvedMatchData}
            />

            {/* Editorial Content Overlay */}
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
              <div className="space-y-4 w-full">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="text-[clamp(1.2rem,3.5vw,2rem)] text-balance font-black tracking-tight text-white/90 drop-shadow-2xl leading-none">
                      {pkg.title}
                    </h3>
                  </div>
                </div>

                <div className="pt-2 flex items-end justify-between gap-4 h-16">
                  {/* Duration */}
                  <div className="space-y-1">
                    <p className="text-sm md:text-lg font-bold text-white/90 italic drop-shadow-lg leading-tight">
                      {pkg.duration?.includes('Nights') ? (
                        <>
                          <span className="whitespace-nowrap">{pkg.duration.split('Nights')[0].trim()} Nights</span>
                          <br />
                          <span className="whitespace-nowrap">{pkg.duration.split('Nights')[1].trim()}</span>
                        </>
                      ) : pkg.duration}
                    </p>
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 block drop-shadow-md">
                      Duration
                    </span>
                  </div>

                  {/* Price & Savings */}
                  <div className="space-y-0.5 text-right">
                    {pricing?.hasSavings ? (
                      <span className="text-xs md:text-sm font-bold line-through text-white/80 decoration-rose-400/90 block mb-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-tight">
                        {pricing.symbol}{pricing.originalTotal.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-xs md:text-sm font-bold text-transparent block mb-0.5 pointer-events-none select-none">
                        &nbsp;
                      </span>
                    )}
                    <p className="text-[clamp(1.4rem,3.5vw,2rem)] font-black text-white tracking-tighter leading-none drop-shadow-xl">
                      {pricing?.formattedFinal}
                    </p>
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 block mt-1 drop-shadow-md">
                      Per Person
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Magnetic>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // VARIANT: TRENDING (minimal full-bleed overlay)
  // ──────────────────────────────────────────────
  return (
    <div className={cn("flex-shrink-0 snap-center snap-always", className)}>
      <Magnetic intensity={0.08} className="w-full h-full block">
        <div
          onClick={handleClick}
          className="group/card relative w-full h-full rounded-3xl md:rounded-[28px] overflow-hidden cursor-pointer border border-white/[0.08] hover:border-white/30 transition-all duration-700 shadow-2xl lg:hover:translate-y-[-4px] transform-gpu backface-hidden"
        >
          {/* Hero Image */}
          <div className="absolute inset-0">
            <Image
              src={pkg.image}
              alt={pkg.title}
              fill
              className="object-cover transition-transform duration-[2s] group-hover/card:scale-[1.08] transform-gpu backface-hidden"
              decoding="async"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />

          {/* Trending Content Overlay */}
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="flex items-end justify-between gap-4">
              <div className="text-left space-y-1">
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 block">
                  Trending Destiny
                </span>
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white/90 italic">
                  {pkg.title}
                </h3>
              </div>

              <div className="w-10 h-10 rounded-full bg-white/15 border border-white/10 flex items-center justify-center translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-500 shadow-2xl">
                <ArrowRight size={18} strokeWidth={2.5} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </Magnetic>
    </div>
  );
});
PackageCard.displayName = "PackageCard";
