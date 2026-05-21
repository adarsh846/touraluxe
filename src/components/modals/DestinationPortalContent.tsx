"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowRight, Globe, Mountain } from "lucide-react";
import { Magnetic } from "@/components/Magnetic";
import type { Destination } from "@/lib/supabase";

export function DestinationPortalContent() {
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
        console.warn("Failed to fetch destinations:", err);
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

  const grouped = useMemo(() => {
    const map = new Map<string, Destination[]>();
    filtered.forEach(d => {
      const region = d.region || "Other";
      if (!map.has(region)) map.set(region, []);
      map.get(region)!.push(d);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Background Slideshow Intelligence
  useEffect(() => {
    if (destinations.length === 0) return;
    const interval = setInterval(() => {
      setActiveImageIndex(prev => (prev + 1) % destinations.length);
    }, 6000); // 6 second editorial rhythm
    return () => clearInterval(interval);
  }, [destinations]);

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex flex-col justify-center pt-24 md:pt-28 pb-16 md:pb-24 px-6 overflow-hidden">
        {/* Cinematic Slideshow Engine */}
        <div className="absolute inset-0 z-0">
          {destinations.map((dest, idx) => (
            <div
              key={`bg-${dest.id}`}
              className={`absolute inset-0 transition-all duration-[2500ms] ease-in-out transform ${
                idx === activeImageIndex 
                  ? "opacity-65 scale-100" 
                  : "opacity-0 scale-110"
              }`}
            >
              {dest.cover_image && (
                <Image
                  src={dest.cover_image}
                  alt="Atmosphere"
                  fill
                  className="object-cover"
                  priority={idx === 0}
                  quality={100}
                />
              )}
            </div>
          ))}
          {/* Multi-layered cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/10" />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto w-full">
          <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
              <Globe size={14} strokeWidth={2} className="text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">
              Global Manifest
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            <span className="bg-gradient-to-b from-white via-white/80 to-white/40 bg-clip-text text-transparent inline-block">Discover Your</span>
            <br className="md:hidden" />
            <span className="md:ml-5 bg-gradient-to-b from-[#86868b] via-[#a1a1a6] to-[#86868b] bg-clip-text text-transparent font-normal italic inline-block">Next Chapter.</span>
          </h1>

          <p className="mt-8 text-base md:text-xl text-white/40 max-w-xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Moments that move you. Places you&apos;ll never forget.
          </p>

          <div className="mt-12 flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            {[
              { key: "all" as const, label: "All Destinations", icon: Globe },
              { key: "international" as const, label: "International", icon: Globe },
              { key: "india" as const, label: "India", icon: Mountain },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-700 border backdrop-blur-md ${
                  activeTab === tab.key
                    ? "bg-white text-black border-white shadow-[0_10px_30px_-10px_rgba(255,255,255,0.3)]"
                    : "bg-white/[0.05] border-white/[0.1] text-white/40 hover:border-white/30"
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
      <section className="px-6 pt-12 md:pt-20 pb-24 md:pb-32">
        <div className="max-w-[1200px] mx-auto space-y-16">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-3xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((dest) => (
                <DestinationCard key={dest.id} destination={dest} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DestinationCard({ destination }: { destination: Destination }) {
  const packageCount = destination.stats?.packages || 0;

  return (
    <Magnetic intensity={0.08} className="block w-full">
      <Link
        href={`/destinations/${destination.slug}`}
        className="group relative block w-full rounded-2xl md:rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-700 transform-gpu hover:translate-y-[-4px] hover:shadow-[0_20px_60px_-20px_rgba(255,255,255,0.06)]"
      >
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
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

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
