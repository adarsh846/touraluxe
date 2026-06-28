"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Package } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { usePricing } from "@/hooks/usePricing";

import { MediaUploadPanel } from "./package-form/MediaUploadPanel";
import { BasicInfoPanel } from "./package-form/BasicInfoPanel";
import { LogisticsPricingPanel } from "./package-form/LogisticsPricingPanel";
import { FinancialArchitecturePanel } from "./package-form/FinancialArchitecturePanel";
import { ItineraryFaqPanel } from "./package-form/ItineraryFaqPanel";
import type { PackageFormState } from "./package-form/types";

type PackageFormProps = {
  initialData?: Package;
  isEditing?: boolean;
};

export function PackageForm({ initialData, isEditing }: PackageFormProps) {
  const router = useRouter();
  const { computePrice, settings } = usePricing();

  const parseDuration = (d: string) => {
    const nights = d.match(/(\d+)\s*Night/i)?.[1] || "";
    const days = d.match(/(\d+)\s*Day/i)?.[1] || "";
    return { nights, days };
  };

  const initialDur = parseDuration(initialData?.duration || "");
  const ALLOWED_CATEGORIES = ["Luxury Tours", "Group Trips", "Adventure Tours", "Luxury Honeymoons", "MICE Events", "Custom Journeys"];

  // Detect and unpack the Aviation Anchor from the stable column
  const getAnchor = () => {
    try {
      const anchor = (initialData as any)?.itinerary_url;
      if (anchor && anchor.includes('{')) {
        return JSON.parse(anchor);
      }
    } catch (e) { console.warn("Aviation Anchor Corrupt", e); }
    return null;
  };
  const anchor = getAnchor();

  const [form, setForm] = useState<PackageFormState>({
    title: initialData?.title || "",
    location: initialData?.location || "",
    image: initialData?.image || "",
    price: initialData?.price || "",
    child_price: initialData?.child_price || "",
    infant_price: initialData?.infant_price || "",
    nights: initialDur.nights,
    days: initialDur.days,
    guests: initialData?.guests || "",
    tagline: initialData?.tagline || "",
    description: initialData?.description || "",
    soul_of_journey: anchor?.soul_of_journey || "",
    destinations_covered: anchor?.destinations_covered || (initialData as any)?.destinations_covered || "",
    highlights: initialData?.highlights || [""],
    inclusions: initialData?.inclusions || [""],
    exclusions: initialData?.exclusions || [""],
    itinerary: (initialData?.itinerary as any[]) || [{ day: "1", title: "", description: "", image: "" }],
    faq: (initialData as any)?.faq || [{ question: "", answer: "" }],
    gallery: (initialData as any)?.gallery || [],
    category: Array.isArray(initialData?.category) 
      ? initialData.category.filter(cat => ALLOWED_CATEGORIES.includes(cat)) 
      : (initialData?.category && ALLOWED_CATEGORIES.includes(initialData.category as string) ? [initialData.category as string] : []),
    is_published: initialData?.is_published ?? false,
    sort_order: initialData?.sort_order ?? 99,
    tax_status: initialData?.tax_status || "Inclusive of Taxes",
    tax_percentage: anchor?.tax_percentage || "0",
    currency: initialData?.currency || "₹",
    season: initialData?.season || "",
    // ── Operational Fields ──
    original_price: (initialData as any)?.original_price || "",
    badge: (initialData as any)?.badge || "",
    is_featured: (initialData as any)?.is_featured ?? false,
    route_start: (initialData as any)?.route_start || "",
    route_end: (initialData as any)?.route_end || "",
    min_group_size: (initialData as any)?.min_group_size ?? 1,
    max_group_size: (initialData as any)?.max_group_size === null ? null : ((initialData as any)?.max_group_size ?? 20),
    tags: (initialData as any)?.tags || [],
    destination: (initialData as any)?.destination || "",
    region: (initialData as any)?.region || "",
    trip_type: Array.isArray((initialData as any)?.trip_type)
      ? (initialData as any).trip_type
      : ((initialData as any)?.trip_type || "group").split(",").filter(Boolean),
    itinerary_url: (initialData as any)?.itinerary_url || "",
    flights_status: anchor?.status || (initialData as any)?.flights_status || "excluded",
    flight_price_estimate: anchor?.estimate || (initialData as any)?.flight_price_estimate || "",
    departure_cities: anchor?.hubs || anchor?.departure_cities || (initialData as any)?.departure_cities || [],
    flight_type: anchor?.type || (initialData as any)?.flight_type || "Round-Trip",
    flight_segments: anchor?.segments || (Array.isArray((initialData as any)?.flight_segments) 
      ? (initialData as any)?.flight_segments 
      : (initialData as any)?.flight_segments?.segments || [{ label: "", price: "" }]),
    flight_price_child: anchor?.child_fare || (initialData as any)?.flight_price_child || (initialData as any)?.flight_segments?.child_fare || "",
    flight_price_infant: anchor?.infant_fare || (initialData as any)?.flight_price_infant || (initialData as any)?.flight_segments?.infant_fare || "",
    tiers: anchor?.tiers?.map((t: any) => ({
      name: t.name || "",
      price_grid: Object.entries(t.price_grid || {}).map(([pax, price]) => ({ pax: String(pax), price: String(price) })),
      hotels: Object.entries(t.hotels || {}).map(([city, hotel]) => ({ city: String(city), hotel: String(hotel) })),
      pdf_url: t.pdf_url || ""
    })) || [],
    transports: anchor?.transports || [],
    pdf_url: anchor?.pdf_url || ((initialData as any)?.itinerary_url && !(initialData as any)?.itinerary_url.startsWith('{') ? (initialData as any).itinerary_url : ""),
    pricing_note: anchor?.pricing_note || "",
    flight_terms: anchor?.flight_terms || "",
    addons: anchor?.addons || [],
    seasons_list: anchor?.seasons_list || [],
  });

  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });
  const [isScrolled, setIsScrolled] = useState(false);
  const [availableDestinations, setAvailableDestinations] = useState<{name: string; slug: string}[]>([]);
  const dynamicOptions = {
    tripTypes: settings.available_trip_types.split(",").map(s => s.trim()),
    difficulties: settings.available_difficulties.split(",").map(s => s.trim())
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // ── Fiscal Synchronization ──
  // Ensure the master estimate always matches the live ledger sum
  useEffect(() => {
    const total = form.flight_segments.reduce((acc: number, s: any) => 
      acc + (parseInt(String(s.price).replace(/[^0-9]/g, "")) || 0), 0
    );
    if (total.toString() !== form.flight_price_estimate) {
      setForm(p => ({ ...p, flight_price_estimate: total.toString() }));
    }
  }, [form.flight_segments, form.flight_price_estimate]);

  useEffect(() => {
    fetch("/api/destinations")
      .then(r => r.ok ? r.json() : [])
      .then((data: {name: string; slug: string; is_published: boolean}[]) => {
        setAvailableDestinations(data.filter(d => d.is_published).map(d => ({ name: d.name, slug: d.slug })));
      })
      .catch(() => {});
  }, []);

  // --- Load Draft from sessionStorage ---
  useEffect(() => {
    try {
      const key = isEditing ? `touraluxe_edit_package_draft_${initialData?.id}` : "touraluxe_new_package_draft";
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn("Failed to load draft from sessionStorage:", e);
    }
  }, [isEditing, initialData?.id]);

  // --- Save Draft to sessionStorage ---
  useEffect(() => {
    try {
      const key = isEditing ? `touraluxe_edit_package_draft_${initialData?.id}` : "touraluxe_new_package_draft";
      sessionStorage.setItem(key, JSON.stringify(form));
    } catch (e) {
      console.warn("Failed to save draft to sessionStorage:", e);
    }
  }, [form, isEditing, initialData?.id]);

  // Synchronize main season summary with detailed seasons list
  useEffect(() => {
    if (form.seasons_list && form.seasons_list.length > 0) {
      const summary = form.seasons_list.map(s => s.season).filter(Boolean).join(" & ");
      if (form.season !== summary) {
        setForm(p => ({ ...p, season: summary }));
      }
    }
  }, [form.seasons_list, form.season]);

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const safeBack = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin/dashboard");
    }
  }, [isDirty, router]);

  const confirmDiscard = () => {
    try {
      const key = isEditing ? `touraluxe_edit_package_draft_${initialData?.id}` : "touraluxe_new_package_draft";
      sessionStorage.removeItem(key);
    } catch (e) {}
    setShowDiscardConfirm(false);
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin/dashboard");
    }
  };

  const getToken = useCallback(() => {
    return sessionStorage.getItem("admin_token") || "";
  }, []);

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!form.title || !form.title.trim()) {
        setToast({ show: true, message: "Package Title is required.", type: "error" });
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(p => p + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps first
    for (let s = 0; s < 4; s++) {
      if (!validateStep(s)) {
        setActiveStep(s);
        return;
      }
    }

    setSaving(true);

    const token = getToken();
    
    // Construct duration string
    const duration = `${form.nights} Nights ${form.days} Days`;
    
    const serializedTiers = form.tiers.map((t: any) => {
      const price_grid: { [key: string]: string } = {};
      (t.price_grid || []).forEach((row: any) => {
        if (row.pax && row.pax.trim()) {
          price_grid[row.pax.trim()] = row.price;
        }
      });
      const hotels: { [key: string]: string } = {};
      (t.hotels || []).forEach((row: any) => {
        if (row.city && row.city.trim()) {
          hotels[row.city.trim()] = row.hotel;
        }
      });
      return {
        name: t.name,
        price_grid,
        hotels,
        pdf_url: t.pdf_url
      };
    });

    // Total Aviation Anchor Strategy: Bundle ALL flight, tier, and transport metadata into one safe column
    const aviationAnchor = JSON.stringify({
      segments: form.flight_segments,
      type: form.flight_type,
      child_fare: form.flight_price_child,
      infant_fare: form.flight_price_infant,
      status: form.flights_status,
      hubs: form.departure_cities,
      estimate: form.flight_price_estimate,
      tiers: serializedTiers,
      transports: form.transports,
      pdf_url: form.pdf_url,
      destinations_covered: form.destinations_covered,
      pricing_note: form.pricing_note,
      tax_percentage: form.tax_percentage,
      flight_terms: form.flight_terms,
      addons: form.addons,
      seasons_list: form.seasons_list,
      soul_of_journey: form.soul_of_journey
    });

    // Sterilize the payload: Remove ALL potential schema-mismatch columns
    const { 
      flight_segments: _fs,
      flight_type: _ft,
      flights_status: _fst,
      departure_cities: _dc,
      flight_price_estimate: _fpe,
      flight_price_child: _c,
      flight_price_infant: _i,
      tiers: _tiers,
      transports: _transports,
      pdf_url: _pdf_url,
      destinations_covered: _dest_cov,
      pricing_note: _pn,
      tax_percentage: _tp,
      flight_terms: _fit,
      addons: _addons,
      seasons_list: _seasons_list,
      soul_of_journey: _soj,
      ...safeForm 
    } = form;

    const payload = {
      ...safeForm,
      duration,
      itinerary_url: aviationAnchor, // All aviation data is safe in this single column
      highlights: form.highlights.filter((h) => h.trim() !== ""),
      inclusions: form.inclusions.filter((h) => h.trim() !== ""),
      exclusions: form.exclusions.filter((h) => h.trim() !== ""),
      itinerary: form.itinerary.filter((item) => item.title.trim() !== ""),
      trip_type: Array.isArray(form.trip_type) ? form.trip_type.join(",") : form.trip_type,
      faq: form.faq.filter((f: { question: string; answer: string }) => f.question.trim() !== ""),
      gallery: (form.gallery || []).filter((g: string) => g.trim() !== ""),
    };

    const url = isEditing
      ? `/api/packages/${initialData?.id}`
      : "/api/packages";

    try {
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDirty(false);
        try {
          const key = isEditing ? `touraluxe_edit_package_draft_${initialData?.id}` : "touraluxe_new_package_draft";
          sessionStorage.removeItem(key);
        } catch (e) {}
        setToast({ show: true, message: isEditing ? "Journey refined successfully." : "New journey forged successfully.", type: "success" });
        setTimeout(() => router.push("/admin/dashboard"), 1500);
      } else {
        const err = await res.json();
        setToast({ show: true, message: `Fiscal Failure: ${err.error || "Unknown Error"}`, type: "error" });
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setToast({ show: true, message: `Fiscal Failure: ${err.message || "Network Error"}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Top Bar */}
      <header 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] px-4 md:px-8 ${
          isScrolled 
            ? "py-3" 
            : "py-4 md:py-6"
        }`}
      >
        {/* iOS 26-style Hyper-Smooth Progressive Mask */}
        <div 
          className="pointer-events-none absolute inset-0 transition-all duration-1000 backdrop-blur-[5px]" 
          style={{ 
            opacity: isScrolled ? 0.95 : 0.85,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.05) 85%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
          }}
        />

        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 md:gap-5">
            <button type="button" onClick={safeBack} className="relative block group shrink-0">
              <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
              <div className={`relative flex items-center justify-center bg-[#f5f5f7] rounded-full overflow-hidden border border-white/10 transition-all duration-700 ${isScrolled ? "w-[4.5rem] md:w-[5.5rem] h-7 md:h-8" : "w-20 md:w-28 h-8 md:h-10"}`}>
                <Image src="/assets/logo-transparent.webp" alt="TouraLuxe" fill priority className="object-contain scale-[2.1] translate-y-[4px] brightness-[0.05]" />
              </div>
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-white/90 bg-white/5 px-3 py-1 rounded-full border border-white/10 leading-none">Admin</span>
              <span className="flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-white/80 bg-white/10 px-3 py-1 rounded-full border border-white/20 leading-none">Catalog</span>
              <div className="flex items-center justify-center px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] leading-none">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                  {isEditing ? "Edit" : "New"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button type="button" onClick={safeBack} className="hidden md:block px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">Discard</button>
            <button type="submit" disabled={saving} form="package-form" className="hidden md:block px-8 py-2.5 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#f5f5f7] active:scale-95 transition-all disabled:opacity-50 shadow-2xl">
              {saving ? "..." : isEditing ? "Update Journey" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-40 md:pb-24">
        {/* Step Indicator Header */}
        <div className="mb-12 border-b border-white/10 pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {activeStep === 0 && "1. Core Identity & Category"}
                {activeStep === 1 && "2. Media & Narrative Content"}
                {activeStep === 2 && "3. Logistics, Route & Pricing"}
                {activeStep === 3 && "4. Itinerary, FAQ & Publication"}
              </h2>
              <p className="text-[13px] text-white/50 mt-1 italic leading-none">
                {activeStep === 0 && "Set Title, tagline, category, duration, destination, region, season, and tags."}
                {activeStep === 1 && "Upload cover photo, gallery assets, and add highlights, inclusions, and exclusions."}
                {activeStep === 2 && "Configure flights status, route airports, difficulty, group sizes, and cost tiers."}
                {activeStep === 3 && "Plan day-by-day itineraries, add FAQs, upload PDFs, and publish."}
              </p>
            </div>

            {/* Stepper Buttons / Badges */}
            <div className="flex items-center gap-2 overflow-x-auto p-1 pb-2 scrollbar-hide">
              {[
                { num: 1, label: "Identity" },
                { num: 2, label: "Media & Lists" },
                { num: 3, label: "Logistics" },
                { num: 4, label: "Itinerary" }
              ].map((step, idx) => (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                    activeStep === idx
                      ? "bg-white text-black border-white shadow-xl scale-[1.02]"
                      : idx < activeStep
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-[#1c1c1e] border-white/5 text-white/40 hover:text-white"
                  )}
                >
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black border",
                    activeStep === idx
                      ? "bg-black border-black text-white"
                      : idx < activeStep
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      : "bg-white/5 border-white/10 text-white/30"
                  )}>
                    {idx < activeStep ? "✓" : step.num}
                  </span>
                  {step.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} id="package-form" className="space-y-12">
          
          {/* STEP 1: Core Identity details */}
          {activeStep === 0 && (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <BasicInfoPanel 
                form={form} 
                setForm={setForm} 
                setIsDirty={setIsDirty} 
                mode="identity"
              />
              <LogisticsPricingPanel 
                form={form} 
                setForm={setForm} 
                setIsDirty={setIsDirty} 
                availableDestinations={availableDestinations}
                dynamicOptions={dynamicOptions}
                mode="identity"
              />
            </div>
          )}

          {/* STEP 2: Media and content lists */}
          {activeStep === 1 && (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <MediaUploadPanel 
                form={form} 
                setForm={setForm} 
                setIsDirty={setIsDirty} 
                setToast={setToast} 
              />
              <BasicInfoPanel 
                form={form} 
                setForm={setForm} 
                setIsDirty={setIsDirty} 
                mode="lists"
              />
            </div>
          )}

          {/* STEP 3: Route, Logistics, Flights & Pricing */}
          {activeStep === 2 && (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <LogisticsPricingPanel 
                form={form} 
                setForm={setForm} 
                setIsDirty={setIsDirty} 
                availableDestinations={availableDestinations}
                dynamicOptions={dynamicOptions}
                mode="logistics"
              />
              <FinancialArchitecturePanel 
                form={form} 
                setForm={setForm} 
                setIsDirty={setIsDirty} 
              />
            </div>
          )}

          {/* STEP 4: Itinerary, FAQ & Publish */}
          {activeStep === 3 && (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ItineraryFaqPanel 
                form={form} 
                setForm={setForm} 
                setIsDirty={setIsDirty} 
                setToast={setToast} 
              />

              {/* ── SECTION 4: PUBLICATION SETTINGS ── */}
              <section className="space-y-8 pt-8 border-t border-white/[0.02]">
                <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
                  Publishing Options
                </h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 md:p-8 rounded-3xl bg-[#1c1c1e] border border-white/[0.04]">
                  <div className="flex-1 space-y-3">
                    <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">Display Position (1 = Top)</label>
                    <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => { setIsDirty(true); return { ...p, sort_order: parseInt(e.target.value) || 0 }})} className="w-full sm:w-32 h-[56px] px-4 rounded-xl md:rounded-2xl bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-white/[0.05] pt-6 sm:pt-0">
                    <div className="text-right">
                      <span className="block text-[13px] font-bold text-white uppercase tracking-wider">{form.is_published ? "Published to Website" : "Saved as Draft"}</span>
                      <span className="block text-[11px] text-white/50 mt-1">{form.is_published ? "Live and visible to all guests" : "Hidden from public view"}</span>
                    </div>
                    <button type="button" onClick={() => setForm((p) => { setIsDirty(true); return { ...p, is_published: !p.is_published }})} className={`relative w-16 h-9 rounded-full transition-all duration-500 shrink-0 ${form.is_published ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-[#3a3a3c]"}`}>
                      <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${form.is_published ? "left-[34px]" : "left-1"}`} />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Desktop Navigation Footer */}
          <div className="hidden sm:flex items-center justify-between pt-8 border-t border-white/10 mt-12">
            <div>
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(p => p - 1)}
                  className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[13px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Previous Step
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={() => router.push("/admin/dashboard")} 
                className="px-8 py-4 rounded-2xl bg-red-500/[0.02] border border-red-500/30 text-white/50 font-bold text-[13px] tracking-wider uppercase hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all active:scale-[0.98]"
              >
                Discard
              </button>

              {activeStep < 3 ? (
                <button
                  key="next-step-btn"
                  type="button"
                  onClick={handleNextStep}
                  className="px-12 py-4 rounded-2xl bg-white text-black font-bold text-[13px] tracking-wider uppercase transition-all hover:bg-white/90 active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  Next Step
                </button>
              ) : (
                <button 
                  key="submit-step-btn"
                  type="submit" 
                  disabled={saving} 
                  className="px-12 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-[13px] tracking-wider uppercase transition-all hover:bg-emerald-400 disabled:opacity-40 active:scale-[0.98] shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                  {saving ? "Synchronizing..." : isEditing ? "Save Journey" : "Publish Journey"}
                </button>
              )}
            </div>
          </div>

        </form>
      </main>

      {/* Floating Action Bar (Mobile only) */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-[70] animate-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center gap-3 p-2 rounded-[24px] bg-black/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {activeStep > 0 ? (
            <button 
              type="button" 
              onClick={() => setActiveStep(p => p - 1)} 
              className="flex-1 h-12 rounded-[18px] bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/70 active:scale-95 transition-all"
            >
              Prev
            </button>
          ) : (
            <button 
              type="button" 
              onClick={safeBack} 
              className="flex-1 h-12 rounded-[18px] bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/50 active:scale-95 transition-all"
            >
              Discard
            </button>
          )}

          {activeStep < 3 ? (
            <button 
              key="mobile-next-btn"
              type="button" 
              onClick={handleNextStep} 
              className="flex-[2] h-12 rounded-[18px] bg-white text-black text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
            >
              Next
            </button>
          ) : (
            <button 
              key="mobile-submit-btn"
              type="submit" 
              form="package-form" 
              disabled={saving} 
              className="flex-[2] h-12 rounded-[18px] bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
            >
              {saving ? "Saving..." : isEditing ? "Update" : "Publish"}
            </button>
          )}
        </div>
      </div>

      {/* ═══ CINEMATIC ALERT SYSTEM ═══ */}
      <AnimatePresence>
        {showDiscardConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            {/* Backdrop with Progressive Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiscardConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />

            {/* Alert Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[400px] bg-[#1c1c1e] border border-white/[0.08] rounded-[32px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-3">Unsaved Changes</h2>
              <p className="text-[14px] text-white/50 leading-relaxed mb-8">
                Your journey's configuration has been modified. Discarding will purge these edits forever.
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDiscard}
                  className="w-full py-4 rounded-2xl bg-white text-black text-[13px] font-black uppercase tracking-widest hover:bg-[#f5f5f7] transition-all active:scale-95"
                >
                  Discard Edits
                </button>
                <button 
                  onClick={() => setShowDiscardConfirm(false)}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-white/90 hover:text-white transition-all"
                >
                  Keep Editing
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ═══ TOAST SYSTEM ═══ */}
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] min-w-[300px]"
          >
            <div className={`px-6 py-4 rounded-[2rem] backdrop-blur-xl border flex items-center gap-4 shadow-2xl ${
              toast.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === "success" ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}>
                {toast.type === "success" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                )}
              </div>
              <span className="text-[13px] font-bold tracking-tight">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  description,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full h-[56px] px-4 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all ${
          disabled ? "opacity-50 cursor-not-allowed select-none bg-black/20" : ""
        }`}
      />
      {description && (
        <p className="text-[10px] text-white/50 italic font-medium leading-tight px-1">{description}</p>
      )}
    </div>
  );
}

/* ── Reusable Segmented Control Component ── */
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  description,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
        {label}
      </label>
      <div className="flex w-full p-1.5 h-[56px] rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] relative">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 h-full flex items-center justify-center text-[12px] font-bold uppercase tracking-wider transition-all duration-300 rounded-lg z-10 ${
              value === opt.value
                ? "bg-white text-black shadow-lg"
                : "text-white/40 hover:text-white"
            } text-[10px] md:text-[11px] font-black`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {description && (
        <p className="text-[10px] text-white/30 italic font-medium leading-tight px-1">{description}</p>
      )}
    </div>
  );
}
