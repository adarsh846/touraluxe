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
    difficulty: [],
    region: [],
    theme: [],
    flights: [],
    sort: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const destRes = await fetch(`/api/destinations/${slug}`);
        if (!destRes.ok) throw new Error("Destination not found");
        const destData = await destRes.json();
        setDestination(destData);

        const pkgRes = await fetch(`/api/packages?destination=${slug}`, { cache: 'no-store' });
        if (pkgRes.ok) {
          const pkgData = await pkgRes.json();
          setPackages(pkgData);
        }

        const allDestsRes = await fetch("/api/destinations");
        if (allDestsRes.ok) {
          const allDests = await allDestsRes.json();
          const related = allDests.filter((d: Destination) => d.slug !== slug && (d.region === destData.region || d.is_international === destData.is_international));
          setRelatedDestinations(related.slice(0, 6));
        }
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

    // Difficulty Filter (OR within category)
    if (filters.difficulty.length > 0) {
      result = result.filter(pkg => filters.difficulty.includes(pkg.difficulty_level || ""));
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
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-end pb-16 md:pb-24">
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
          <div className="sticky top-24 z-30 mx-auto w-fit max-w-[calc(100vw-3rem)] min-w-0 bg-white/[0.03] backdrop-blur-3xl px-4 py-2 rounded-full border border-white/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] mb-10 flex items-center gap-2">
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
              <button onClick={() => setFilters({ duration: [], budget: [], tripType: [], difficulty: [], region: [], theme: [], flights: [], sort: "" })} className="mt-6 px-6 py-2.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">Clear Filters</button>
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

      {/* ── RELATED ── */}
      {relatedDestinations.length > 0 && (
        <section className="px-6 py-16 md:py-24 border-t border-white/[0.04] pb-32">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-[clamp(1.25rem,4vw,2rem)] text-balance font-semibold tracking-tight text-white">Explore More</h2>
                <p className="text-white/30 text-sm mt-1">Other destinations you might love</p>
              </div>
              <Magnetic><Link href="/destinations" className="px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 hover:bg-white hover:text-black transition-all duration-500">View All</Link></Magnetic>
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
              <div className="flex gap-6" style={{ minWidth: 'max-content' }}>
                {relatedDestinations.map((dest) => (
                  <Link key={dest.id} href={`/destinations/${dest.slug}`} className="group flex-shrink-0 w-[300px] rounded-[2rem] overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-700 hover:translate-y-[-4px]">
                    <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
                      {dest.cover_image ? (
                        <Image src={dest.cover_image} alt={dest.name} fill className="object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out" quality={80} sizes="300px" decoding="async" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"><MapPin size={32} className="text-white/10" /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <div className="absolute inset-0 p-6 flex flex-col justify-between">
                        <div className="flex justify-end">
                          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] text-white/60">
                            {dest.region || "Discovery"}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-white tracking-tight leading-none group-hover:translate-x-1 transition-transform duration-700">{dest.name}</h3>
                            {dest.country && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{dest.country}</p>}
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-700">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Explore Journey</span>
                            <ArrowRight size={12} className="text-white/40" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
