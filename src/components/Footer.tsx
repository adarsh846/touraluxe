"use client";

import Link from "next/link";
import Image from "next/image";
import { Magnetic } from "./Magnetic";

export function Footer() {
  return (
    <footer className="w-full bg-[#1d1d1f] py-16 px-6">
      <div className="mx-auto max-w-[1200px] flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="flex flex-col gap-4">
          <Magnetic>
            <a href="/" className="flex items-center justify-center bg-foreground rounded-full w-28 h-10 overflow-hidden hover:scale-[1.03] transition-transform duration-300">
              <div className="relative w-28 h-10">
                <Image
                  src="/assets/logo-transparent.png"
                  alt="TouraLuxe Logo"
                  fill
                  className="object-contain scale-[2.1] translate-y-[4px]"
                />
              </div>
            </a>
          </Magnetic>
          <p className="max-w-xs text-sm text-muted">
            We don't sell trips. We craft transcendent experiences for the world's most discerning travelers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-10 sm:gap-24">
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Experiences</h4>
            <Magnetic><Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Luxury Travel</Link></Magnetic>
            <Magnetic><Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Sports Tours</Link></Magnetic>
            <Magnetic><Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">MICE Events</Link></Magnetic>
            <Magnetic><Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Global Retreats</Link></Magnetic>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Company</h4>
            <Magnetic><Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">About</Link></Magnetic>
            <Magnetic><Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Journal</Link></Magnetic>
            <Magnetic><Link href="mailto:hello@touraluxe.com" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Contact</Link></Magnetic>
            <Magnetic><Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Privacy</Link></Magnetic>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted">
          &copy; {new Date().getFullYear()} TouraLuxe. All rights reserved.
        </p>
        <p className="text-xs text-muted">
          Designed with purpose.
        </p>
      </div>
    </footer>
  );
}
