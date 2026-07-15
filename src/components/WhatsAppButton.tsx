"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Magnetic } from "./Magnetic";
import { cn } from "@/lib/utils";
import { useBooking } from "./BookingProvider";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
  showAfter?: number;
  isInline?: boolean;
}

export function WhatsAppButton({
  phoneNumber = "",
  defaultMessage = "Hi TouraLuxe! I'm ready to write my next travel chapter. Let's plan it.",
  showAfter = 0,
  isInline = false,
}: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { view, data, bookingDetails } = useBooking();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), showAfter);
    return () => clearTimeout(timer);
  }, [showAfter]);

  useEffect(() => {
    if (isVisible && !hasBeenDismissed) {
      const tooltipTimer = setTimeout(() => setIsTooltipVisible(true), 1500);
      const hideTimer = setTimeout(() => setIsTooltipVisible(false), 12000);
      return () => { clearTimeout(tooltipTimer); clearTimeout(hideTimer); };
    }
  }, [isVisible, hasBeenDismissed]);



  if (!phoneNumber || !isVisible) return null;

  const getDynamicMessage = () => {
    if (view === "BOOKING" && bookingDetails) {
      const { packageTitle, startDate, endDate, adults, kids, infants, totalInvestment, isCustom } = bookingDetails;
      const totalGuests = (adults || 0) + (kids || 0) + (infants || 0);
      const guestBreakdown = `${adults || 1} Adult${(adults || 1) > 1 ? 's' : ''}${kids && kids > 0 ? `, ${kids} Child${kids > 1 ? 'ren' : ''}` : ''}${infants && infants > 0 ? `, ${infants} Infant${infants > 1 ? 's' : ''}` : ''}`;
      
      const isCustomPrice = !!(isCustom || !totalInvestment || (totalInvestment.includes("0") && totalInvestment.replace(/[^0-9]/g, "") === "0"));
      return `Hi TouraLuxe!

I'm in the process of planning a luxury journey on the platform.

- Package: ${packageTitle || "Tailored Journey"}
- Dates: ${startDate && endDate ? `${startDate} to ${endDate}` : "Not Selected"}
- Travelers: ${totalGuests > 0 ? `${totalGuests} (${guestBreakdown})` : "Not Selected"}
- Investment: ${isCustomPrice ? "Upon Request" : totalInvestment}

I would love to get some assistance in handcrafting this experience.`;
    }
    if (view === "PACKAGE" && data?.title)
      return `Hi TouraLuxe! I'm interested in the "${data.title}" package. Can you help me plan this experience?`;
    if (view === "BOOKING" && data?.title)
      return `Hi TouraLuxe! I'm booking the "${data.title}" package and would like some assistance.`;
    return defaultMessage;
  };

  const getTooltipText = () => {
    if ((view === "PACKAGE" || view === "BOOKING") && data?.title)
      return `Interested in ${data.title}? Talk to us!`;
    return "Need help in planning? Talk to us!";
  };

  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(getDynamicMessage())}`;

  const buttonEl = (
    <Magnetic intensity={0.25}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-12 h-12 md:w-[62px] md:h-[62px] rounded-full bg-black/80 md:bg-black/90 border border-[#25D366]/30 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),0_0_40px_rgba(0,0,0,0.6),0_0_20px_rgba(37,211,102,0.15),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-[#25D366]/50 transition-all duration-500 hover:scale-[1.08] active:scale-[0.93] z-20"
      >
        {/* Subtle green tint overlay default */}
        <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-500" />
        
        {/* Faint green glow ring default */}
        <div className="absolute inset-0 rounded-full ring-1 ring-[#25D366]/20 group-hover:ring-[#25D366]/40 transition-all duration-500" />

        {/* Clean transparent white WhatsApp logo SVG */}
        <svg 
          className="w-5.5 h-5.5 md:w-6.5 md:h-6.5 text-[#25D366] group-hover:text-white transition-all duration-300 relative z-10 shrink-0" 
          viewBox="0 0 448 512" 
          fill="currentColor" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </a>
    </Magnetic>
  );

  const showTooltip = (isTooltipVisible && !hasBeenDismissed) || isHovered;

  const tooltipEl = (
    <div 
      className={cn(
        "absolute bottom-[calc(100%+14px)] z-50 overflow-visible origin-[right_bottom] md:origin-bottom transform-gpu will-change-[transform,opacity]",
        "flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0c0c0e]/95 border border-white/[0.12] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)]",
        // Position right-aligned on mobile (to prevent overflowing off-screen), centered on desktop
        "right-0 left-auto translate-x-0 md:left-1/2 md:right-auto md:-translate-x-1/2",
        showTooltip 
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
          : "opacity-0 scale-[0.9] translate-y-3 pointer-events-none transition-all duration-[250ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
      )}
    >
      <span className="text-[11px] font-semibold text-white/85 whitespace-nowrap tracking-wide select-none">
        {getTooltipText()}
      </span>
      
      {/* Speech bubble pointer pointing down to the center of the button */}
      <div 
        className="absolute w-2.5 h-2.5 bg-[#0c0c0e] border-r border-b border-white/[0.12] pointer-events-none right-[19px] md:right-auto md:left-[calc(50%-5px)]"
        style={{ 
          bottom: "-5px", 
          transform: "rotate(45deg)", 
          zIndex: 10 
        }} 
      />
    </div>
  );

  if (isInline) {
    return (
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative shrink-0"
      >
        {tooltipEl}
        {buttonEl}
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "mobile-whatsapp-btn transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
    >
      <div className="relative">
        {tooltipEl}
        {buttonEl}
      </div>
    </div>
  );
}
