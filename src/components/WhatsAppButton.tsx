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

        {/* Clean transparent white WhatsApp logo png */}
        <img 
          src="/assets/whatsapp-logo-white.png" 
          alt="WhatsApp" 
          className="w-5.5 h-5.5 md:w-6.5 md:h-6.5 object-contain relative z-10 opacity-90 group-hover:opacity-100 transition-all duration-300"
        />
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
