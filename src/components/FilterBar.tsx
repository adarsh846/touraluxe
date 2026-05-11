"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Package } from "@/lib/supabase";

export interface FilterState {
  duration: string;
  budget: string;
  tripType: string;
  difficulty: string;
  region: string;
  theme: string;
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
    const uniqueTypes = Array.from(new Set(packages.map(p => p.trip_type).filter(Boolean)));
    const uniqueDifficulties = Array.from(new Set(packages.map(p => p.difficulty_level).filter(Boolean)));
    const uniqueRegions = Array.from(new Set(packages.map(p => p.region).filter(Boolean)));
    const uniqueThemes = Array.from(new Set(packages.flatMap(p => p.tags || []).filter(Boolean)));

    return {
      duration: [
        { label: "Any Duration", value: "" },
        { label: "1–3 Days", value: "1-3" },
        { label: "4–7 Days", value: "4-7" },
        { label: "8–14 Days", value: "8-14" },
        { label: "14+ Days", value: "14+" },
      ],
      budget: [
        { label: "Any Budget", value: "" },
        { label: "Under ₹20K", value: "0-20000" },
        { label: "₹20K – ₹50K", value: "20000-50000" },
        { label: "₹50K – ₹1L", value: "50000-100000" },
        { label: "₹1L+", value: "100000+" },
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

  const activeCount = Object.values(filters).filter((v) => v !== "").length;

  const setFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      onChange({ ...filters, [key]: value });
      setOpenDropdown(null);
    },
    [filters, onChange]
  );

  const clearFilters = useCallback(() => {
    onChange({
      duration: "",
      budget: "",
      tripType: "",
      difficulty: "",
      region: "",
      theme: "",
      sort: "",
    });
  }, [onChange]);

  return (
    <div className="w-full">
      <div 
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5 touch-pan-x"
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
          const currentLabel =
            options.find((o) => o.value === currentValue)?.label ?? options[0].label;
          const isActive = currentValue !== "";

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
                {isActive ? (
                  <span className="flex items-center gap-2">
                    <span className="opacity-40">{FILTER_LABELS[key]}:</span>
                    <span>{currentLabel}</span>
                  </span>
                ) : (
                  FILTER_LABELS[key]
                )}
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
                            "w-full text-left px-5 py-3.5 text-[12px] font-bold transition-all border-b border-white/[0.03] last:border-0",
                            currentValue === opt.value
                              ? "bg-white text-black"
                              : "text-white/60 hover:bg-white/5"
                          )}
                        >
                          {opt.label}
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
