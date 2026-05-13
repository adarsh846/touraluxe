import { TrendingUp, Star, Sparkles, Zap, Tag } from "lucide-react";

export const BADGE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  Trending: { icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  Bestseller: { icon: Star, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  New: { icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  Recommended: { icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  "Super Saver": { icon: Tag, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
};
