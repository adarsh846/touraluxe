"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plane } from "lucide-react";
import type { Package } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { usePricing } from "@/hooks/usePricing";

type PackageFormProps = {
  initialData?: Package;
  isEditing?: boolean;
};

export function PackageForm({ initialData, isEditing }: PackageFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const itineraryUploadRef = useRef<HTMLInputElement>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [itineraryUploading, setItineraryUploading] = useState(false);
  const [itineraryUploadIndex, setItineraryUploadIndex] = useState<number | null>(null);
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

  const [form, setForm] = useState({
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
    difficulty_level: (initialData as any)?.difficulty_level || "Easy",
    min_group_size: (initialData as any)?.min_group_size ?? 1,
    max_group_size: (initialData as any)?.max_group_size ?? 20,
    tags: (initialData as any)?.tags || [],
    destination: (initialData as any)?.destination || "",
    region: (initialData as any)?.region || "",
    trip_type: Array.isArray((initialData as any)?.trip_type)
      ? (initialData as any).trip_type
      : ((initialData as any)?.trip_type || "group").split(",").filter(Boolean),
    itinerary_url: (initialData as any)?.itinerary_url || "",
    flights_status: anchor?.status || (initialData as any)?.flights_status || "excluded",
    flight_price_estimate: (initialData as any)?.flight_price_estimate || "",
    departure_cities: (initialData as any)?.departure_cities || [],
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
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });
  const [imagePreview, setImagePreview] = useState(initialData?.image || "");
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImagePreview(URL.createObjectURL(file));
    setIsDirty(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-token": getToken() },
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setForm((prev) => {
          setIsDirty(true);
          return { ...prev, image: url };
        });
        setImagePreview(url);
      } else {
        alert("Upload failed. Please try again.");
        setImagePreview("");
      }
    } catch {
      alert("Upload failed. Check your connection.");
      setImagePreview("");
    }

    setUploading(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setGalleryUploading(true);
    setIsDirty(true);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "x-admin-token": getToken() },
          body: formData,
        });

        if (res.ok) {
          const { url } = await res.json();
          uploadedUrls.push(url);
        }
      } catch (err) {
        console.error("Gallery upload error:", err);
      }
    }

    if (uploadedUrls.length > 0) {
      setForm((prev) => {
        const newGallery = [...(prev.gallery || []), ...uploadedUrls];
        return { ...prev, gallery: newGallery };
      });
      setToast({ show: true, message: `${uploadedUrls.length} image(s) added to gallery.`, type: "success" });
    } else {
      setToast({ show: true, message: "Upload failed. Please try again.", type: "error" });
    }

    setGalleryUploading(false);
  };

  const removeGalleryImage = (index: number) => {
    setForm((prev) => {
      setIsDirty(true);
      const gallery = (prev.gallery || []).filter((_: any, i: number) => i !== index);
      return { ...prev, gallery };
    });
  };

  const handleItineraryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || itineraryUploadIndex === null) return;
    
    setItineraryUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-token": getToken() },
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        handleItineraryChange(itineraryUploadIndex, "image", url);
        setToast({ show: true, message: `Image uploaded for Day ${form.itinerary[itineraryUploadIndex].day}.`, type: "success" });
      } else {
        setToast({ show: true, message: "Upload failed. Please try again.", type: "error" });
      }
    } catch {
      setToast({ show: true, message: "Upload failed. Check your connection.", type: "error" });
    }
    
    setItineraryUploading(false);
    setItineraryUploadIndex(null);
    if (itineraryUploadRef.current) itineraryUploadRef.current.value = "";
  };

  const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
    setForm((prev) => {
      const gallery = [...(prev.gallery || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= gallery.length) return prev;
      
      setIsDirty(true);
      const temp = gallery[index];
      gallery[index] = gallery[targetIndex];
      gallery[targetIndex] = temp;
      
      return { ...prev, gallery };
    });
  };

  const addGalleryUrl = (url: string) => {
    if (!url.trim()) return;
    setForm((prev) => {
      setIsDirty(true);
      return { ...prev, gallery: [...(prev.gallery || []), url.trim()] };
    });
  };
  
  const [pdfUploading, setPdfUploading] = useState(false);
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfUploading(true);
    setIsDirty(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-token": getToken() },
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setForm((prev) => ({ ...prev, pdf_url: url }));
        setToast({ show: true, message: "Digital Itinerary synchronized.", type: "success" });
      } else {
        setToast({ show: true, message: "PDF Upload failed.", type: "error" });
      }
    } catch {
      setToast({ show: true, message: "Network error during PDF upload.", type: "error" });
    }

    setPdfUploading(false);
  };

  const handleHighlightChange = (index: number, value: string) => {
    setForm((prev) => {
      const highlights = [...prev.highlights];
      highlights[index] = value;
      return { ...prev, highlights };
    });
  };

  const addHighlight = () => {
    setForm((prev) => ({ ...prev, highlights: [...prev.highlights, ""] }));
  };

  const removeHighlight = (index: number) => {
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const handleInclusionChange = (index: number, value: string) => {
    setForm((prev) => {
      const inclusions = [...prev.inclusions];
      inclusions[index] = value;
      return { ...prev, inclusions };
    });
  };

  const addInclusion = () => {
    setForm((prev) => ({ ...prev, inclusions: [...prev.inclusions, ""] }));
  };

  const removeInclusion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index),
    }));
  };

  const handleItineraryChange = (index: number, field: string, value: string) => {
    setForm((prev) => {
      const itinerary = [...prev.itinerary];
      itinerary[index] = { ...itinerary[index], [field]: value };
      return { ...prev, itinerary };
    });
  };

  const addItineraryDay = () => {
    const nextDay = (form.itinerary.length + 1).toString();
    setForm((prev) => ({ 
      ...prev, 
      itinerary: [...prev.itinerary, { day: nextDay, title: "", description: "", image: "" }] 
    }));
  };

  const removeItineraryDay = (index: number) => {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index),
    }));
  };

  // ── Exclusions Handlers ──
  const handleExclusionChange = (index: number, value: string) => {
    setForm((prev) => {
      const exclusions = [...prev.exclusions];
      exclusions[index] = value;
      return { ...prev, exclusions };
    });
  };
  const addExclusion = () => setForm((prev) => ({ ...prev, exclusions: [...prev.exclusions, ""] }));
  const removeExclusion = (index: number) => setForm((prev) => ({ ...prev, exclusions: prev.exclusions.filter((_, i) => i !== index) }));

  // ── FAQ Handlers ──
  const handleFaqChange = (index: number, field: string, value: string) => {
    setForm((prev) => {
      const faq = [...prev.faq];
      faq[index] = { ...faq[index], [field]: value };
      return { ...prev, faq };
    });
  };
  const addFaq = () => setForm((prev) => ({ ...prev, faq: [...prev.faq, { question: "", answer: "" }] }));
  const removeFaq = (index: number) => setForm((prev) => ({ ...prev, faq: prev.faq.filter((_: any, i: number) => i !== index) }));

  // ── Tags Handler ──
  const [tagInput, setTagInput] = useState("");
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };
  const removeTag = (tag: string) => setForm((prev) => ({ ...prev, tags: prev.tags.filter((t: string) => t !== tag) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      tax_percentage: form.tax_percentage
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

      <main className="max-w-[1400px] mx-auto px-4 md:px-12 pt-24 md:pt-36 pb-40 md:pb-24">
        <form onSubmit={handleSubmit} id="package-form" className="space-y-16 md:space-y-24">
          
          {/* ── HERO: CINEMATIC COVER ── */}
          <section className="space-y-6 md:space-y-8">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5 flex items-center justify-between">
              <span>Cinematic Cover</span>
              {imagePreview && <span className="text-[10px] font-bold tracking-[0.2em] text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Asset Loaded</span>}
            </h3>
            <div onClick={() => fileInputRef.current?.click()} className="relative w-full aspect-[16/9] rounded-2xl md:rounded-[32px] overflow-hidden bg-[#1c1c1e] border-2 border-dashed border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group shadow-2xl">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <span className="text-sm text-white font-bold uppercase tracking-wider">Replace Asset</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                    <svg className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="text-[13px] md:text-sm text-white/90 font-medium">{uploading ? "Processing asset..." : "Upload experience cover (16:9 recommended)"}</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </section>

          {/* ── HERO: CINEMATIC GALLERY ── */}
          <section className="space-y-6 md:space-y-8">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5 flex items-center justify-between">
              <span>Cinematic Gallery</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {(form.gallery || []).length} Photo(s)
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {/* Existing Gallery Thumbnails */}
              {(form.gallery || []).map((url: string, index: number) => (
                <div key={index} className="group relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#1c1c1e] border border-white/[0.06] hover:border-white/20 transition-all duration-500 shadow-xl">
                  <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  
                  {/* Glassmorphic Overlay Controls */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                    {/* Move Up/Left */}
                    {index > 0 && (
                      <button 
                        type="button" 
                        onClick={() => moveGalleryImage(index, 'up')}
                        className="p-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-all active:scale-90"
                        title="Move Left"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    {/* Move Down/Right */}
                    {index < (form.gallery || []).length - 1 && (
                      <button 
                        type="button" 
                        onClick={() => moveGalleryImage(index, 'down')}
                        className="p-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-all active:scale-90"
                        title="Move Right"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    {/* Delete */}
                    <button 
                      type="button" 
                      onClick={() => removeGalleryImage(index)}
                      className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/35 transition-all active:scale-90"
                      title="Remove Photo"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Badge showing order index */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-[9px] font-black text-white/50 tracking-wider">
                    {index < 9 ? `0${index + 1}` : index + 1}
                  </div>
                </div>
              ))}

              {/* Upload Trigger Card */}
              <div 
                onClick={() => galleryInputRef.current?.click()}
                className="relative aspect-[16/10] rounded-2xl border-2 border-dashed border-white/[0.06] hover:border-white/[0.12] bg-[#1c1c1e]/40 hover:bg-[#1c1c1e] transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-2 group shadow-xl"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-115 group-hover:bg-white/10 transition-all duration-500">
                  <svg className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-[10px] md:text-[11px] text-white/50 font-bold uppercase tracking-widest">
                  {galleryUploading ? "Uploading..." : "Add Photo"}
                </span>
              </div>
            </div>

            {/* URL Paster Utility */}
            <div className="max-w-xl flex items-center gap-3 bg-[#1c1c1e]/50 border border-white/[0.06] rounded-2xl p-2.5">
              <input 
                type="text" 
                placeholder="Or paste direct image URL here..." 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    addGalleryUrl(input.value);
                    input.value = "";
                  }
                }}
                className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/20 outline-none px-3 border-none"
              />
              <button 
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addGalleryUrl(input.value);
                  input.value = "";
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Add URL
              </button>
            </div>
            
            <input ref={galleryInputRef} type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
          </section>

          {/* ── SECTION 1: BASIC INFORMATION ── */}
          <section className="space-y-8 pt-4">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Field label="Package Title" value={form.title} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, title: v }})} placeholder="e.g. Alpine Chalet Retreat" required />
              <Field label="Location" value={form.location} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, location: v }})} placeholder="e.g. Swiss Alps" required />
            </div>

            <div className="space-y-4 pt-4">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">
                Service Category (Multi-Select)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {["Luxury Tours", "Group Trips", "Adventure Tours", "Luxury Honeymoons", "MICE Events", "Custom Journeys"].map((cat) => {
                  const isActive = form.category.includes(cat);
                  return (
                    <button key={cat} type="button" onClick={() => setForm(prev => { setIsDirty(true); return { ...prev, category: isActive ? prev.category.filter(c => c !== cat) : [...prev.category, cat] }})} className={`px-4 py-4 min-h-[64px] rounded-xl text-[11px] md:text-[12px] font-bold uppercase tracking-wider transition-all border text-left flex items-center justify-between group ${isActive ? "bg-white/10 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "bg-white/5 border-white/5 text-white/90 hover:border-white/10 hover:text-white/50"}`}>
                      <span className="pr-2">{cat}</span>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${isActive ? "bg-white scale-100" : "bg-white/10 scale-50"}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── SECTION 2: DESCRIPTION ── */}
          <section className="space-y-10">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Description
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Field label="Visual Tagline" value={form.tagline} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, tagline: v }})} placeholder="e.g. Witness the infinite from the wild" />
              <Field label="Destinations Covered (Comma Separated)" value={form.destinations_covered} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, destinations_covered: v }})} placeholder="e.g. Zurich, Zermatt, St. Moritz" description="Enter cities/places covered on the tour, separated by commas." />
            </div>

            <div className="space-y-4">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">Experience Narrative</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => { setIsDirty(true); return { ...p, description: e.target.value }})} placeholder="Craft the story of this journey..." rows={6} required className="w-full px-6 py-6 rounded-2xl md:rounded-3xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed" />
            </div>

            <div className="space-y-5">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">Journey Highlights</label>
              <div className="space-y-3">
                {form.highlights.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <input value={h} onChange={(e) => handleHighlightChange(i, e.target.value)} placeholder={`Highlight ${i + 1}`} className="flex-1 h-[56px] px-6 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all" />
                    {form.highlights.length > 1 && (
                      <button type="button" onClick={() => removeHighlight(i)} className="w-14 h-[56px] shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all active:scale-90">×</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addHighlight} className="text-[12px] md:text-[13px] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
                + Add Highlight
              </button>
            </div>

            <div className="space-y-5 pt-8 border-t border-white/[0.02]">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">What&apos;s Included (Inclusions)</label>
              <div className="space-y-3">
                {form.inclusions.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <input value={h} onChange={(e) => handleInclusionChange(i, e.target.value)} placeholder={`Inclusion ${i + 1}`} className="flex-1 h-[56px] px-6 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all" />
                    {form.inclusions.length > 1 && (
                      <button type="button" onClick={() => removeInclusion(i)} className="w-14 h-[56px] shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all active:scale-90">×</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addInclusion} className="text-[12px] md:text-[13px] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
                + Add Inclusion
              </button>
            </div>

            <div className="space-y-5 pt-8 border-t border-white/[0.02]">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">What&apos;s NOT Included (Exclusions)</label>
              <div className="space-y-3">
                {form.exclusions.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <input value={h} onChange={(e) => handleExclusionChange(i, e.target.value)} placeholder={`Exclusion ${i + 1}`} className="flex-1 h-[56px] px-6 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-red-500/[0.08] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-red-500/20 transition-all" />
                    {form.exclusions.length > 1 && (
                      <button type="button" onClick={() => removeExclusion(i)} className="w-14 h-[56px] shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all active:scale-90">×</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addExclusion} className="text-[12px] md:text-[13px] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
                + Add Exclusion
              </button>
            </div>

            <div className="space-y-5 pt-8 border-t border-white/[0.02]">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">Journey Itinerary (Day-by-Day)</label>
              <div className="space-y-6">
                {form.itinerary.map((item, i) => (
                  <div key={i} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] space-y-4 relative group/itinerary">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-white/90">
                        D{item.day}
                      </div>
                      <input 
                        value={item.title} 
                        onChange={(e) => handleItineraryChange(i, "title", e.target.value)} 
                        placeholder="Day Title (e.g. Arrival in Paradise)" 
                        className="flex-1 h-[56px] px-6 rounded-2xl bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all" 
                      />
                      {form.itinerary.length > 1 && (
                        <button type="button" onClick={() => removeItineraryDay(i)} className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all active:scale-90">×</button>
                      )}
                    </div>
                    <textarea 
                      value={item.description} 
                      onChange={(e) => handleItineraryChange(i, "description", e.target.value)} 
                      placeholder="Narrative for this day... (Use new lines for bullet points)" 
                      rows={3} 
                      className="w-full px-6 py-4 rounded-2xl bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all resize-none" 
                    />
                    <div className="flex items-center gap-2">
                      <input 
                        value={item.image || ""} 
                        onChange={(e) => handleItineraryChange(i, "image", e.target.value)} 
                        placeholder="Day Image URL (Optional)" 
                        className="flex-1 h-[48px] px-6 rounded-2xl bg-black border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-white/20 transition-all" 
                      />
                      {item.image && (
                        <button 
                          type="button"
                          onClick={() => handleItineraryChange(i, "image", "")}
                          className="h-[48px] w-[48px] flex items-center justify-center rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all shrink-0"
                          title="Remove Image"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => {
                          setItineraryUploadIndex(i);
                          itineraryUploadRef.current?.click();
                        }}
                        disabled={itineraryUploading && itineraryUploadIndex === i}
                        className="h-[48px] px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shrink-0"
                      >
                        {itineraryUploading && itineraryUploadIndex === i ? "Uploading..." : (item.image ? "Replace" : "Upload")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <input ref={itineraryUploadRef} type="file" accept="image/*" onChange={handleItineraryImageUpload} className="hidden" />
              <button type="button" onClick={addItineraryDay} className="text-[12px] md:text-[13px] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
                + Add Day to Journey
              </button>
            </div>
          </section>

          {/* ── SECTION 3: LOGISTICS & FINANCIALS ── */}
          <section className="space-y-6 pt-12 border-t border-white/[0.03]">
            <h3 className="text-[10px] font-black tracking-[0.3em] text-white/90 uppercase">
              Pricing & Itinerary
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              <Field label="Ideal For" value={form.guests} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, guests: v }})} placeholder="e.g. Couples, Families, Solo" />
              <Field label="Travel Season" value={form.season} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, season: v }})} placeholder="e.g. Oct — Mar" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              <Field label="Duration (Nights)" value={form.nights} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, nights: v }})} placeholder="e.g. 3" required />
              <Field label="Duration (Days)" value={form.days} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, days: v }})} placeholder="e.g. 4" required />
            </div>
          </section>

          {/* ── SECTION: FINANCIAL ARCHITECTURE ── */}
          <section className="space-y-6 pt-12 border-t border-white/[0.03]">
            <h3 className="text-[10px] font-black tracking-[0.3em] text-white/90 uppercase">
              Financial Architecture
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 items-start">
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SegmentedControl 
                    label="Currency" 
                    value={form.currency} 
                    onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, currency: v }})} 
                    options={[{ label: "₹ INR", value: "₹" }, { label: "$ USD", value: "$" }, { label: "€ EUR", value: "€" }]} 
                    description="Global currency for this specific journey."
                  />
                  <Field 
                    label="Strikethrough Price (Old)" 
                    value={form.original_price} 
                    onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, original_price: v }})} 
                    placeholder="e.g. 95,000" 
                    description="Higher old price for 'Discount' tag."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SegmentedControl 
                    label="Airfare Status" 
                    value={form.flights_status} 
                    onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, flights_status: v as any }})} 
                    options={[
                      { label: "Excluded", value: "excluded" },
                      { label: "Included", value: "included" },
                      { label: "On Request", value: "on_request" }
                    ]} 
                  />
                  <Field 
                    label="Ground & Services Cost (Base)" 
                    value={form.price} 
                    onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, price: v }})} 
                    placeholder="e.g. 80,000" 
                    description="Base cost per adult (Excl. Flights & GST). These are added automatically."
                    required
                  />
                </div>

                {form.flights_status !== "excluded" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Plane size={14} className="text-blue-400" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Flight Segment Breakdown</h4>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setForm(p => ({ ...p, flight_segments: [...p.flight_segments, { label: "", price: "" }] }))}
                        className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-white transition-colors"
                      >
                        + Add Flight Leg
                      </button>
                    </div>

                    <div className="space-y-8">
                      {form.flight_segments.map((segment: any, i: number) => (
                        <div key={i} className="flex flex-col md:grid md:grid-cols-[1fr_160px_40px] gap-5 md:gap-8 items-stretch md:items-end group/seg border-b border-white/[0.03] pb-8 last:border-none">
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/70 group-focus-within/seg:text-blue-400 transition-colors">Origin</label>
                              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/70 group-focus-within/seg:text-blue-400 transition-colors">Destination</label>
                            </div>
                            <div className="flex items-center gap-3 md:gap-6 bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 md:px-6 py-3 md:py-4">
                              <input 
                                className="flex-1 min-w-0 bg-transparent text-[15px] font-bold text-white transition-all outline-none placeholder:text-white/10"
                                placeholder="Origin"
                                value={segment.label.split(" ➔ ")[0] || ""}
                                onChange={(e) => {
                                  const newSegments = [...form.flight_segments];
                                  const parts = segment.label.split(" ➔ ");
                                  newSegments[i].label = `${e.target.value} ➔ ${parts[1] || ""}`;
                                  setForm(p => ({ ...p, flight_segments: newSegments }));
                                }}
                              />
                              <div className="flex items-center justify-center shrink-0">
                                <span className="text-blue-400 font-black text-xl select-none leading-none">➔</span>
                              </div>
                              <input 
                                className="flex-1 min-w-0 bg-transparent text-[15px] font-bold text-white transition-all outline-none text-right placeholder:text-white/10"
                                placeholder="Destination"
                                value={segment.label.split(" ➔ ")[1] || ""}
                                onChange={(e) => {
                                  const newSegments = [...form.flight_segments];
                                  const parts = segment.label.split(" ➔ ");
                                  newSegments[i].label = `${parts[0] || ""} ➔ ${e.target.value}`;
                                  setForm(p => ({ ...p, flight_segments: newSegments }));
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/70 text-right block group-focus-within/seg:text-blue-400 transition-colors">Cost (₹)</label>
                            <input 
                              className="w-full bg-transparent text-[15px] text-white transition-all outline-none text-right font-mono"
                              placeholder="0"
                              value={segment.price}
                              onChange={(e) => {
                                const newSegments = [...form.flight_segments];
                                newSegments[i].price = e.target.value;
                                setForm(p => ({ ...p, flight_segments: newSegments }));
                              }}
                            />
                          </div>
                          <div className="flex justify-end pb-1">
                            <button 
                              type="button" 
                              onClick={() => {
                                const newSegments = form.flight_segments.filter((_: any, idx: number) => idx !== i);
                                const total = newSegments.reduce((acc: number, s: any) => acc + (Number(s.price) || 0), 0);
                                setForm(p => ({ ...p, flight_segments: newSegments, flight_price_estimate: total.toString() }));
                              }}
                              className="text-white/10 hover:text-red-400 transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">Total Adult Airfare</span>
                        <span className="text-[9px] text-white/70 italic">Calculated sum for one adult traveler</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-blue-400 tracking-tighter">
                          ₹{(form.flight_segments.reduce((acc: number, s: any) => acc + (parseInt(String(s.price).replace(/[^0-9]/g, "")) || 0), 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-6 pt-8 border-t border-white/[0.05]">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">Age-Specific Airfare</span>
                          <span className="text-[9px] text-white/70 italic">Customize pricing for younger travelers</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (form.flight_price_child || form.flight_price_infant) {
                              setForm(p => ({ ...p, flight_price_child: "", flight_price_infant: "" }));
                            } else {
                              setForm(p => ({ ...p, flight_price_child: " ", flight_price_infant: " " }));
                            }
                          }}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border",
                            (form.flight_price_child || form.flight_price_infant) 
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                              : "bg-white/5 border-white/10 text-white/70 hover:text-white/90"
                          )}
                        >
                          {(form.flight_price_child || form.flight_price_infant) ? "Reset to Adult Rates" : "+ Add Age-Specific Pricing"}
                        </button>
                      </div>

                      {(form.flight_price_child || form.flight_price_infant) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
                          <Field 
                            label="Custom Child Airfare" 
                            value={form.flight_price_child.trim()} 
                            onChange={(v) => setForm(p => ({ ...p, flight_price_child: v || " " }))} 
                            placeholder="e.g. 60,000" 
                            description="Estimated flight cost per child traveler."
                          />
                          <Field 
                            label="Custom Infant Airfare" 
                            value={form.flight_price_infant.trim()} 
                            onChange={(v) => setForm(p => ({ ...p, flight_price_infant: v || " " }))} 
                            placeholder="e.g. 5,000" 
                            description="Estimated flight cost per infant traveler."
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-10 border-t border-white/[0.05]">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">Journey Type Summary</label>
                        <div className="flex gap-3">
                          {["Round-Trip", "One-Way", "Multi-City"].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setForm(p => ({ ...p, flight_type: preset }))}
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest transition-all",
                                form.flight_type === preset ? "text-blue-400" : "text-white/70 hover:text-white/90"
                              )}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input 
                        className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-[13px] text-white focus:border-white/20 transition-all outline-none"
                        placeholder="e.g. Round-Trip, Incl. 2 Hops"
                        value={form.flight_type}
                        onChange={(e) => setForm((p) => ({ ...p, flight_type: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6 md:space-y-8 h-full">
                <Field 
                  label="Customer Price (Actual)" 
                  value={form.price} 
                  onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, price: v }})} 
                  placeholder="e.g. 79,000" 
                  description="The final price travelers will see and pay."
                  required 
                />

                <div className="space-y-4 pt-2">
                  <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">Departure Hubs</label>
                  <div className="flex flex-wrap gap-2">
                    {form.departure_cities.map((city: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-white flex items-center gap-2">
                        {city}
                        <button type="button" onClick={() => setForm(p => ({ ...p, departure_cities: p.departure_cities.filter((_: any, idx: number) => idx !== i) }))} className="text-white/90 hover:text-white transition-colors">×</button>
                      </span>
                    ))}
                    <input 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !form.departure_cities.includes(val)) {
                            setForm(p => ({ ...p, departure_cities: [...p.departure_cities, val] }));
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                      placeholder="Add hub (Enter)..." 
                      className="bg-transparent border-none text-[10px] font-bold text-white/90 focus:outline-none focus:text-white w-24"
                    />
                  </div>
                </div>
              </div>
              
              {/* Fiscal Intelligence Preview */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.03] flex flex-col justify-between h-full min-h-[140px] relative overflow-hidden group">
                <div className={cn(
                  "absolute inset-0 transition-opacity duration-1000 opacity-[0.03]",
                  form.tax_status === "Exclusive of Taxes" ? "bg-emerald-500" : "bg-blue-500"
                )} />
                <div className="relative z-10 flex flex-col gap-4 h-full justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Customer Pays (All-In)</p>
                    <p className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                      {(() => {
                        const pricing = computePrice(form, 1, 0, 0);
                        return pricing.formattedFinal;
                      })()}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/[0.08]">
                    <p className="text-[9px] font-black text-white/90 uppercase tracking-widest mb-2">Fiscal Breakdown</p>
                    {(() => {
                      const pricing = computePrice(form, 1, 0, 0);
                      const { landBase, taxAmount, flightNet } = (pricing as any).breakdown || {};
                      return (
                        <div className="space-y-1 text-[10px] font-bold text-white/70 italic leading-tight">
                          <div className="flex justify-between items-center">
                            <span>Tour & Services:</span>
                            <span>{form.currency}{landBase?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400/80">
                            <span>GST ({pricing.taxRate}%):</span>
                            <span>+ {form.currency}{taxAmount?.toLocaleString()}</span>
                          </div>
                          {flightNet > 0 && (
                            <div className="flex justify-between items-center text-blue-400/80">
                              <span>Final Airfare:</span>
                              <span>+ {form.currency}{flightNet?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-8 border-t border-white/[0.02]">
              <Field label="Child Price" value={form.child_price} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, child_price: v }})} placeholder="Optional" />
              <Field label="Infant Price" value={form.infant_price} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, infant_price: v }})} placeholder="Optional" />
            </div>

            {/* Pricing Terms & Notes */}
            <div className="pt-8 border-t border-white/[0.02] space-y-4">
              <div>
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/90">
                  Pricing Terms & Notes
                </label>
                <p className="text-[11px] text-white/50 leading-relaxed italic pt-1">
                  Add optional terms & conditions or helper notes for this package's pricing breakdown (e.g. tax statements, inclusions details). This displays in the Speech Bubble details popover.
                </p>
              </div>
              <textarea
                className="w-full h-24 bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-[13px] text-white focus:border-white/20 transition-all outline-none resize-none"
                placeholder="e.g. Flight estimates are subject to airline fare fluctuations. Land rate is inclusive of 5% GST."
                value={form.pricing_note || ""}
                onChange={(e) => {
                  setIsDirty(true);
                  setForm((p) => ({ ...p, pricing_note: e.target.value }));
                }}
              />
            </div>

            {/* Unified Tax Policy Selector */}
            <div className="pt-8 border-t border-white/[0.02] grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 md:p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] flex flex-col md:flex-row items-center gap-6 group relative overflow-hidden">
                <div className={cn(
                  "absolute inset-0 opacity-[0.03] transition-colors duration-1000",
                  form.tax_status === "Exclusive of Taxes" ? "bg-emerald-500" : "bg-blue-500"
                )} />
                
                <div className="relative z-10 flex-1 space-y-2">
                  <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/90">Tax Strategy</label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm md:text-base font-bold text-white/90 tracking-tight italic">
                      {form.tax_status === "Exclusive of Taxes" ? "Strategy: Add Tax (+ TAX)" : "Strategy: Built-In (INCL. TAX)"}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border transition-colors duration-700",
                      form.tax_status === "Exclusive of Taxes" 
                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/60" 
                        : "bg-blue-500/5 border-blue-500/10 text-blue-500/60"
                    )}>
                      {form.tax_status === "Exclusive of Taxes" ? `+ ${form.tax_percentage || "0"}% GST` : "FINAL PRICE"}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 leading-relaxed max-w-sm font-medium italic">
                    {form.tax_status === "Inclusive of Taxes" 
                      ? "Tax is already included in this price." 
                      : "We'll add GST on top of this price."}
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em] mb-1">Fiscal Mode</p>
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      form.tax_status === "Exclusive of Taxes" ? "text-emerald-400" : "text-blue-400"
                    )}>
                      {form.tax_status === "Exclusive of Taxes" ? "+ TAX Mode" : "INCL. TAX Mode"}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setForm((p) => { setIsDirty(true); return { ...p, tax_status: p.tax_status === "Inclusive of Taxes" ? "Exclusive of Taxes" : "Inclusive of Taxes" }})} 
                    className={`relative w-16 h-9 rounded-full transition-all duration-1000 shrink-0 ${form.tax_status === "Exclusive of Taxes" ? "bg-emerald-500/20 border border-emerald-500/20" : "bg-blue-500/20 border border-blue-500/20"}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white/80 shadow-2xl transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${form.tax_status === "Exclusive of Taxes" ? "left-[33px]" : "left-1"}`} />
                  </button>
                </div>
              </div>

              {/* Tax Percentage Config */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] flex flex-col justify-center space-y-3">
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white/80">Package Tax Rate (GST %)</label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/30 uppercase tracking-widest">GST</span>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.tax_percentage} 
                    onChange={(e) => {
                      setIsDirty(true);
                      setForm((p) => ({ ...p, tax_percentage: e.target.value }));
                    }}
                    className="bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-xs font-bold text-white w-full focus:outline-none focus:border-white/30 transition-all text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="e.g. 5"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/40 uppercase tracking-widest">%</span>
                </div>
                <p className="text-[10px] text-white/40 font-medium italic">
                  Configures the GST rate applied for pricing and breakdown calculations.
                </p>
              </div>
            </div>
          </section>

          {/* ── SECTION: DYNAMIC COMFORT TIERS & VEHICLES CONFIGURATOR ── */}
          <section className="space-y-8 pt-12 border-t border-white/[0.03]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-[10px] font-black tracking-[0.3em] text-white/90 uppercase">
                  Dynamic Comfort Tiers & Logistics Configurator
                </h3>
                <p className="text-[11px] text-white/50 leading-relaxed italic pt-1">
                  Configure pricing matrix, accommodation tiers, envisaged hotels, and transport vehicle allocation.
                </p>
              </div>
              
              <button 
                type="button" 
                onClick={() => {
                  setIsDirty(true);
                  if (form.tiers.length === 0) {
                    setForm(p => ({
                      ...p,
                      tiers: [
                        {
                          name: "Deluxe",
                          price_grid: [],
                          hotels: []
                        }
                      ],
                      transports: []
                    }));
                  } else {
                    setForm(p => ({ ...p, tiers: [], transports: [] }));
                  }
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border",
                  form.tiers.length > 0
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white/90"
                )}
              >
                {form.tiers.length > 0 ? "Reset to Simple/Flat Price" : "+ Initialize Dynamic Comfort Tiers"}
              </button>
            </div>

            {form.tiers.length > 0 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                {/* 1. Comfort Tiers Matrix */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Accommodation & Price Tiers</span>
                    <button 
                      type="button" 
                      onClick={() => setForm(p => ({
                        ...p,
                        tiers: [...p.tiers, { name: `Tier ${p.tiers.length + 1}`, price_grid: [], hotels: [] }]
                      }))}
                      className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-white transition-colors"
                    >
                      + Add New Comfort Tier
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {form.tiers.map((tier: any, tIdx: number) => (
                      <div key={tIdx} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-6 relative group/tier">
                        {/* Card Header Bar */}
                        <div className="flex justify-between items-center pb-4 border-b border-white/[0.03]">
                          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">Comfort Tier #{tIdx + 1}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              setIsDirty(true);
                              setForm(p => ({ ...p, tiers: p.tiers.filter((_: any, idx: number) => idx !== tIdx) }));
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/[0.05] hover:bg-red-500/10 border border-red-500/10 text-red-400/80 hover:text-red-400 transition-all active:scale-95 text-lg"
                            title="Remove Comfort Tier"
                          >
                            ×
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                          {/* Left: Tier Identity */}
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Tier Name</label>
                              <input 
                                className="w-full h-11 px-4 bg-white/[0.03] border border-white/10 rounded-xl text-[13px] text-white font-bold transition-all outline-none"
                                value={tier.name}
                                onChange={(e) => {
                                  setIsDirty(true);
                                  const nextTiers = [...form.tiers];
                                  nextTiers[tIdx].name = e.target.value;
                                  setForm(p => ({ ...p, tiers: nextTiers }));
                                }}
                                placeholder="e.g. 5 Star Deluxe"
                              />
                            </div>
                            
                            {/* PDF Flyer (Legacy upload wrapper integration) */}
                            <div>
                              <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Digital Itinerary Flyer (PDF)</label>
                              <div className="flex flex-col gap-2">
                                <input 
                                  className="w-full h-9 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[11px] text-white/70 transition-all outline-none"
                                  value={form.pdf_url}
                                  onChange={(e) => {
                                    setIsDirty(true);
                                    setForm(p => ({ ...p, pdf_url: e.target.value }));
                                  }}
                                  placeholder="PDF URL or upload asset below..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right: Grid rates & Envisaged Hotels */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-0 md:pl-6 md:border-l border-white/[0.04]">
                            {/* Group Size Price Grid */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">Group Size Price Grid (₹)</label>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setIsDirty(true);
                                    const nextTiers = [...form.tiers];
                                    nextTiers[tIdx].price_grid = [...(nextTiers[tIdx].price_grid || []), { pax: "", price: "" }];
                                    setForm(p => ({ ...p, tiers: nextTiers }));
                                  }}
                                  className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-white transition-colors"
                                >
                                  + Add Size Row
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(tier.price_grid || []).map((row: any, rIdx: number) => (
                                  <div key={rIdx} className="flex items-center gap-3">
                                    <input 
                                      className="w-20 h-9 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[12px] text-white outline-none focus:border-white/10 transition-all font-mono text-center"
                                      placeholder="e.g. 2"
                                      value={row.pax}
                                      onChange={(e) => {
                                        setIsDirty(true);
                                        const nextTiers = [...form.tiers];
                                        nextTiers[tIdx].price_grid[rIdx].pax = e.target.value;
                                        setForm(p => ({ ...p, tiers: nextTiers }));
                                      }}
                                    />
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pax</span>
                                    <input 
                                      className="flex-1 h-9 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[12px] text-white/90 text-right font-mono outline-none focus:border-white/10 transition-all"
                                      placeholder="Price"
                                      value={row.price}
                                      onChange={(e) => {
                                        setIsDirty(true);
                                        const nextTiers = [...form.tiers];
                                        nextTiers[tIdx].price_grid[rIdx].price = e.target.value;
                                        setForm(p => ({ ...p, tiers: nextTiers }));
                                      }}
                                    />
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setIsDirty(true);
                                        const nextTiers = [...form.tiers];
                                        nextTiers[tIdx].price_grid = nextTiers[tIdx].price_grid.filter((_: any, idx: number) => idx !== rIdx);
                                        setForm(p => ({ ...p, tiers: nextTiers }));
                                      }}
                                      className="text-white/20 hover:text-red-400 transition-colors text-sm font-bold w-5 h-5 flex items-center justify-center"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Envisaged Hotels */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">Envisaged Accommodations</label>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setIsDirty(true);
                                    const nextTiers = [...form.tiers];
                                    nextTiers[tIdx].hotels = [...(nextTiers[tIdx].hotels || []), { city: "", hotel: "" }];
                                    setForm(p => ({ ...p, tiers: nextTiers }));
                                  }}
                                  className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-white transition-colors"
                                >
                                  + Add Hotel Row
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(tier.hotels || []).map((row: any, rIdx: number) => (
                                  <div key={rIdx} className="flex items-center gap-3">
                                    <input 
                                      className="w-24 h-9 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[12px] text-white outline-none focus:border-white/10 transition-all font-bold"
                                      placeholder="City"
                                      value={row.city}
                                      onChange={(e) => {
                                        setIsDirty(true);
                                        const nextTiers = [...form.tiers];
                                        nextTiers[tIdx].hotels[rIdx].city = e.target.value;
                                        setForm(p => ({ ...p, tiers: nextTiers }));
                                      }}
                                    />
                                    <input 
                                      className="flex-1 h-9 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[12px] text-white/90 outline-none focus:border-white/10 transition-all"
                                      placeholder="Hotel Name"
                                      value={row.hotel}
                                      onChange={(e) => {
                                        setIsDirty(true);
                                        const nextTiers = [...form.tiers];
                                        nextTiers[tIdx].hotels[rIdx].hotel = e.target.value;
                                        setForm(p => ({ ...p, tiers: nextTiers }));
                                      }}
                                    />
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setIsDirty(true);
                                        const nextTiers = [...form.tiers];
                                        nextTiers[tIdx].hotels = nextTiers[tIdx].hotels.filter((_: any, idx: number) => idx !== rIdx);
                                        setForm(p => ({ ...p, tiers: nextTiers }));
                                      }}
                                      className="text-white/20 hover:text-red-400 transition-colors text-sm font-bold w-5 h-5 flex items-center justify-center"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Private Transport Rules Allocation */}
                <div className="space-y-6 pt-6 border-t border-white/[0.02]">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] block">Private Fleet Allocation Map</span>
                      <span className="text-[9px] text-white/40 italic">Maps guest headcounts to vehicle classes (e.g. SUV, HiRoof, Coaster Bus)</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setForm(p => ({
                        ...p,
                        transports: [...p.transports, { pax: "", vehicle: "" }]
                      }))}
                      className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-white transition-colors"
                    >
                      + Add Transport Class
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.transports.map((rule: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] flex items-center gap-4">
                        <div className="flex-1 grid grid-cols-[100px_1fr] gap-4">
                          <div>
                            <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1.5">Pax count/range</label>
                            <input 
                              className="w-full h-9 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[12px] text-white outline-none focus:border-white/10 text-center font-mono"
                              placeholder="e.g. 3-6"
                              value={rule.pax}
                              onChange={(e) => {
                                setIsDirty(true);
                                const nextTransports = [...form.transports];
                                nextTransports[idx].pax = e.target.value;
                                setForm(p => ({ ...p, transports: nextTransports }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1.5">Vehicle Type</label>
                            <input 
                              className="w-full h-9 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[12px] text-white outline-none focus:border-white/10"
                              placeholder="e.g. Toyota HiRoof"
                              value={rule.vehicle}
                              onChange={(e) => {
                                setIsDirty(true);
                                const nextTransports = [...form.transports];
                                nextTransports[idx].vehicle = e.target.value;
                                setForm(p => ({ ...p, transports: nextTransports }));
                              }}
                            />
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsDirty(true);
                            setForm(p => ({ ...p, transports: p.transports.filter((_: any, rIdx: number) => rIdx !== idx) }));
                          }}
                          className="text-white/20 hover:text-red-400 transition-colors text-lg font-bold mt-4"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── SECTION: PROMOTIONS & BADGES ── */}
          <section className="space-y-6 pt-12 border-t border-white/[0.03]">
            <h3 className="text-[10px] font-black tracking-[0.3em] text-white/70 uppercase">
              Badges & Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">Package Badge</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["", "Trending", "Bestseller", "New", "Recommended", "Super Saver"].map((b) => {
                    const pricing = computePrice(form, 1, 0, 0);
                    const hasSavings = pricing.hasSavings;
                    const isActive = form.badge === b;
                    const label = b || "None";
                    return (
                      <button key={label} type="button" onClick={() => setForm(prev => { setIsDirty(true); return { ...prev, badge: b }})} className={`px-3 py-3 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all border ${isActive ? "bg-white/10 border-white text-white" : "bg-white/5 border-white/5 text-white/90 hover:border-white/10"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] space-y-2">
                  <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em]">Marketing Insight</p>
                  <p className="text-[11px] text-white/70 leading-relaxed font-medium italic">
                    Travelers love seeing a discount! Add a higher "Old Price" to show them exactly how much they're saving.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden group">
              <div className={cn(
                "absolute inset-0 opacity-[0.03] transition-colors duration-1000",
                form.is_featured ? "bg-amber-500" : "bg-white/5"
              )} />
              <div className="relative z-10 flex-1 space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Homepage Spotlight?</label>
                <span className="block text-[14px] font-bold text-white/90 italic tracking-tight">
                  {form.is_featured ? "Yes, Highlight on Homepage" : "No, Standard Collection"}
                </span>
                <p className="text-[11px] text-white/70 mt-1 leading-relaxed max-w-md italic">
                  Feature this journey in the main showcase section of your homepage. Best for trending or seasonal trips.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setForm((p) => { setIsDirty(true); return { ...p, is_featured: !p.is_featured }})} 
                className={`relative w-16 h-9 rounded-full transition-all duration-1000 shrink-0 ${form.is_featured ? "bg-amber-500/20 border border-amber-500/20" : "bg-white/5 border border-white/10"}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white/80 shadow-2xl transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${form.is_featured ? "left-[33px]" : "left-1"}`} />
              </button>
            </div>
          </section>

          {/* ── SECTION: ROUTE & LOGISTICS ── */}
          <section className="space-y-8">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Route &amp; Logistics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <Field label="Route Start" value={form.route_start} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, route_start: v }})} placeholder="e.g. Delhi Airport (DEL)" />
              <Field label="Route End" value={form.route_end} onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, route_end: v }})} placeholder="e.g. Leh Airport (IXL)" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-8 border-t border-white/[0.02]">
              <SegmentedControl label="Difficulty Level" value={form.difficulty_level} onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, difficulty_level: v }})} options={[{ label: "Easy", value: "Easy" }, { label: "Moderate", value: "Moderate" }, { label: "Challenging", value: "Challenging" }]} />
              <div className="space-y-3">
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">Min Group Size</label>
                <input type="number" value={form.min_group_size} onChange={(e) => setForm((p) => { setIsDirty(true); return { ...p, min_group_size: parseInt(e.target.value) || 1 }})} className="w-full h-[56px] px-4 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">Max Group Size</label>
                <input type="number" value={form.max_group_size} onChange={(e) => setForm((p) => { setIsDirty(true); return { ...p, max_group_size: parseInt(e.target.value) || 20 }})} className="w-full h-[56px] px-4 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
            </div>
          </section>

          {/* ── SECTION: TAXONOMY & DISCOVERY ── */}
          <section className="space-y-8">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Taxonomy &amp; Discovery
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Destination Picker */}
              <div className="space-y-3">
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">Destination Card</label>
                <select
                  value={form.destination}
                  onChange={(e) => setForm((p) => { setIsDirty(true); return { ...p, destination: e.target.value }; })}
                  className="w-full h-[56px] px-4 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">— None —</option>
                  {availableDestinations.map(d => (
                    <option key={d.slug} value={d.slug}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <Field 
                label="Region / Circuit" 
                value={form.region} 
                onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, region: v }})} 
                placeholder="e.g. North Vietnam, Sapa Highlands" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-8 border-t border-white/[0.02]">
              <div className="space-y-4 col-span-full">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/90">Trip Architecture (Multi-Select)</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center gap-2">
                      <input 
                        id="custom-trip-type"
                        type="text" 
                        placeholder="Add custom type..." 
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white focus:outline-none focus:border-white/20 w-32 md:w-40"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget;
                            const val = input.value.trim();
                            if (val && !dynamicOptions.tripTypes.includes(val)) {
                              setForm(prev => ({ ...prev, trip_type: [...prev.trip_type, val.toLowerCase()] }));
                              input.value = "";
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('custom-trip-type') as HTMLInputElement;
                          const val = input?.value.trim();
                          if (val) {
                            setForm(prev => ({ ...prev, trip_type: [...prev.trip_type, val.toLowerCase()] }));
                            input.value = "";
                          }
                        }}
                        className="px-4 py-1.5 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#f5f5f7] active:scale-95 transition-all shadow-xl"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {/* Combine system types with any custom types already in this package */}
                  {Array.from(new Set([...dynamicOptions.tripTypes, ...form.trip_type.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1))])).map((t: string) => {
                    const val = t.toLowerCase();
                    const isActive = form.trip_type.includes(val);
                    return (
                      <button 
                        key={val} 
                        type="button" 
                        onClick={() => setForm(prev => {
                          setIsDirty(true);
                          const current = Array.isArray(prev.trip_type) ? prev.trip_type : [];
                          return { 
                            ...prev, 
                            trip_type: isActive 
                              ? current.filter(ct => ct !== val) 
                              : [...current, val] 
                          };
                        })} 
                        className={`px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border flex items-center justify-between gap-2 ${
                          isActive ? "bg-white text-black border-white shadow-xl scale-[1.02]" : "bg-white/5 border-white/5 text-white/90 hover:border-white/10"
                        }`}
                      >
                        <span className="truncate">{t}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={cn("col-span-full pt-8 border-t border-white/[0.02] transition-all duration-500", !form.difficulty_level && "opacity-80")}>
                {/* Difficulty */}
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/90">Intensity Level</label>
                    <p className="text-[10px] text-white/30 italic font-medium leading-tight">Rate the physical demand of this journey.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setForm(p => {
                      setIsDirty(true);
                      return { ...p, difficulty_level: p.difficulty_level ? "" : "Easy" };
                    })} 
                    className={`relative w-14 h-7 rounded-full transition-all duration-700 shadow-lg ${
                      form.difficulty_level 
                        ? "bg-emerald-500/20 border border-emerald-500/40" 
                        : "bg-red-500/20 border border-red-500/40"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5.5 h-5.5 rounded-full shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      form.difficulty_level 
                        ? "left-[31px] bg-emerald-400" 
                        : "left-0.5 bg-red-400"
                    }`} />
                  </button>
                </div>
                
                {form.difficulty_level && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                    <SegmentedControl 
                      label="" 
                      value={form.difficulty_level} 
                      onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, difficulty_level: v }})} 
                      options={dynamicOptions.difficulties.map(d => ({ label: d, value: d }))} 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/[0.02]">
              <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/90">Digital Assets (Itinerary Flyer)</label>
              <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] flex flex-col md:flex-row items-center gap-8 group relative overflow-hidden">
                <div className="relative z-10 flex-1 space-y-2">
                  <div className="flex items-center gap-4">
                    {form.pdf_url ? (
                      <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          {form.pdf_url.toLowerCase().endsWith('.pdf') ? (
                            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2v20l10-10L7 2z" /></svg>
                          ) : (
                            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-white/90 truncate max-w-[200px]">
                          {form.pdf_url.split('/').pop()?.split('-').slice(1).join('-') || "Asset Loaded"}
                        </span>
                        <button type="button" onClick={() => setForm(p => ({ ...p, pdf_url: "" }))} className="text-white/70 hover:text-white transition-colors">×</button>
                      </div>
                    ) : (
                      <p className="text-[14px] font-bold text-white/90 italic tracking-tight">No digital flyer attached yet.</p>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed max-w-md italic pt-1">
                    Upload a high-fidelity PDF or Itinerary Image for users to download.
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                  <button 
                    type="button" 
                    onClick={() => pdfInputRef.current?.click()} 
                    disabled={pdfUploading}
                    className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${pdfUploading ? "bg-white/5 text-white/70" : "bg-white/10 text-white hover:bg-white/20 active:scale-95 border border-white/10 shadow-xl"}`}
                  >
                    {pdfUploading ? "Uploading..." : form.pdf_url ? "Replace Asset" : "Upload Asset"}
                  </button>
                  <input ref={pdfInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePdfUpload} className="hidden" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/[0.02]">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">Discovery Themes & Tags</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {form.tags.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-white/70">
                    {tag}
                    <button 
                      onClick={() => setForm(p => ({ ...p, tags: p.tags.filter((t: string) => t !== tag) }))}
                      className="hover:text-red-400 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="new-tag-input"
                  placeholder="Add a theme (e.g. Honeymoon, Adventure)..." 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !form.tags.includes(val)) {
                        setForm(p => ({ ...p, tags: [...p.tags, val] }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  className="flex-1 h-[52px] px-5 rounded-xl bg-black/40 border border-white/10 text-white text-[13px] focus:outline-none focus:border-white/30 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('new-tag-input') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !form.tags.includes(val)) {
                      setForm(p => ({ ...p, tags: [...p.tags, val] }));
                      input.value = '';
                    }
                  }}
                  className="px-6 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-wider"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <p className="w-full text-[9px] text-white/90 font-bold uppercase tracking-widest mb-1">Common Suggestions:</p>
                {["Honeymoon", "Adventure", "Cultural", "Wildlife", "Wellness", "Solo Friendly", "Family"].map(s => (
                  <button 
                    key={s}
                    type="button"
                    onClick={() => !form.tags.includes(s) && setForm(p => ({ ...p, tags: [...p.tags, s] }))}
                    className="px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 text-[10px] text-white/30 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── SECTION: FAQ ── */}
          <section className="space-y-8">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Frequently Asked Questions
            </h3>

            <div className="space-y-6">
              {form.faq.map((item: { question: string; answer: string }, i: number) => (
                <div key={i} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] space-y-4 relative">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-white/90 shrink-0 mt-1">
                      Q{i + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <input
                        value={item.question}
                        onChange={(e) => handleFaqChange(i, "question", e.target.value)}
                        placeholder="Question..."
                        className="w-full h-[52px] px-5 rounded-xl bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all"
                      />
                      <textarea
                        value={item.answer}
                        onChange={(e) => handleFaqChange(i, "answer", e.target.value)}
                        placeholder="Answer..."
                        rows={2}
                        className="w-full px-5 py-3 rounded-xl bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all resize-none"
                      />
                    </div>
                    {form.faq.length > 1 && (
                      <button type="button" onClick={() => removeFaq(i)} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all active:scale-90 mt-1">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addFaq} className="text-[12px] md:text-[13px] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
              + Add FAQ
            </button>
          </section>

          {/* ── SECTION 4: PUBLICATION SETTINGS ── */}
          <section className="space-y-8">
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

            <div className="hidden sm:flex flex-col-reverse sm:flex-row gap-4 pt-4">
              <button type="button" onClick={() => router.push("/admin/dashboard")} className="w-full sm:w-auto px-12 h-[60px] rounded-2xl bg-red-500/[0.02] border border-red-500/30 text-white/50 font-bold text-[14px] tracking-wider uppercase hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all active:scale-[0.98]">
                Discard
              </button>
              <button type="submit" disabled={saving} className="w-full sm:flex-1 h-[60px] rounded-2xl bg-white text-black font-bold text-[14px] tracking-wider uppercase transition-all hover:bg-white/90 disabled:opacity-40 active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                {saving ? "Synchronizing..." : isEditing ? "Save Journey" : "Publish Journey"}
              </button>
            </div>
          </section>

        </form>
      </main>

      {/* Floating Action Bar (Mobile only) */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-[70] animate-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center gap-3 p-2 rounded-[24px] bg-black/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <button 
            type="button" 
            onClick={safeBack} 
            className="flex-1 h-12 rounded-[18px] bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/50 active:scale-95 transition-all"
          >
            Discard
          </button>
          <button 
            type="submit" 
            form="package-form" 
            disabled={saving} 
            className="flex-[2] h-12 rounded-[18px] bg-white text-black text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
          >
            {saving ? "Saving..." : isEditing ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/* ═══ MOBILE FIXED ACTION BAR ═══ */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[85%] max-w-[340px]">
        <div className="flex items-center gap-2 p-1.5 bg-[#1c1c1e]/60 backdrop-blur-3xl border border-white/[0.05] rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
          <button 
            type="button" 
            onClick={safeBack}
            className="flex-1 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-all"
          >
            Discard
          </button>
          <button 
            type="submit" 
            form="package-form"
            disabled={saving}
            className="flex-[1.8] py-2.5 rounded-[1.25rem] bg-white/[0.9] text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "..." : isEditing ? "Update" : "Publish"}
          </button>
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

/* ── Reusable Field Component ── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  description,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  description?: string;
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
        className="w-full h-[56px] px-4 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
      />
      {description && (
        <p className="text-[10px] text-white/50 italic font-medium leading-tight px-1">{description}</p>
      )}
    </div>
  );
}

/* ── Reusable Segmented Control Component ── */
function SegmentedControl({
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
