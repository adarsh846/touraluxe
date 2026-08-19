"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  title?: string;
}

export function FAQAccordion({ items, title = "Frequently Asked Questions" }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full space-y-6">
      {title && (
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white/90">
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={cn(
                "rounded-2xl border transition-all duration-500 overflow-hidden transform-gpu active:scale-[0.995]",
                isOpen
                  ? "bg-white/[0.04] border-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_1px_0px_rgba(255,255,255,0.15)_inset]"
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.03] hover:border-white/15"
              )}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left gap-4 cursor-pointer select-none"
              >
                <span className={cn(
                  "text-sm md:text-base font-medium tracking-wide transition-colors duration-300",
                  isOpen ? "text-white font-semibold" : "text-white/70"
                )}>
                  {item.question}
                </span>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 border",
                  isOpen 
                    ? "bg-white/15 border-white/30 text-white rotate-45 shadow-[0_2px_10px_rgba(255,255,255,0.1)]" 
                    : "bg-white/5 border-white/10 text-white/40 rotate-0 hover:text-white hover:bg-white/10"
                )}>
                  <Plus
                    size={15}
                    strokeWidth={2.5}
                    className="transition-transform duration-500"
                  />
                </div>
              </button>

              {/* Liquid Grid-Row Height Interpolation (Apple iOS HIG Standard) */}
              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-5 md:px-6 pb-5 md:pb-6 text-sm text-white/50 leading-relaxed border-t border-white/[0.06] pt-4">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
