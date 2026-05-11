"use client";

import { useState, useCallback } from "react";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  duration: string;
  budget: string;
  tripType: string;
  difficulty: string;
  sort: string;
}

const FILTER_OPTIONS = {
  duration: [
    { label: "All", value: "" },
    { label: "1-3 Days", value: "1-3" },
    { label: "4-7 Days", value: "4-7" },
    { label: "8-14 Days", value: "8-14" },
    { label: "14+ Days", value: "14+" },
  ],
  budget: [
    { label: "All", value: "" },
    { label: "Under ₹20K", value: "0-20000" },
    { label: "₹20K - 50K", value: "20000-50000" },
    { label: "₹50K - 1L", value: "50000-100000" },
    { label: "₹1L+", value: "100000+" },
  ],
  tripType: [
    { label: "All", value: "" },
    { label: "Group", value: "group" },
    { label: "Private", value: "private" },
    { label: "Custom", value: "custom" },
  ],
  difficulty: [
    { label: "All", value: "" },
    { label: "Easy", value: "Easy" },
    { label: "Moderate", value: "Moderate" },
    { label: "Challenging", value: "Challenging" },
  ],
  sort: [
    { label: "Recommended", value: "" },
    { label: "Price: Low → High", value: "price-asc" },
    { label: "Price: High → Low", value: "price-desc" },
    { label: "Duration: Short", value: "duration-asc" },
    { label: "Duration: Long", value: "duration-desc" },
  ],
};

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount?: number;
}

export function FilterBar({ filters, onChange, resultCount }: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const activeCount = Object.values(filters).filter(v => v !== "").length;

  const setFilter = useCallback((key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
    setOpenDropdown(null);
  }, [filters, onChange]);

  const clearAll = useCallback(() => {
    onChange({ duration: "", budget: "", tripType: "", difficulty: "", sort: "" });
  }, [onChange]);

  return (
    <div className="w-full">
      {/* Filter Pills Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mr-2">
          <SlidersHorizontal size={13} strokeWidth={2.5} />
          <span className="hidden sm:inline">Filter</span>
        </div>

        {(Object.keys(FILTER_OPTIONS) as (keyof typeof FILTER_OPTIONS)[]).map((key) => {
          const options = FILTER_OPTIONS[key];
          const currentValue = filters[key as keyof FilterState];
          const currentLabel = options.find(o => o.value === currentValue)?.label || options[0].label;
          const isActive = currentValue !== "";
          const isOpen = openDropdown === key;

          return (
            <div key={key} className="relative">
              <button
                onClick={() => setOpenDropdown(isOpen ? null : key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-500 border backdrop-blur-xl",
                  isActive
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/15 hover:text-white/60"
                )}
              >
                <span>{currentLabel}</span>
                <ChevronDown size={11} strokeWidth={2.5} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
              </button>

              {/* Dropdown */}
              {isOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute top-full left-0 mt-2 z-50 min-w-[180px] py-2 rounded-2xl bg-[#1a1a1c]/95 backdrop-blur-3xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2 duration-300">
                    {options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilter(key as keyof FilterState, option.value)}
                        className={cn(
                          "w-full px-5 py-2.5 text-left text-[11px] font-medium transition-all duration-300",
                          currentValue === option.value
                            ? "text-white bg-white/[0.08]"
                            : "text-white/40 hover:text-white hover:bg-white/[0.04]"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={10} strokeWidth={3} />
            Clear
          </button>
        )}
      </div>

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
          {resultCount} {resultCount === 1 ? "Journey" : "Journeys"} Found
        </div>
      )}
    </div>
  );
}
