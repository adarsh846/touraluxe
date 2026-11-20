"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { Magnetic } from "@/components/Magnetic";
import { FilterBar, type FilterState } from "@/components/FilterBar";
import { PackageCard } from "@/components/PackageCard";
import { FAQAccordion } from "@/components/FAQAccordion";
import { useBooking } from "@/components/BookingProvider";
import { usePricing } from "@/hooks/usePricing";
import type { Package, Destination } from "@/lib/supabase";

export function DestinationDetailContent({ slug }: { slug: string }) {
  const { openModal } = useBooking();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [relatedDestinations, setRelatedDestinations] = useState<Destination[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    duration: [],
    budget: [],
    tripType: [],
    region: [],
    theme: [],
    flights: [],
    sort: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Parallelized Network Requests (eliminates API call waterfall bottleneck)
        const [destRes, pkgRes, allDestsRes] = await Promise.all([
          fetch(`/api/destinations/${slug}`),
          fetch(`/api/packages?destination=${slug}`),
          fetch("/api/destinations")
        ]);

        if (!destRes.ok) throw new Error("Destination not found");

        // Parallelized JSON Parsing
        const [destData, pkgData, allDests] = await Promise.all([
          destRes.json(),
          pkgRes.ok ? pkgRes.json() : Promise.resolve([]),
          allDestsRes.ok ? allDestsRes.json() : Promise.resolve([])
        ]);

        setDestination(destData);
        setPackages(pkgData);

        const related = allDests.filter((d: Destination) => 
          d.slug !== slug && (d.region === destData.region || d.is_international === destData.is_international)
        );
        setRelatedDestinations(related.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch destination data:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);



  const { computePrice } = usePricing();

  const filteredPackages = useMemo(() => {
    let result = [...packages];

    // Duration Filter (OR within category)
    if (filters.duration.length > 0) {
      result = result.filter(pkg => {
        const nights = parseInt(pkg.duration.match(/(\d+)\s*Night/i)?.[1] || "0");
        const days = nights + 1;
        return filters.duration.some(range => {
          if (range === "1-3") return days >= 1 && days <= 3;
          if (range === "4-7") return days >= 4 && days <= 7;
          if (range === "8-14") return days >= 8 && days <= 14;
          if (range === "14+") return days > 14;
          return false;
        });
      });
    }

    // Budget Filter (OR within category)
    if (filters.budget.length > 0) {
      result = result.filter(pkg => {
        const finalPrice = computePrice(pkg).finalTotal;
        return filters.budget.some(range => {
          if (range.includes("-")) {
            const [min, max] = range.split("-").map(Number);
            return finalPrice >= min && finalPrice <= max;
          }
          if (range.endsWith("+")) {
            const min = parseInt(range);
            return finalPrice >= min;
          }
          return false;
        });
      });
    }

    // Trip Type Filter (OR within category)
    if (filters.tripType.length > 0) {
      result = result.filter(pkg => {
        const pkgTypes = pkg.trip_type?.toLowerCase().split(",") || [];
        return filters.tripType.some(type => pkgTypes.includes(type.toLowerCase()));
      });
    }



    // Region Filter (OR within category)
    if (filters.region.length > 0) {
      result = result.filter(pkg => filters.region.includes(pkg.region || ""));
    }

    // Theme Filter (OR within category)
    if (filters.theme.length > 0) {
      result = result.filter(pkg => {
        const pkgThemes = pkg.tags || [];
        return filters.theme.some(theme => pkgThemes.includes(theme));
      });
    }
    
    // Flights Filter (OR within category)
    if (filters.flights.length > 0) {
      result = result.filter(pkg => filters.flights.includes(pkg.flights_status || "excluded"));
    }

    // Sort Logic
    if (filters.sort) {
      result.sort((a, b) => {
        const priceA = computePrice(a).finalTotal;
        const priceB = computePrice(b).finalTotal;
        const daysA = parseInt(a.duration.match(/(\d+)\s*Day/i)?.[1] || "0");
        const daysB = parseInt(b.duration.match(/(\d+)\s*Day/i)?.[1] || "0");
        if (filters.sort === "price-asc") return priceA - priceB;
        if (filters.sort === "price-desc") return priceB - priceA;
        if (filters.sort === "duration-asc") return daysA - daysB;
        if (filters.sort === "duration-desc") return daysB - daysA;
        return 0;
      });
    }

    return result;
  }, [packages, filters, computePrice]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-full border-t-2 border-white/20 border-r-2 border-r-white/80 animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Loading Destination</span>
        </div>
      </div>
    );
  }

  if (isError || !destination) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-[clamp(1.5rem,4vw,2rem)] text-balance font-semibold tracking-tight text-white mb-4">Destination Not Found</h1>
        <p className="text-white/40 mb-8">We couldn&apos;t find the destination you&apos;re looking for.</p>
        <Link href="/destinations" className="px-6 py-3 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">
          Browse All Destinations
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── CINEMATIC HERO ── */}
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-end pb-16 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden bg-white/5">
          {destination.cover_image ? (
            <Image src={destination.cover_image} alt={destination.name} fill className="object-cover" priority quality={85} decoding="async" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center"><MapPin size={48} className="text-white/10" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/destinations" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">
              <ArrowLeft size={12} strokeWidth={2.5} />
              Destinations
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">{destination.name}</span>
          </div>
          <h1 className="text-[clamp(2.5rem,8vw,6rem)] text-balance font-semibold tracking-tight leading-none text-white mb-6">{destination.name}</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">{packages.length} Journeys</div>
            {destination.region && <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">{destination.region}</div>}
          </div>
        </div>
      </section>

      {/* ── DESCRIPTION ── */}
      {destination.description && (
        <section className="px-6 py-16 border-b border-white/[0.04]">
          <div className="max-w-[800px] mx-auto text-center">
            <p className="text-lg md:text-xl text-white/60 leading-relaxed font-light">{destination.description}</p>
          </div>
        </section>
      )}

      {/* ── PACKAGES ── */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="sticky top-24 z-30 mx-auto w-fit max-w-[calc(100%-1rem)] min-w-0 bg-[#0a0a0b]/98 px-4 py-2 rounded-full border border-white/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] mb-10 flex items-center gap-2">
            <FilterBar packages={packages} filters={filters} onChange={setFilters} resultCount={filteredPackages.length} />
          </div>
          {filteredPackages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} onClick={(p) => openModal('PACKAGE', p, `DESTINATION_${destination.slug.toUpperCase()}`)} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6"><MapPin size={24} className="text-white/20" /></div>
              <h3 className="text-xl font-semibold text-white mb-2">No Journeys Match</h3>
              <p className="text-white/40 text-sm">Try adjusting your filters.</p>
              <button onClick={() => setFilters({ duration: [], budget: [], tripType: [], region: [], theme: [], flights: [], sort: "" })} className="mt-6 px-6 py-2.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">Clear Filters</button>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      {destination.faq && destination.faq.length > 0 && (
        <section className="px-6 py-16 md:py-24 border-t border-white/[0.04]">
          <div className="max-w-[800px] mx-auto"><FAQAccordion items={destination.faq} title={`Questions about ${destination.name}`} /></div>
        </section>
      )}

      {/* ── RELATED (Apple HIG Aligned) ── */}
      {relatedDestinations.length > 0 && (
        <section className="px-6 py-16 md:py-24 border-t border-white/[0.04] pb-32 overflow-hidden w-full">
          <div className="max-w-[1200px] mx-auto">
            {/* Section Header */}
            <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
              <div className="min-w-0 flex-1">
                <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold tracking-tight text-white leading-tight">
                  Explore More
                </h2>
                <p className="text-xs sm:text-sm text-[#86868b] mt-1 font-normal">
                  Other destinations you might love
                </p>
              </div>
              <Magnetic className="shrink-0">
                <Link
                  href="/destinations"
                  className="inline-flex items-center justify-center whitespace-nowrap px-3.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-full bg-white/10 hover:bg-white text-white/90 hover:text-black border border-white/15 text-[10px] md:text-[11px] font-semibold tracking-[0.1em] uppercase transition-all duration-300 active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.4)] touch-target-44"
                >
                  View All
                </Link>
              </Magnetic>
            </div>

            {/* ── Services-Style Responsive Shelf / Grid ── */}
            <div 
              className="flex flex-row overflow-x-auto lg:overflow-visible snap-x snap-mandatory scrollbar-hide gap-5 sm:gap-6 pt-2 pb-6 px-6 -mx-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:gap-6"
            >
              {relatedDestinations.map((dest) => (
                <div 
                  key={dest.id} 
                  className="shrink-0 w-[80vw] sm:w-[45vw] lg:w-auto h-auto snap-center snap-always"
                >
                  <Magnetic intensity={0.08} className="block w-full h-full">
                    <Link
                      href={`/destinations/${dest.slug}`}
                      replace
                      className="group relative block h-full aspect-[4/5] rounded-[2rem] overflow-hidden bg-black/60 border border-white/15 hover:border-amber-400/80 transition-all duration-700 cursor-pointer hover:translate-y-[-4px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(251,191,36,0.12)]"
                    >
                      {/* Background Image Container */}
                      <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem]">
                        {dest.cover_image ? (
                          <Image 
                            src={dest.cover_image} 
                            alt={dest.name} 
                            fill 
                            className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.25,1)] group-hover:scale-[1.04]"
                            quality={85}
                            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 380px"
                            decoding="async"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                            <MapPin size={40} className="text-white/10" />
                          </div>
                        )}
                        {/* Top Legibility Scrim */}
                        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/80 via-black/25 to-transparent pointer-events-none" />
                        {/* Bottom Vignette Scrim */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent transition-opacity duration-700" />
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute inset-0 z-10 p-6 sm:p-8 flex flex-col justify-between">
                        {/* Top Badge */}
                        <div className="flex justify-between items-start">
                          <div className="px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                            {dest.region || (dest.is_international ? "International" : "Domestic")}
                          </div>
                          {dest.stats?.packages && dest.stats.packages > 0 && (
                            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/80">
                              {dest.stats.packages} {dest.stats.packages === 1 ? "Journey" : "Journeys"}
                            </div>
                          )}
                        </div>

                        {/* Bottom Content Info */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-end justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 group-hover:text-amber-300/90 transition-colors">
                                {dest.country || "Explore Journey"}
                              </p>
                              <h3 
                                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                className="text-[clamp(1.5rem,2.5vw,2.25rem)] text-balance font-light tracking-tight text-white leading-none italic drop-shadow-lg"
                              >
                                {dest.name}
                              </h3>
                            </div>
                            
                            {/* Interaction Indicator — Always visible on mobile, reveals on desktop hover */}
                            <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-500 shadow-xl opacity-100 lg:opacity-0 lg:translate-y-2 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 group-hover:bg-white group-hover:text-black shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:text-black transition-colors">
                                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                              </svg>
                            </div>
                          </div>

                          {dest.description && (
                            <p className="text-xs text-[#a1a1a6] leading-relaxed line-clamp-2 opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-500">
                              {dest.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Kinetic Bottom Line */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-amber-400/40 transition-all duration-1000" />
                    </Link>
                  </Magnetic>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
