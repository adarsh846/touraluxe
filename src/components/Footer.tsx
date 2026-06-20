"use client";

import Image from "next/image";
import { Magnetic } from "./Magnetic";
import { Heart } from "lucide-react";
import { useBooking } from "./BookingProvider";

function scrollToSection(id: string, offset: number = 0) {
  const lenis = (window as any).__lenis;
  if (lenis) {
    lenis.scrollTo(`#${id}`, { duration: 1.2, offset });
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }
}

export function Footer() {
  const { openModal } = useBooking();

  return (
    <footer className="relative z-20 w-full bg-black py-16 px-6 -mt-[1px]">
      <div className="mx-auto max-w-[1200px] flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="flex flex-col items-start gap-4">
          <Magnetic>
            <a href="/" className="flex items-center justify-center bg-foreground rounded-full w-28 h-10 overflow-hidden hover:scale-[1.03] transition-transform duration-300">
              <div className="relative w-28 h-10">
                <Image
                  src="/assets/logo-transparent.webp"
                  alt="TouraLuxe Logo"
                  fill
                  quality={75}
                  sizes="112px"
                  className="object-contain scale-[2.1] translate-y-[4px]"
                />
              </div>
            </a>
          </Magnetic>
          <p className="max-w-xs text-sm text-muted">
            We don&apos;t sell trips. We craft transcendent experiences for the world&apos;s most discerning travelers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-10 sm:gap-24">
          <div className="flex flex-col items-start gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Services</h4>
            <Magnetic>
              <button 
                onClick={() => {
                  scrollToSection("services", -80);
                  window.dispatchEvent(new CustomEvent('open-service-modal', { detail: { serviceId: 1 } }));
                }} 
                className="text-sm font-medium text-foreground hover:underline underline-offset-4 bg-transparent border-none outline-none text-left"
              >
                Luxury Travel
              </button>
            </Magnetic>
            <Magnetic>
              <button 
                onClick={() => {
                  scrollToSection("services", -80);
                  window.dispatchEvent(new CustomEvent('open-service-modal', { detail: { serviceId: 2 } }));
                }} 
                className="text-sm font-medium text-foreground hover:underline underline-offset-4 bg-transparent border-none outline-none text-left"
              >
                Sports Tours
              </button>
            </Magnetic>
            <Magnetic>
              <button 
                onClick={() => {
                  scrollToSection("services", -80);
                  window.dispatchEvent(new CustomEvent('open-service-modal', { detail: { serviceId: 3 } }));
                }} 
                className="text-sm font-medium text-foreground hover:underline underline-offset-4 bg-transparent border-none outline-none text-left"
              >
                MICE Events
              </button>
            </Magnetic>
            <Magnetic>
              <button 
                onClick={() => {
                  scrollToSection("services", -80);
                  window.dispatchEvent(new CustomEvent('open-service-modal', { detail: { serviceId: 4 } }));
                }} 
                className="text-sm font-medium text-foreground hover:underline underline-offset-4 bg-transparent border-none outline-none text-left"
              >
                Global Retreats
              </button>
            </Magnetic>
          </div>
          
          <div className="flex flex-col items-start gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Company</h4>
            <Magnetic><button onClick={() => scrollToSection("quotes")} className="text-sm font-medium text-foreground hover:underline underline-offset-4 bg-transparent border-none outline-none text-left">Philosophy</button></Magnetic>
            <Magnetic><button onClick={() => scrollToSection("featured")} className="text-sm font-medium text-foreground hover:underline underline-offset-4 bg-transparent border-none outline-none text-left">Journal</button></Magnetic>
            <Magnetic><button onClick={() => openModal('CONTACT', null, 'FOOTER_CONTACT_BTN')} className="text-sm font-medium text-foreground hover:underline underline-offset-4 bg-transparent border-none outline-none text-left">Contact</button></Magnetic>
            <Magnetic><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-sm font-medium text-foreground hover:underline underline-offset-4 bg-transparent border-none outline-none text-left">Terms & Conditions</button></Magnetic>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted">
          &copy; {new Date().getFullYear()} TouraLuxe. All rights reserved.
        </p>
        <p className="text-xs text-muted flex items-center gap-1">
          <span>Handcrafted with</span>
          <Heart size={14} className="fill-red-500/70 stroke-none relative top-[0.5px]" />
          <span>by ADARSH.</span>
        </p>
      </div>
    </footer>
  );
}
