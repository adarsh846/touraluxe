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
  const isSmall = size === "sm";

  return (
    <div className={cn("absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 flex items-start justify-between pointer-events-none z-20", className)}>
      {pkg.badge ? (
        <div className={cn(`rounded-full border flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-4 duration-700`, badgeConfig?.bg || "bg-[#1a1a1f]/90 border-white/10", "px-2 py-0.5 md:px-3 md:py-1.5 gap-1 md:gap-1.5")}>
          <BadgeIcon size={8} className={cn(badgeConfig?.color || "text-white/80", "md:w-[12px] md:h-[12px]")} />
          <span className={cn("font-black uppercase tracking-widest text-center", badgeConfig?.color || "text-white/80", "text-[7px] md:text-[9px]")}>
            {pkg.badge}
          </span>
        </div>
      ) : <div />}

      <div className="flex flex-col items-end gap-1.5 md:gap-2">
        {matchData && matchData.label && (
          <div className={cn(
            "rounded-full border flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-right-4 duration-700",
            "px-2 py-0.5 md:px-3 md:py-1.5 gap-1 md:gap-1.5",
            matchData.authority === 'gold' ? "bg-amber-950/80 border-amber-400/30 text-amber-100" :
              matchData.authority === 'silver' ? "bg-zinc-900/80 border-white/30 text-white" :
                "bg-[#1a1a1f]/90 border-white/10 text-white/70"
          )}>
            <span className={cn("font-black uppercase tracking-widest text-center", "text-[7px] md:text-[9px]")}>
              {matchData.label}
            </span>
          </div>
        )}

        {pricing?.hasSavings && (
          <div className={cn(`rounded-full bg-emerald-600 border border-emerald-500 shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-right-4 duration-700 delay-150 flex items-center justify-center`, "w-6 h-6 md:w-8 md:h-8")}>
            <span className={cn("font-black text-white text-center", "text-[8px] md:text-[10px]")}>
              -{pricing.discountPercent}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
