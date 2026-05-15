"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Package } from "@/lib/supabase";

export interface FilterState {
  duration: string[];
  budget: string[];
  tripType: string[];
  difficulty: string[];
  region: string[];
  theme: string[];
  sort: string;
}

interface FilterBarProps {
  packages: Package[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount?: number;
}

const FILTER_LABELS: Record<keyof FilterState, string> = {
  duration: "Duration",
  budget: "Budget",
  tripType: "Type",
  difficulty: "Level",
  region: "Region",
  theme: "Theme",
  sort: "Sort",
};

export function FilterBar({ packages, filters, onChange, resultCount }: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // ═══ DYNAMIC CATEGORY INFERENCE ═══
  const optionsMap = useMemo(() => {
    // Extract unique values from actual packages
    const uniqueTypes = Array.from(new Set(packages.flatMap(p => p.trip_type?.split(",") || []).filter(Boolean)));
    const uniqueDifficulties = Array.from(new Set(packages.map(p => p.difficulty_level).filter(Boolean)));
    const uniqueRegions = Array.from(new Set(packages.map(p => p.region).filter(Boolean)));
    const uniqueThemes = Array.from(new Set(packages.flatMap(p => p.tags || []).filter(Boolean)));

    // Dynamic Duration Ranges
    const allDays = packages.map(p => {
      const nights = parseInt(p.duration.match(/(\d+)\s*Night/i)?.[1] || "0");
      return nights + 1;
    }).filter(d => d > 0);
    const minDays = Math.min(...allDays, 0);
    const maxDays = Math.max(...allDays, 0);

    const durationOptions = [{ label: "Any Duration", value: "" }];
    if (maxDays > 0) {
      if (minDays <= 3) durationOptions.push({ label: "Short (1–3 Days)", value: "1-3" });
      if (maxDays >= 4) durationOptions.push({ label: "Medium (4–7 Days)", value: "4-7" });
      if (maxDays >= 8) durationOptions.push({ label: "Long (8–14 Days)", value: "8-14" });
      if (maxDays > 14) durationOptions.push({ label: "Extended (14+ Days)", value: "14+" });
    }

    return {
      duration: durationOptions,
      budget: [
        { label: "Any Budget", value: "" },
        { label: "Economy (Under ₹30K)", value: "0-30000" },
        { label: "Premium (₹30K – ₹70K)", value: "30000-70000" },
        { label: "Luxury (₹70K+)", value: "70000+" },
      ],
      region: [{ label: "Any Region", value: "" }, ...uniqueRegions.map(r => ({ label: r!, value: r! }))],
      tripType: [{ label: "Any Type", value: "" }, ...uniqueTypes.map(t => ({ label: t!.charAt(0).toUpperCase() + t!.slice(1), value: t!.toLowerCase() }))],
      difficulty: [{ label: "Any Level", value: "" }, ...uniqueDifficulties.map(d => ({ label: d!, value: d! }))],
      theme: [{ label: "Any Theme", value: "" }, ...uniqueThemes.map(t => ({ label: t!, value: t! }))],
      sort: [
        { label: "Recommended", value: "" },
        { label: "Price: Low → High", value: "price-asc" },
        { label: "Price: High → Low", value: "price-desc" },
        { label: "Shortest First", value: "duration-asc" },
        { label: "Longest First", value: "duration-desc" },
      ],
    };
  }, [packages]);

  const setFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      if (key === 'sort') {
        onChange({ ...filters, [key]: value });
        setOpenDropdown(null);
        return;
      }

      const current = filters[key] as string[];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      onChange({ ...filters, [key]: next });
    },
    [filters, onChange]
  );

  const activeCount = useMemo(() => {
    return Object.entries(filters).reduce((acc, [key, val]) => {
      if (key === 'sort') return acc + (val ? 1 : 0);
      return acc + (val as string[]).length;
    }, 0);
  }, [filters]);

  const clearFilters = useCallback(() => {
    onChange({
      duration: [],
      budget: [],
      tripType: [],
      difficulty: [],
      region: [],
      theme: [],
      sort: "",
    });
  }, [onChange]);

  return (
    <div className="w-full">
      <div 
        className="flex items-center gap-2 pb-0.5"
        data-lenis-prevent
      >
        {/* Filter icon label */}
        <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/20 pr-2">
          <SlidersHorizontal size={11} strokeWidth={2.5} />
          <span>Filters</span>
        </div>

        <div className="shrink-0 w-px h-4 bg-white/[0.06]" />

        {/* Filter Pills */}
        {(Object.keys(optionsMap) as (keyof typeof optionsMap)[]).map((key) => {
          const options = optionsMap[key];
          if (options.length <= 1 && key !== 'sort') return null; // Don't show empty categories

          const currentValue = filters[key];
          const isActive = key === 'sort' ? currentValue !== "" : (currentValue as string[]).length > 0;
          
          let displayLabel = FILTER_LABELS[key];
          if (isActive) {
            if (key === 'sort') {
              displayLabel = options.find(o => o.value === currentValue)?.label || FILTER_LABELS[key];
            } else {
              const selectedCount = (currentValue as string[]).length;
              displayLabel = selectedCount === 1 
                ? options.find(o => o.value === currentValue[0])?.label || FILTER_LABELS[key]
                : `${FILTER_LABELS[key]} (${selectedCount})`;
            }
          }

          return (
            <div key={key} className="relative shrink-0">
              <button
                onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold transition-all border whitespace-nowrap",
                  isActive
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    : "bg-white/[0.03] text-white/40 border-white/10 hover:border-white/20"
                )}
              >
                <span>{displayLabel}</span>
                <ChevronDown
                  size={12}
                  className={cn("transition-transform duration-300", openDropdown === key && "rotate-180")}
                />
              </button>

              {/* Dropdown Menu */}
              {openDropdown === key && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute top-full left-0 mt-2 z-50 min-w-[200px] bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                    <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                      {options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFilter(key, opt.value)}
                          className={cn(
                            "w-full text-left px-5 py-3.5 text-[12px] font-bold transition-all border-b border-white/[0.03] last:border-0 flex items-center justify-between",
                            (key === 'sort' ? currentValue === opt.value : (currentValue as string[]).includes(opt.value))
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-3.5 h-3.5 rounded border transition-all flex items-center justify-center",
                              (key === 'sort' ? currentValue === opt.value : (currentValue as string[]).includes(opt.value))
                                ? "bg-white border-white text-black"
                                : "border-white/20"
                            )}>
                              {(key === 'sort' ? currentValue === opt.value : (currentValue as string[]).includes(opt.value)) && (
                                <X size={10} strokeWidth={4} />
                              )}
                            </div>
                            <span>{opt.label}</span>
                          </div>
                          {opt.value !== "" && (
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full border",
                              (key === 'sort' ? currentValue === opt.value : (currentValue as string[]).includes(opt.value)) ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 opacity-40"
                            )}>
                              {/* Calculate count for this specific option */}
                              {key === 'duration' && packages.filter(p => {
                                const nights = parseInt(p.duration.match(/(\d+)\s*Night/i)?.[1] || "0");
                                const days = nights + 1;
                                if (opt.value === "1-3") return days >= 1 && days <= 3;
                                if (opt.value === "4-7") return days >= 4 && days <= 7;
                                if (opt.value === "8-14") return days >= 8 && days <= 14;
                                if (opt.value === "14+") return days > 14;
                                return false;
                              }).length}
                              {key === 'budget' && packages.filter(p => {
                                const price = parseInt(String(p.price || "0").replace(/[^0-9]/g, "")) || 0;
                                if (opt.value === "0-30000") return price <= 30000;
                                if (opt.value === "30000-70000") return price > 30000 && price <= 70000;
                                if (opt.value === "70000+") return price > 70000;
                                return false;
                              }).length}
                              {key === 'tripType' && packages.filter(p => p.trip_type?.toLowerCase().split(",").includes(opt.value)).length}
                              {key === 'difficulty' && packages.filter(p => p.difficulty_level === opt.value).length}
                              {key === 'region' && packages.filter(p => p.region === opt.value).length}
                              {key === 'theme' && packages.filter(p => p.tags?.includes(opt.value)).length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all"
          >
            <X size={12} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
