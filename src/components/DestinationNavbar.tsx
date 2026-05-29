"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { Magnetic } from "@/components/Magnetic";

export function DestinationNavbar({
  onBack,
  onX,
  forceScrolled,
}: {
  onBack?: () => void;
  onX?: () => void;
  forceScrolled?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [internalScrolled, setInternalScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setInternalScrolled(window.scrollY > 30);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onX) onX();
        else if (onBack) onBack();
      }
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onBack, onX]);

  const isScrolled = forceScrolled ?? internalScrolled;

  // On standalone pages, Back and X use router.push to do smooth client-side SPA navigations.
  const handlePageBack = () => {
    if (pathname.startsWith("/destinations/")) {
      router.push("/destinations");
    } else {
      router.push("/");
    }
  };

  const handlePageClose = () => {
    router.push("/");
  };

  const backLabel = pathname.startsWith("/destinations/") ? "Destinations" : "Home";

  return (
    <>
      {/* ═══ iOS 26 Progressive Blur Mask — only on standalone pages (not modal) ═══ */}
      {!(onBack || onX) && (
        <div
          className="pointer-events-none fixed top-0 left-0 right-0 h-32 md:h-36 z-[90] transform-gpu transition-opacity duration-1000"
          style={{
            opacity: isScrolled ? 0.95 : 0.85,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.05) 85%, transparent 100%)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
          }}
        />
      )}

      {/* ═══ Controls Row ═══ */}
      <div
        className="z-[100] flex justify-between items-center"
        style={{
          position: (onBack || onX) ? "absolute" : "fixed",
          top: "calc(env(safe-area-inset-top, 0px) + clamp(1.25rem, 5vh, 2.5rem))",
          left: "clamp(1.25rem, 6vw, 3rem)",
          right: "clamp(1.25rem, 6vw, 3rem)",
        }}
      >
        {/* Left: Logo Pill */}
        <div className="flex-1 flex items-center justify-start">
          <Magnetic>
            <button onClick={onX ?? handlePageClose} className="relative group block">
              <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
              <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
              <div className="relative flex items-center justify-center bg-[#f5f5f7] rounded-full transition-all duration-700 group-hover:scale-[1.05] overflow-hidden border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] w-24 h-9 md:w-28 md:h-10">
                <div className="relative w-full h-full flex items-center justify-center">
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
            </button>
          </Magnetic>
        </div>

        {/* Center slot */}
        <div className="flex-1 hidden lg:flex items-center justify-center" />

        {/* Right: Back Pill + Close Circle */}
        <div className="flex-1 flex items-center justify-end gap-3">

          {/* Back Pill */}
          <Magnetic>
            {/* In modal: trigger cinematic exit. On page: hard nav to avoid interception. */}
            <button
              onClick={onBack ?? handlePageBack}
              className="relative group block"
            >
              <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
              <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
              <div className="relative px-5 h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center gap-3 transition-all duration-500 hover:bg-white hover:text-black text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-90 group/backbtn">
                <ArrowLeft size={18} strokeWidth={2.5} className="group-hover/backbtn:-translate-x-1 transition-transform" />
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 group-hover:text-black/70 transition-colors">
                  {backLabel}
                </span>
              </div>
            </button>
          </Magnetic>

          {/* Close Circle */}
          <Magnetic>
            <button
              onClick={onX ?? handlePageClose}
              className="relative group block"
            >
              <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
              <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
              <div className="relative w-10 h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-500 hover:bg-white hover:text-black text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-90">
                <X size={20} strokeWidth={2.5} />
              </div>
            </button>
          </Magnetic>
        </div>
      </div>
    </>
  );
}
