"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#f5f5f7] dark:bg-[#1d1d1f] py-16 px-6">
      <div className="mx-auto max-w-[1200px] flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="flex flex-col gap-4">
          <Link href="/" className="text-xl font-semibold tracking-tight text-foreground">
            TouraLuxe
          </Link>
          <p className="max-w-xs text-sm text-muted">
            We don’t sell trips. We craft transcendent experiences for the world’s most discerning travelers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-10 sm:gap-24">
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Experiences</h4>
            <Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Luxury Travel</Link>
            <Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Sports Tours</Link>
            <Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">MICE Events</Link>
            <Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Global Retreats</Link>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Company</h4>
            <Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">About</Link>
            <Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Journal</Link>
            <Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Contact</Link>
            <Link href="#" className="text-sm font-medium text-foreground hover:underline underline-offset-4">Privacy</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] mt-16 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
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
