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

interface Destination {
  id: string;
  title: string;
  slug: string;
  image: string;
  description?: string;
  region?: string;
  highlights?: string[];
  faq?: { question: string; answer: string }[];
}

interface Package {
  id: string;
  title: string;
  location: string;
  image: string;
  price: any;
  duration: string;
  is_featured?: boolean;
}

export function DestinationDetailContent({ slug }: { slug: string }) {
  const { openModal } = useBooking();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [relatedDestinations, setRelatedDestinations] = useState<Destination[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    duration: "",
    budget: "",
    tripType: "",
    difficulty: "",
    region: "",
    theme: "",
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
    if (filters.duration) {
      result = result.filter(pkg => {
        const nights = parseInt(pkg.duration.match(/(\d+)\s*Night/i)?.[1] || "0");
        const days = nights + 1;
        if (filters.duration === "1-3") return days >= 1 && days <= 3;
        if (filters.duration === "4-7") return days >= 4 && days <= 7;
        if (filters.duration === "8-14") return days >= 8 && days <= 14;
        if (filters.duration === "14+") return days > 14;
        return true;
      });
    }
    if (filters.budget) {
      result = result.filter(pkg => {
        const finalPrice = computePrice(pkg).finalTotal;
        if (filters.budget === "0-20000") return finalPrice <= 20000;
        if (filters.budget === "20000-50000") return finalPrice > 20000 && finalPrice <= 50000;
        if (filters.budget === "50000-100000") return finalPrice > 50000 && finalPrice <= 100000;
        if (filters.budget === "100000+") return finalPrice > 100000;
        return true;
      });
    }
    if (filters.tripType) result = result.filter(pkg => pkg.trip_type?.toLowerCase() === filters.tripType.toLowerCase());
    if (filters.difficulty) result = result.filter(pkg => pkg.difficulty_level === filters.difficulty);
    if (filters.region) result = result.filter(pkg => pkg.region === filters.region);
    if (filters.theme) result = result.filter(pkg => pkg.tags?.includes(filters.theme));
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
  }, [packages, filters]);

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
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-4">Destination Not Found</h1>
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
            <Image src={destination.cover_image} alt={destination.name} fill className="object-cover" priority quality={85} />
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
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-none text-white mb-6">{destination.name}</h1>
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
              <button onClick={() => setFilters({ duration: "", budget: "", tripType: "", difficulty: "", sort: "" })} className="mt-6 px-6 py-2.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">Clear Filters</button>
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
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Explore More</h2>
                <p className="text-white/30 text-sm mt-1">Other destinations you might love</p>
              </div>
              <Magnetic><Link href="/destinations" className="px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 hover:bg-white hover:text-black transition-all duration-500">View All</Link></Magnetic>
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
              <div className="flex gap-6" style={{ minWidth: 'max-content' }}>
                {relatedDestinations.map((dest) => (
                  <Link key={dest.id} href={`/destinations/${dest.slug}`} className="group flex-shrink-0 w-[300px] rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:translate-y-[-4px]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                      {dest.cover_image ? (
                        <Image src={dest.cover_image} alt={dest.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" quality={60} sizes="300px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"><MapPin size={32} className="text-white/10" /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-5 right-5">
                        <h3 className="text-xl font-semibold text-white tracking-tight">{dest.name}</h3>
                        {dest.country && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mt-1">{dest.country}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-5 border-t border-white/[0.04]"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">{dest.region || "Explore"}</span><ArrowRight size={14} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" /></div>
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
