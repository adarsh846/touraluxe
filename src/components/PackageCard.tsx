"use client";

import { useRef } from "react";
import Image from "next/image";
import { MapPin, TrendingUp, Star, Sparkles, Zap, Tag, ArrowRight } from "lucide-react";
import { Magnetic } from "./Magnetic";
import type { Package } from "@/lib/supabase";
import { usePricing } from "@/hooks/usePricing";
import { cn } from "@/lib/utils";

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
  const { computePrice } = usePricing();
  const pricing = computePrice(pkg);

  const badge = (pkg as any).badge ? BADGE_CONFIG[(pkg as any).badge] : null;
  const BadgeIcon = badge?.icon;
  const difficulty = (pkg as any).difficulty_level;
  const routeStart = (pkg as any).route_start;

  return (
    <Magnetic intensity={0.08} className="block w-full">
      <div
        ref={cardRef}
        className="group relative flex flex-col rounded-2xl md:rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-700 cursor-pointer transform-gpu will-change-transform hover:translate-y-[-4px] hover:shadow-[0_20px_60px_-20px_rgba(255,255,255,0.06)]"
        onClick={() => onClick(pkg)}
      >
        {/* Cinematic Image Container */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-white/5">
          <Image
            src={pkg.image}
            alt={pkg.title}
            fill
            className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.08]"
            quality={85}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Enhanced Cinematic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent transition-opacity duration-700" />
          
          {/* Status Badges Layer */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            {badge && BadgeIcon ? (
              <div className={cn("px-3 py-1 rounded-full border flex items-center gap-1.5 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700", badge.bg)}>
                <BadgeIcon size={10} className={badge.color} />
                <span className={cn("text-[9px] font-black uppercase tracking-widest", badge.color)}>{(pkg as any).badge}</span>
              </div>
            ) : <div />}

            {pricing.hasSavings && (
              <div className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
                <span className="text-[9px] font-black text-emerald-400">-{pricing.discountPercent}%</span>
              </div>
            )}
          </div>

          {/* Core Content Overlay */}
          <div className="absolute inset-0 p-5 md:p-6 pb-6 md:pb-8 flex flex-col justify-end">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="space-y-1">
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight truncate drop-shadow-lg">
                    {pkg.title}
                  </h3>
                  <div className="flex items-center gap-3 text-white/50">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <MapPin size={10} className="shrink-0" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] truncate">
                        {routeStart || pkg.location}
                      </p>
                    </div>
                    <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.2em] text-white/70">
                      {pkg.duration}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl md:text-2xl font-black text-white tracking-tighter">
                      {pricing.formattedFinal}
                    </span>
                    {pricing.hasSavings && (
                      <span className="text-xs font-bold text-white/20 line-through italic">
                        {pricing.formattedOriginal}
                      </span>
                    )}
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">
                    Per person · {pricing.taxLabel}
                  </p>
                </div>
              </div>
              
              {/* Interaction Indicator */}
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl">
                <ArrowRight size={18} strokeWidth={2.5} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Magnetic>
  );
}
