"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowRight, Globe, Mountain } from "lucide-react";
import { Magnetic } from "@/components/Magnetic";
import type { Destination } from "@/lib/supabase";

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "international" | "india">("all");

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await fetch("/api/destinations");
        if (res.ok) {
          const data = await res.json();
          setDestinations(data);
        }
      } catch (err) {
        console.error("Failed to fetch destinations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === "all") return destinations;
    if (activeTab === "international") return destinations.filter(d => d.is_international);
    return destinations.filter(d => !d.is_international);
  }, [destinations, activeTab]);

  // Group by region
  const grouped = useMemo(() => {
    const map = new Map<string, Destination[]>();
    filtered.forEach(d => {
      const region = d.region || "Other";
      if (!map.has(region)) map.set(region, []);
      map.get(region)!.push(d);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Hero */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black pointer-events-none" />
        
        <div className="relative max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Globe size={14} strokeWidth={2} className="text-white/40" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
              Destinations
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] max-w-3xl">
            <span className="text-white">Discover Your</span>
            <br />
            <span className="text-white/30">Next Chapter</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-white/30 max-w-lg leading-relaxed">
            Each destination is a story waiting to unfold. Explore our curated collection of extraordinary places.
          </p>

          {/* Tab Filters */}
          <div className="mt-10 flex items-center gap-2">
            {[
              { key: "all" as const, label: "All Destinations", icon: Globe },
              { key: "international" as const, label: "International", icon: Globe },
              { key: "india" as const, label: "India", icon: Mountain },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-500 border ${
                  activeTab === tab.key
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/15"
                }`}
              >
                <tab.icon size={12} strokeWidth={2.5} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-[1200px] mx-auto space-y-16">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-3xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-white/20 text-sm">No destinations yet. Add them from the admin panel.</p>
            </div>
          ) : (
            grouped.map(([region, dests]) => (
              <div key={region} className="space-y-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white/70">
                    {region}
                  </h2>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/20">
                    {dests.length} {dests.length === 1 ? "destination" : "destinations"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dests.map((dest) => (
                    <DestinationCard key={dest.id} destination={dest} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Back to Home */}
      <section className="px-6 pb-16">
        <div className="max-w-[1200px] mx-auto flex justify-center">
          <Magnetic>
            <Link
              href="/"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/[0.03] border border-white/[0.08] text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:bg-white hover:text-black hover:border-white transition-all duration-500"
            >
              Back to Home
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </Magnetic>
        </div>
      </section>
    </div>
  );
}

function DestinationCard({ destination }: { destination: Destination }) {
  const packageCount = destination.stats?.packages || 0;
  const startingPrice = destination.stats?.starting_price;

  return (
    <Magnetic intensity={0.08}>
      <Link
        href={`/destinations/${destination.slug}`}
        className="group relative block rounded-2xl md:rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-700 transform-gpu hover:translate-y-[-4px] hover:shadow-[0_20px_60px_-20px_rgba(255,255,255,0.06)]"
      >
        {/* Cover Image */}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Bottom overlay info */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
              {destination.name}
            </h3>
            {destination.country && (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                {destination.country}
              </p>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="flex items-center justify-between p-5 md:p-6 border-t border-white/[0.04]">
          <div className="flex items-center gap-4">
            {packageCount > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
                {packageCount} Journeys
              </span>
            )}
            {startingPrice && (
              <>
                <span className="w-[3px] h-[3px] rounded-full bg-white/15" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
                  From ₹{startingPrice.toLocaleString("en-IN")}
                </span>
              </>
            )}
          </div>
          <ArrowRight size={14} strokeWidth={2.5} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-500" />
        </div>
      </Link>
    </Magnetic>
  );
}
