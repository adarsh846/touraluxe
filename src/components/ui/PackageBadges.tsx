import { cn } from "@/lib/utils";
import { BADGE_CONFIG } from "@/lib/badges";
import { Sparkles } from "lucide-react";

interface PackageBadgesProps {
  pkg: any;
  pricing?: {
    hasSavings: boolean;
    discountPercent: number;
  };
  className?: string;
  size?: "sm" | "md";
  matchData?: {
    label: string;
    authority: string;
  };
}

export function PackageBadges({ pkg, pricing, className, size = "md", matchData }: PackageBadgesProps) {
  const badgeConfig = pkg.badge ? BADGE_CONFIG[pkg.badge] : null;
  const BadgeIcon = badgeConfig?.icon || Sparkles;

  return (
    <div className={cn("absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 flex items-center justify-between pointer-events-none z-20 gap-2", className)}>
      {/* Left Badge: Primary Category/Status (Trending, Bestseller, etc.) */}
      <div className="flex items-center gap-2">
        {pkg.badge ? (
          <div className="flex items-center gap-1.5 px-3 py-1 md:px-3.5 md:py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 duration-500">
            <BadgeIcon size={11} className={cn(badgeConfig?.color || "text-amber-400")} strokeWidth={2.2} />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
              {pkg.badge}
            </span>
          </div>
        ) : matchData?.label ? (
          <div className="flex items-center gap-1.5 px-3 py-1 md:px-3.5 md:py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 duration-500">
            <Sparkles size={11} className="text-amber-400" strokeWidth={2.2} />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
              {matchData.label}
            </span>
          </div>
        ) : <div />}
      </div>

      {/* Right Badge: Savings % Tag */}
      <div className="flex items-center gap-2">
        {pricing?.hasSavings && (
          <div className="flex items-center px-2.5 py-1 md:px-3 md:py-1 rounded-full bg-emerald-500/15 backdrop-blur-xl border border-emerald-500/30 text-emerald-300 shadow-[0_4px_15px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-500">
            <span className="text-[9px] md:text-[10px] font-bold tracking-wider">
              -{pricing.discountPercent}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
