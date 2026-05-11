"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Magnetic } from "./Magnetic";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
  /** Delay in ms before the button appears */
  showAfter?: number;
}

export function WhatsAppButton({
  phoneNumber = "",
  defaultMessage = "Hi! I'm interested in learning more about your travel experiences.",
  showAfter = 5000,
}: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), showAfter);
    return () => clearTimeout(timer);
  }, [showAfter]);

  useEffect(() => {
    if (isVisible && !hasBeenDismissed) {
      const tooltipTimer = setTimeout(() => setIsTooltipVisible(true), 2000);
      const hideTimer = setTimeout(() => setIsTooltipVisible(false), 8000);
      return () => { clearTimeout(tooltipTimer); clearTimeout(hideTimer); };
    }
  }, [isVisible, hasBeenDismissed]);

  if (!phoneNumber || !isVisible) return null;

  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[100] flex items-end gap-3 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
    )}>
      {/* Tooltip */}
      {isTooltipVisible && !hasBeenDismissed && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1a1a1c]/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] max-w-[200px]">
          <p className="text-[11px] text-white/70 font-medium leading-tight">
            Need help planning? Chat with us on WhatsApp
          </p>
          <button
            onClick={() => { setIsTooltipVisible(false); setHasBeenDismissed(true); }}
            className="shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={10} strokeWidth={3} className="text-white/40" />
          </button>
        </div>
      )}

      {/* Button */}
      <Magnetic intensity={0.25}>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-[0_8px_30px_rgba(37,211,102,0.3)] hover:shadow-[0_12px_40px_rgba(37,211,102,0.5)] transition-all duration-500 hover:scale-110 active:scale-95"
        >
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
          
          <MessageCircle size={24} strokeWidth={2} className="text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />
        </a>
      </Magnetic>
    </div>
  );
}
