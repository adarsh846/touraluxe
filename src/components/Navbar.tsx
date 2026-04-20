"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/Magnetic";

const NAV_LINKS = [
  { name: "Experiences", href: "featured", offset: 0 },
  { name: "Services", href: "services", offset: -80 },
  { name: "Our Thoughts", href: "testimonials", offset: 0 },
];

export function Navbar() {
  const [blurOpacity, setBlurOpacity] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setBlurOpacity(Math.min(y / 80, 1));
      setIsScrolled(y > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string, offset: number = 0) => {
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
          isMobileMenuOpen ? "py-4" : isScrolled ? "py-3" : "py-6"
        )}
      >
        {/* macOS-style Progressive Blur — blur VALUE scales with scroll, not just opacity */}
        {!isMobileMenuOpen && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {/* Layer 1: Peak blur — scales from 0→32px as you scroll */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: `blur(${blurOpacity * 32}px)`,
                WebkitBackdropFilter: `blur(${blurOpacity * 32}px)`,
                maskImage: "linear-gradient(to bottom, black 0%, black 20%, transparent 70%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, transparent 70%)",
              }}
            />
            {/* Layer 2: Mid blur — scales from 0→18px */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: `blur(${blurOpacity * 18}px)`,
                WebkitBackdropFilter: `blur(${blurOpacity * 18}px)`,
                maskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 85%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 85%)",
              }}
            />
            {/* Layer 3: Soft feather — scales from 0→8px */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: `blur(${blurOpacity * 8}px)`,
                WebkitBackdropFilter: `blur(${blurOpacity * 8}px)`,
                maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
              }}
            />
            {/* Near-invisible tint — opacity scales with scroll */}
            <div
              className="absolute inset-0"
              style={{
                background: `rgba(0,0,0,${blurOpacity * 0.15})`,
                maskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
              }}
            />
          </div>
        )}

        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between relative z-10">
          {/* Logo */}
          <div className="flex items-center">
            <Magnetic>
              <a
                href="/"
                className={cn(
                  "flex items-center justify-center bg-foreground rounded-full transition-all duration-500 hover:scale-[1.03] overflow-hidden",
                  isScrolled ? "w-[5.5rem] h-8" : "w-28 h-10"
                )}
              >
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
                    className="object-contain scale-[2.1] translate-y-[4px]"
                  />
                </div>
              </a>
            </Magnetic>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Magnetic key={link.name}>
                <button
                  onClick={() => scrollToSection(link.href, link.offset)}
                  className="text-xs font-medium tracking-wide transition-colors hover:text-white bg-transparent border-none outline-none cursor-none"
                  style={{ color: `rgba(255,255,255,${0.5 + blurOpacity * 0.3})` }}
                >
                  {link.name}
                </button>
              </Magnetic>
            ))}
          </nav>

          {/* Desktop Action Button */}
          <div className="hidden md:flex items-center">
            <Magnetic>
              <button
                onClick={() => scrollToSection("contact")}
                className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-transform hover:scale-105"
              >
                Curate Your Trip
              </button>
            </Magnetic>
          </div>

          {/* Mobile placeholder to keep flex spacing */}
          <div className="md:hidden w-9 h-9" />
        </div>
      </header>

      {/* ── Mobile Toggle Button — always above overlay ── */}
      <div className="fixed top-4 right-6 md:hidden z-[60]">
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
          "fixed inset-0 z-[55] bg-black/95 backdrop-blur-2xl md:hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isMobileMenuOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-[1.04] pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full pt-28 px-8">
          <nav className="flex flex-col gap-6">
            {NAV_LINKS.map((link, i) => (
              <Magnetic key={link.name}>
                <button
                  className={cn(
                    "text-5xl font-semibold tracking-tight text-white transition-all duration-500 bg-transparent border-none outline-none text-left",
                    isMobileMenuOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-6"
                  )}
                  style={{ transitionDelay: isMobileMenuOpen ? `${80 + i * 60}ms` : "0ms" }}
                  onClick={() => { scrollToSection(link.href, link.offset); setIsMobileMenuOpen(false); }}
                >
                  {link.name}
                </button>
              </Magnetic>
            ))}

            <div
              className={cn(
                "mt-10 pt-8 border-t border-white/10 transition-all duration-500",
                isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: isMobileMenuOpen ? "320ms" : "0ms" }}
            >
              <Magnetic>
                <button
                  onClick={() => { scrollToSection("contact"); setIsMobileMenuOpen(false); }}
                  className="inline-flex rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-transform hover:scale-105"
                >
                  Curate Your Trip
                </button>
              </Magnetic>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
