"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/Magnetic";
import { useBooking } from "./BookingProvider";


import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { name: "New Journey", href: "featured", offset: 0 },
  { name: "Destinations", href: "/destinations", offset: 0 },
  { name: "Services", href: "services", offset: -80 },
  { name: "About Us", href: "about", offset: 0 },
];

export function Navbar() {
  const router = useRouter();
  const { openBooking, openModal } = useBooking();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            className="pointer-events-none absolute inset-0 h-24 xl:h-32 transition-all duration-1000 backdrop-blur-[5px]" 
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

      {/* ── Mobile Toggle Button — always above overlay ── */}
      <div className="fixed top-4 right-6 xl:hidden z-[60]">
        <Magnetic>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 backdrop-blur-md text-white transition-all duration-300 hover:bg-white/20"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </Magnetic>
      </div>

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
            {NAV_LINKS.map((link, i) => (
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

            <Magnetic>
              <button
                className={cn(
                  "text-[clamp(2.5rem,8vw,7rem)] leading-none font-semibold tracking-tight text-white transition-all duration-500 bg-transparent border-none outline-none text-left",
                  isMobileMenuOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: isMobileMenuOpen ? `${80 + NAV_LINKS.length * 60}ms` : "0ms" }}
                onClick={() => { openModal('PORTAL'); setIsMobileMenuOpen(false); }}
              >
                Track Your Booking
              </button>
            </Magnetic>

            <div
              className={cn(
                "mt-[clamp(2.5rem,6vw,5rem)] pt-[clamp(2rem,4vw,4rem)] border-t border-white/10 transition-all duration-500 flex flex-col sm:flex-row gap-4",
                isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: isMobileMenuOpen ? "320ms" : "0ms" }}
            >
              <Magnetic>
                <button
                  onClick={() => { openBooking(undefined, "NAVBAR_MOBILE_CTA"); setIsMobileMenuOpen(false); }}
                  className="flex-1 rounded-full bg-white px-[clamp(1.75rem,4vw,3rem)] py-[clamp(0.875rem,2vw,1.5rem)] text-[clamp(11.5px,1.5vw,16px)] font-black uppercase tracking-widest text-black transition-transform hover:scale-105 text-center"
                >
                  Book Now
                </button>
              </Magnetic>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
