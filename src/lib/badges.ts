import { TrendingUp, Star, Sparkles, Zap, Tag } from "lucide-react";

export const BADGE_CONFIG: Record<string, { icon: any; color: string }> = {
  Trending: { icon: TrendingUp, color: "text-amber-400" },
  Bestseller: { icon: Star, color: "text-emerald-400" },
  New: { icon: Sparkles, color: "text-blue-400" },
  Recommended: { icon: Zap, color: "text-purple-400" },
  "Super Saver": { icon: Tag, color: "text-rose-400" },
};
