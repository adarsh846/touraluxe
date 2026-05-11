"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
                "rounded-2xl border transition-all duration-500 overflow-hidden",
                isOpen
                  ? "bg-white/[0.04] border-white/[0.1]"
                  : "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.08]"
              )}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left gap-4"
              >
                <span className={cn(
                  "text-sm md:text-base font-medium transition-colors duration-300",
                  isOpen ? "text-white" : "text-white/60"
                )}>
                  {item.question}
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className={cn(
                    "shrink-0 text-white/30 transition-all duration-500",
                    isOpen && "rotate-180 text-white/60"
                  )}
                />
              </button>
              <div
                className={cn(
                  "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
                  isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="px-5 md:px-6 pb-5 md:pb-6 text-sm text-white/40 leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
