"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/Magnetic";

const NAV_LINKS = [
  { name: "Experiences", href: "#experiences" },
  { name: "Services", href: "#services" },
  { name: "Our Thoughts", href: "#testimonials" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setScrollProgress((currentScroll / totalScroll) * 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 border-b",
        isMobileMenuOpen
          ? "py-4 bg-transparent border-transparent"
          : isScrolled
            ? "py-3 bg-white/50 dark:bg-black/50 backdrop-blur-2xl border-white/5"
            : "py-6 bg-transparent border-transparent"
      )}
    >
      {/* Scroll Progress Bar */}
      <div
        className="absolute bottom-0 left-0 h-[2px] bg-foreground transition-all duration-300 ease-out origin-left"
        style={{ width: `${scrollProgress}%` }}
      />
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Magnetic>
            <Link
              href="/"
              className={cn(
                "flex items-center justify-center bg-foreground rounded-full transition-all duration-500 hover:scale-[1.03] overflow-hidden",
                isScrolled ? "w-22 h-8" : "w-28 h-10"
              )}
            >
              <div className={cn(
                "relative transition-all duration-500 flex items-center justify-center",
                isScrolled ? "w-22 h-8" : "w-28 h-10"
              )}>
                <Image
                  src="/assets/logo-transparent.png"
                  alt="TouraLuxe Logo"
                  fill
                  className="object-contain scale-150 translate-y-px"
                />
              </div>
            </Link>
          </Magnetic>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Magnetic key={link.name}>
              <Link
                href={link.href}
                className="text-xs font-medium tracking-wide text-muted transition-colors hover:text-foreground"
              >
                {link.name}
              </Link>
            </Magnetic>
          ))}
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center">
          <Magnetic>
            <Link
              href="#contact"
              className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-transform hover:scale-105"
            >
              Curate Your Trip
            </Link>
          </Magnetic>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-foreground z-50"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav Overlay (Smooth GSAP Reveal) */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/95 backdrop-blur-xl md:hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full pt-32 px-6">
          <nav className="flex flex-col gap-8">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-4xl font-semibold tracking-tight text-white transition-all duration-700 delay-100",
                  isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            
            <div
              className={cn(
                "mt-12 pt-8 border-t border-black/10 dark:border-white/10 transition-all duration-700 delay-300",
                isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              <Magnetic>
                <Link
                  href="#contact"
                  className="inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-105"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Curate Your Trip
                </Link>
              </Magnetic>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
