import { cn } from "@/lib/utils";
import { BADGE_CONFIG } from "@/lib/badges";

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
  const badge = pkg.badge ? BADGE_CONFIG[pkg.badge] : null;
  const BadgeIcon = badge?.icon;

  const isSmall = size === "sm";

  return (
    <div className={cn("absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none z-10", className)}>
      {badge && BadgeIcon ? (
        <div className={cn(`rounded-full border flex items-center backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-4 duration-700`, badge.bg, isSmall ? "px-2.5 py-1 gap-1" : "px-3 py-1.5 gap-1.5")}>
          <BadgeIcon size={isSmall ? 10 : 12} className={badge.color} />
          <span className={cn("font-black uppercase tracking-widest", badge.color, isSmall ? "text-[8px]" : "text-[9px]")}>
            {pkg.badge}
          </span>
        </div>
      ) : <div />}
      
      <div className="flex flex-col items-end gap-2">
        {matchData && (
          <div className={cn(
            "rounded-full border backdrop-blur-md flex items-center shadow-xl animate-in fade-in slide-in-from-right-4 duration-700",
            isSmall ? "px-2.5 py-1 gap-1" : "px-3 py-1.5 gap-1.5",
            matchData.authority === 'gold' ? "bg-amber-400/10 border-amber-400/30 text-amber-100" :
            matchData.authority === 'silver' ? "bg-white/10 border-white/30 text-white" :
            "bg-white/5 border-white/10 text-white/70"
          )}>
            <span className={cn("font-black uppercase tracking-widest", isSmall ? "text-[8px]" : "text-[9px]")}>
              {matchData.label}
            </span>
          </div>
        )}
        
        {pricing?.hasSavings && (
          <div className={cn(`rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-right-4 duration-700 delay-150`, isSmall ? "px-2.5 py-1" : "px-3 py-1.5")}>
            <span className={cn("font-black text-emerald-400", isSmall ? "text-[9px]" : "text-[10px]")}>
              -{pricing.discountPercent}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
