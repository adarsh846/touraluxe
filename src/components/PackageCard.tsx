"use client";

import { useRef } from "react";
import Image from "next/image";
import { Clock, MapPin, Users, TrendingUp, Star, Sparkles, Zap, Tag } from "lucide-react";
import { Magnetic } from "./Magnetic";
import type { Package } from "@/lib/supabase";

const BADGE_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; bg: string }> = {
  Trending: { icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  Bestseller: { icon: Star, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  New: { icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  Recommended: { icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  "Super Saver": { icon: Tag, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
};

interface PackageCardProps {
  pkg: Package;
  onClick: (pkg: Package) => void;
  index?: number;
}

export function PackageCard({ pkg, onClick, index = 0 }: PackageCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const badge = (pkg as any).badge ? BADGE_CONFIG[(pkg as any).badge] : null;
  const BadgeIcon = badge?.icon;
  const originalPrice = (pkg as any).original_price;
  const hasDiscount = originalPrice && parseInt(String(originalPrice).replace(/[^0-9]/g, "")) > 0;
  const currency = pkg.currency || "₹";
  const routeStart = (pkg as any).route_start;
  const routeEnd = (pkg as any).route_end;
  const difficulty = (pkg as any).difficulty_level;

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col rounded-2xl md:rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-700 cursor-pointer transform-gpu will-change-transform hover:translate-y-[-4px] hover:shadow-[0_20px_60px_-20px_rgba(255,255,255,0.06)]"
      onClick={() => onClick(pkg)}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-white/5">
        <Image
          src={pkg.image}
          alt={pkg.title}
          fill
          className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.06]"
          quality={75}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badge */}
        {badge && BadgeIcon && (
          <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-xl text-[9px] font-bold uppercase tracking-[0.15em] ${badge.bg} ${badge.color}`}>
            <BadgeIcon size={11} strokeWidth={2.5} />
            {(pkg as any).badge}
          </div>
        )}

        {/* Difficulty Badge */}
        {difficulty && difficulty !== "Easy" && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-[8px] font-bold uppercase tracking-[0.2em] text-white/60">
            {difficulty}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 md:p-6 gap-3">
        {/* Location + Duration */}
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
          <span className="flex items-center gap-1">
            <MapPin size={10} strokeWidth={2.5} />
            {pkg.location}
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-white/20" />
          <span className="flex items-center gap-1">
            <Clock size={10} strokeWidth={2.5} />
            {pkg.duration}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base md:text-lg font-semibold tracking-tight text-white/90 leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {pkg.title}
        </h3>

        {/* Route */}
        {routeStart && routeEnd && (
          <div className="flex items-center gap-2 text-[10px] text-white/25 font-medium">
            <span>{routeStart}</span>
            <span className="text-white/15">→</span>
            <span>{routeEnd}</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pricing */}
        <div className="flex items-end justify-between pt-3 border-t border-white/[0.04]">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-lg md:text-xl font-bold tracking-tight text-white">
                {currency}{parseInt(String(pkg.price).replace(/[^0-9]/g, "")).toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <span className="text-xs text-white/25 line-through font-medium">
                  {currency}{parseInt(String(originalPrice).replace(/[^0-9]/g, "")).toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">
              per person · {pkg.tax_status === "Inclusive of Taxes" ? "incl. tax" : "excl. tax"}
            </span>
          </div>

          {/* Guests indicator */}
          {pkg.guests && (
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white/20">
              <Users size={10} strokeWidth={2.5} />
              {pkg.guests}
            </div>
          )}
        </div>

        {/* CTA */}
        <Magnetic intensity={0.15}>
          <button className="w-full mt-2 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 hover:bg-white hover:text-black hover:border-white transition-all duration-500 group-hover:bg-white/[0.08]">
            View Details
          </button>
        </Magnetic>
      </div>
    </div>
  );
}
