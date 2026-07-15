"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X, Compass, Globe, Sparkles, Calendar, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/Magnetic";
import { useBooking } from "./BookingProvider";
import { useRouter, usePathname } from "next/navigation";

const NAV_LINKS = [
  { name: "New Journey", href: "featured", offset: 0 },
  { name: "Destinations", href: "/destinations", offset: 0 },
  { name: "Services", href: "services", offset: -80 },
  { name: "About Us", href: "about", offset: 0 },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { openBooking, openModal } = useBooking();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    import("@/lib/settingsCache").then(({ getSettings }) => {
      getSettings().then(data => {
        if (data.whatsapp_number) {
          setWhatsappNumber(data.whatsapp_number);
        } else if (data.contact_phone) {
          setWhatsappNumber(data.contact_phone);
        }
      });
    });
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const isNowScrolled = window.scrollY > 50;
        setIsScrolled(prev => prev !== isNowScrolled ? isNowScrolled : prev);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string, offset: number = 0) => {
    if (!id) return;
    
    // Handle full URL paths (e.g. /destinations)
    if (id.startsWith("/")) {
      router.push(id);
      return;
    }

    if (id === "about") {
      openModal('ABOUT');
      return;
    }

    const lenis = (window as any).__lenis;
    if (lenis) {
      lenis.scrollTo(`#${id}`, { duration: 1.2, offset });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* ── Header ── */}
      <header
        className={cn(
          "fixed top-0 left-0 w-full z-50 px-6 transition-[padding] duration-300",
          isMobileMenuOpen ? "py-4" : isScrolled ? "py-3" : "py-4 xl:py-6"
        )}
      >
        {/* iOS 26-style Hyper-Smooth Progressive Mask */}
        {!isMobileMenuOpen && (
          <div 
            className="pointer-events-none absolute inset-0 h-28 xl:h-36 transition-all duration-1000" 
            style={{ 
              opacity: isScrolled ? 0.95 : 0.85,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.05) 85%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
            }}
          />
        )}

        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between relative z-10">
          {/* Logo */}
          <div className="flex items-center">
            <Magnetic>
              <Link
                href="/"
                className="relative group block"
              >
                {/* iOS 26 Deep Shadow & Glow */}
                <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
                <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />

                <div className={cn(
                  "relative flex items-center justify-center bg-[#f5f5f7] rounded-full transition-all duration-700 group-hover:scale-[1.05] overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]",
                  isScrolled ? "w-[5.5rem] h-8" : "w-28 h-10"
                )}>
                  <div className={cn(
                    "relative transition-all duration-500 flex items-center justify-center",
                    isScrolled ? "w-[5.5rem] h-8" : "w-28 h-10"
                  )}>
                    <Image
                      src="/assets/logo-transparent.webp"
                      alt="TouraLuxe Logo"
                      fill
                      priority
                      quality={75}
                      sizes="112px"
                      className="object-contain scale-[2.1] translate-y-[4px] brightness-[0.05]"
                    />
                  </div>
                </div>
              </Link>
            </Magnetic>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-9 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) => (
              <Magnetic key={link.name}>
                {link.href.startsWith("/") ? (
                  <Link
                    href={link.href}
                    className="text-[11px] font-semibold tracking-[0.15em] uppercase transition-all hover:text-white bg-transparent border-none outline-none cursor-none opacity-60 hover:opacity-100"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <button
                    onClick={() => scrollToSection(link.href, link.offset)}
                    className="text-[11px] font-semibold tracking-[0.15em] uppercase transition-all hover:text-white bg-transparent border-none outline-none cursor-none opacity-60 hover:opacity-100"
                  >
                    {link.name}
                  </button>
                )}
              </Magnetic>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden xl:flex items-center gap-4">
            <Magnetic>
              <button
                onClick={() => openModal('PORTAL')}
                className="text-[11px] font-semibold tracking-[0.15em] uppercase transition-all hover:text-white bg-transparent border-none outline-none cursor-none opacity-60 hover:opacity-100 mr-2"
              >
                Track Your Booking
              </button>
            </Magnetic>
            <Magnetic>
              <div className="relative group">
                <div className="absolute inset-0 bg-black/60 blur-xl rounded-full translate-y-2 scale-90 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <button
                  onClick={() => openBooking(undefined, "NAVBAR_CTA")}
                  className="relative rounded-full bg-white px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95 shadow-2xl border border-white/20 cursor-none"
                >
                  Book Now
                </button>
              </div>
            </Magnetic>
          </div>

          {/* Mobile placeholder to keep flex spacing */}
          <div className="xl:hidden w-9 h-9" />
        </div>
      </header>

      {/* ── Mobile Nav Overlay ── */}
      <div
        className={cn(
          "fixed inset-0 z-[55] bg-black/95 backdrop-blur-2xl xl:hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isMobileMenuOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-[1.04] pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full pt-[clamp(7rem,12vw,10rem)] px-[clamp(2rem,6vw,6rem)]">
          <nav className="flex flex-col gap-[clamp(1.5rem,4vw,3rem)]">
            {NAV_LINKS.filter(link => link.name !== "Destinations" && link.name !== "Services").map((link, i) => (
              <Magnetic key={link.name}>
                {link.href.startsWith("/") ? (
                  <Link
                    href={link.href}
                    className={cn(
                      "text-[clamp(2.5rem,8vw,7rem)] leading-none font-semibold tracking-tight text-white transition-all duration-500 bg-transparent border-none outline-none text-left",
                      isMobileMenuOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6"
                    )}
                    style={{ transitionDelay: isMobileMenuOpen ? `${80 + i * 60}ms` : "0ms" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ) : (
                  <button
                    className={cn(
                      "text-[clamp(2.5rem,8vw,7rem)] leading-none font-semibold tracking-tight text-white transition-all duration-500 bg-transparent border-none outline-none text-left",
                      isMobileMenuOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6"
                    )}
                    style={{ transitionDelay: isMobileMenuOpen ? `${80 + i * 60}ms` : "0ms" }}
                    onClick={() => { scrollToSection(link.href, link.offset); setIsMobileMenuOpen(false); }}
                  >
                    {link.name}
                  </button>
                )}
              </Magnetic>
            ))}

            <div
              className={cn(
                "mt-[clamp(2.5rem,6vw,5rem)] pt-[clamp(2rem,4vw,4rem)] border-t border-white/10 transition-all duration-500 flex flex-col gap-4",
                isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: isMobileMenuOpen ? "250ms" : "0ms" }}
            >
              <Magnetic>
                <button
                  onClick={() => { openModal('PORTAL'); setIsMobileMenuOpen(false); }}
                  className="w-full rounded-full bg-white px-[clamp(1.75rem,4vw,3rem)] py-[clamp(0.875rem,2vw,1.5rem)] text-[clamp(11.5px,1.5vw,16px)] font-black uppercase tracking-widest text-black transition-transform hover:scale-105 text-center"
                >
                  Track Your Booking
                </button>
              </Magnetic>

              {whatsappNumber && (
                <Magnetic>
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello TouraLuxe, I'd like to inquire about a luxury experience.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full rounded-full bg-[#121214]/90 border border-white/10 backdrop-blur-2xl px-[clamp(1.75rem,4vw,3rem)] py-[clamp(0.875rem,2vw,1.5rem)] text-[clamp(11.5px,1.5vw,16px)] font-black uppercase tracking-widest text-white transition-all duration-500 hover:border-[#25D366]/40 active:scale-[0.98] text-center flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08),0_0_15px_rgba(37,211,102,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12),0_0_25px_rgba(37,211,102,0.12)] group"
                  >
                    <svg 
                      className="w-5 h-5 text-[#25D366] transition-transform duration-500 group-hover:scale-110 shrink-0" 
                      viewBox="0 0 448 512" 
                      fill="currentColor" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                </Magnetic>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* ── Mobile Bottom Pill Navigation (iOS 26 Style) ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] xl:hidden w-[calc(100%-2.5rem)] max-w-sm sm:max-w-md">
        {/* iOS 26 gradient border ring: bright top rim, fading sides, dark bottom */}
        <div
          className="p-px rounded-full"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.04) 70%, rgba(255,255,255,0.02) 100%)",
          }}
        >
        <div className="flex items-center justify-between bg-[#0a0a0b]/92 backdrop-blur-2xl rounded-full px-3 py-2 shadow-[0_20px_60px_rgba(0,0,0,0.75),0_1px_0px_rgba(255,255,255,0.08)_inset,0_-1px_0px_rgba(0,0,0,0.4)_inset]">
          {/* Search */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              window.dispatchEvent(new CustomEvent("open-mobile-search"));
            }}
            className="flex flex-col items-center justify-center flex-1 gap-1 text-white/70 hover:text-white transition-all py-1 active:scale-95"
          >
            <Search size={20} className="opacity-90" />
            <span className="text-[9px] uppercase tracking-wider font-bold scale-90">Search</span>
          </button>

          {/* Destinations */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              router.push("/destinations");
            }}
            className="flex flex-col items-center justify-center flex-1 gap-1 text-white/70 hover:text-white transition-all py-1 active:scale-95"
          >
            <Globe size={20} className={cn(pathname === "/destinations" && !isMobileMenuOpen ? "text-white" : "opacity-90")} />
            <span className="text-[9px] uppercase tracking-wider font-bold scale-90">Places</span>
          </button>

          {/* Book Now (Center Standout Action) */}
          <div className="flex-1 flex justify-center -translate-y-3.5 relative">
            <Magnetic>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openBooking(undefined, "MOBILE_BOTTOM_PILL_CTA");
                }}
                className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all"
                style={{
                  boxShadow: "0 0 0 1.5px rgba(255,255,255,0.9), 0 8px_28px_rgba(255,255,255,0.25), 0 0 40px rgba(255,255,255,0.12)",
                }}
              >
                <Calendar size={22} className="stroke-[2.5]" />
                <span className="text-[8px] uppercase tracking-tighter font-black mt-0.5">Book</span>
              </button>
            </Magnetic>
          </div>

          {/* Services */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (pathname !== "/") {
                router.push("/");
                setTimeout(() => {
                  scrollToSection("services", -80);
                }, 300);
              } else {
                scrollToSection("services", -80);
              }
            }}
            className="flex flex-col items-center justify-center flex-1 gap-1 text-white/70 hover:text-white transition-all py-1 active:scale-95"
          >
            <Sparkles size={20} className="opacity-90" />
            <span className="text-[9px] uppercase tracking-wider font-bold scale-90">Services</span>
          </button>

          {/* Menu / Close */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex flex-col items-center justify-center flex-1 gap-1 text-white/70 hover:text-white transition-all py-1 active:scale-95"
          >
            {isMobileMenuOpen ? (
              <>
                <X size={20} className="text-white" />
                <span className="text-[9px] uppercase tracking-wider font-bold scale-90">Close</span>
              </>
            ) : (
              <>
                <Menu size={20} className="opacity-90" />
                <span className="text-[9px] uppercase tracking-wider font-bold scale-90">Menu</span>
              </>
            )}
          </button>
        </div>
        </div>{/* /gradient border ring */}
      </div>
    </>
  );
}
