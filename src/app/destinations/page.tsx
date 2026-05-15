"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowRight, Globe, Mountain } from "lucide-react";
import { Magnetic } from "@/components/Magnetic";
import { DestinationNavbar } from "@/components/DestinationNavbar";
import type { Destination } from "@/lib/supabase";

import { DestinationPortalContent } from "@/components/modals/DestinationPortalContent";

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <DestinationNavbar />
      <DestinationPortalContent />
    </div>
  );
}

function DestinationCard({ destination }: { destination: Destination }) {
  const packageCount = destination.stats?.packages || 0;
  const startingPrice = destination.stats?.starting_price;

  return (
    <Magnetic intensity={0.08} className="block w-full">
      <Link
        href={`/destinations/${destination.slug}`}
        className="group relative block w-full rounded-2xl md:rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-700 transform-gpu hover:translate-y-[-4px] hover:shadow-[0_20px_60px_-20px_rgba(255,255,255,0.06)]"
      >
        {/* Cover Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
          {destination.cover_image ? (
            <Image
              src={destination.cover_image}
              alt={destination.name}
              fill
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.06]"
              quality={75}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
              <MapPin size={32} className="text-white/10" />
            </div>
          )}
          
          {/* Enhanced cinematic gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {/* All Info Overlay */}
          <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-white leading-none">
                  {destination.name}
                </h3>
                <div className="flex items-center gap-3">
                  {destination.country && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                      {destination.country}
                    </p>
                  )}
                  {packageCount > 0 && (
                    <>
                      <span className="w-[3px] h-[3px] rounded-full bg-white/15" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                        {packageCount} {packageCount === 1 ? "Journey" : "Journeys"}
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              {/* Interaction Indicator */}
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <ArrowRight size={14} strokeWidth={2.5} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Magnetic>
  );
}
