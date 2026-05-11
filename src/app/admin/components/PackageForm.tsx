"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Package } from "@/lib/supabase";

type PackageFormProps = {
  initialData?: Package;
  isEditing?: boolean;
};

export function PackageForm({ initialData, isEditing }: PackageFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseDuration = (d: string) => {
    const nights = d.match(/(\d+)\s*Night/i)?.[1] || "";
    const days = d.match(/(\d+)\s*Day/i)?.[1] || "";
    return { nights, days };
  };

  const initialDur = parseDuration(initialData?.duration || "");
  const ALLOWED_CATEGORIES = ["Luxury Tours", "Group Trips", "Adventure Tours", "Luxury Honeymoons", "MICE Events", "Custom Journeys"];

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
    highlights: initialData?.highlights || [""],
    inclusions: initialData?.inclusions || [""],
    exclusions: initialData?.exclusions || [""],
    itinerary: initialData?.itinerary || [{ day: "1", title: "", description: "" }],
    faq: (initialData as any)?.faq || [{ question: "", answer: "" }],
    category: Array.isArray(initialData?.category) 
      ? initialData.category.filter(cat => ALLOWED_CATEGORIES.includes(cat)) 
      : (initialData?.category && ALLOWED_CATEGORIES.includes(initialData.category as string) ? [initialData.category as string] : []),
    is_published: initialData?.is_published ?? false,
    sort_order: initialData?.sort_order ?? 99,
    tax_status: initialData?.tax_status || "Inclusive of Taxes",
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
    trip_type: (initialData as any)?.trip_type || "group",
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(initialData?.image || "");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getToken = useCallback(() => {
    return sessionStorage.getItem("admin_token") || "";
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImagePreview(URL.createObjectURL(file));

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
        setForm((prev) => ({ ...prev, image: url }));
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
      itinerary: [...prev.itinerary, { day: nextDay, title: "", description: "" }] 
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
    
    const payload = {
      ...form,
      duration,
      highlights: form.highlights.filter((h) => h.trim() !== ""),
      inclusions: form.inclusions.filter((h) => h.trim() !== ""),
      exclusions: form.exclusions.filter((h) => h.trim() !== ""),
      itinerary: form.itinerary.filter((item) => item.title.trim() !== ""),
      faq: form.faq.filter((f: { question: string; answer: string }) => f.question.trim() !== ""),
    };

    const url = isEditing
      ? `/api/packages/${initialData?.id}`
      : "/api/packages";

    const res = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      const err = await res.json();
      alert(`Error: ${err.error}`);
    }

    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Top Bar */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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

        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 md:h-12 flex items-center justify-between relative z-10">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="text-[13px] md:text-[14px] font-medium text-[#86868b] hover:text-white transition-colors flex items-center gap-1.5 py-2"
          >
            <span className="text-lg">←</span> <span className="hidden xs:inline">Back</span>
          </button>
          <h1 className="text-[14px] md:text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
            {isEditing ? "Edit Journey" : "New Experience"}
            <span className="hidden sm:inline-block text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/5">
              Admin
            </span>
          </h1>
          <div className="w-12" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-12 md:pb-24">
        <form onSubmit={handleSubmit} className="space-y-16 md:space-y-20">
          
          {/* ── HERO: CINEMATIC COVER ── */}
          <section className="space-y-8">
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
                    <svg className="w-6 h-6 text-[#86868b] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="text-[13px] md:text-sm text-[#48484a] font-medium">{uploading ? "Processing asset..." : "Upload experience cover (16:9 recommended)"}</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </section>

          {/* ── SECTION 1: BASIC INFORMATION ── */}
          <section className="space-y-8 pt-4">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Field label="Package Title" value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} placeholder="e.g. Alpine Chalet Retreat" required />
              <Field label="Location" value={form.location} onChange={(v) => setForm((p) => ({ ...p, location: v }))} placeholder="e.g. Swiss Alps" required />
            </div>

            <div className="space-y-4 pt-4">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">
                Service Category (Multi-Select)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {["Luxury Tours", "Group Trips", "Adventure Tours", "Luxury Honeymoons", "MICE Events", "Custom Journeys"].map((cat) => {
                  const isActive = form.category.includes(cat);
                  return (
                    <button key={cat} type="button" onClick={() => setForm(prev => ({ ...prev, category: isActive ? prev.category.filter(c => c !== cat) : [...prev.category, cat] }))} className={`px-4 py-4 min-h-[64px] rounded-xl text-[11px] md:text-[12px] font-bold uppercase tracking-wider transition-all border text-left flex items-center justify-between group ${isActive ? "bg-white/10 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "bg-white/5 border-white/5 text-[#48484a] hover:border-white/10 hover:text-[#86868b]"}`}>
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

            <Field label="Visual Tagline" value={form.tagline} onChange={(v) => setForm((p) => ({ ...p, tagline: v }))} placeholder="e.g. Witness the infinite from the wild" />

            <div className="space-y-4">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Experience Narrative</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Craft the story of this journey..." rows={6} required className="w-full px-6 py-6 rounded-2xl md:rounded-3xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed" />
            </div>

            <div className="space-y-5">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Journey Highlights</label>
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
              <button type="button" onClick={addHighlight} className="text-[12px] md:text-[13px] font-bold text-[#86868b] hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
                + Add Highlight
              </button>
            </div>

            <div className="space-y-5 pt-8 border-t border-white/[0.02]">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">What&apos;s Included (Inclusions)</label>
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
              <button type="button" onClick={addInclusion} className="text-[12px] md:text-[13px] font-bold text-[#86868b] hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
                + Add Inclusion
              </button>
            </div>

            <div className="space-y-5 pt-8 border-t border-white/[0.02]">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">What&apos;s NOT Included (Exclusions)</label>
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
              <button type="button" onClick={addExclusion} className="text-[12px] md:text-[13px] font-bold text-[#86868b] hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
                + Add Exclusion
              </button>
            </div>

            <div className="space-y-5 pt-8 border-t border-white/[0.02]">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Journey Itinerary (Day-by-Day)</label>
              <div className="space-y-6">
                {form.itinerary.map((item, i) => (
                  <div key={i} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] space-y-4 relative group/itinerary">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-white/40">
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
                      placeholder="Narrative for this day..." 
                      rows={3} 
                      className="w-full px-6 py-4 rounded-2xl bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all resize-none" 
                    />
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItineraryDay} className="text-[12px] md:text-[13px] font-bold text-[#86868b] hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
                + Add Day to Journey
              </button>
            </div>
          </section>

          {/* ── SECTION 3: LOGISTICS & FINANCIALS ── */}
          <section className="space-y-8">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Pricing & Itinerary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <Field label="Ideal For" value={form.guests} onChange={(v) => setForm((p) => ({ ...p, guests: v }))} placeholder="e.g. Couples, Families, Solo" />
              <Field label="Travel Season" value={form.season} onChange={(v) => setForm((p) => ({ ...p, season: v }))} placeholder="e.g. Oct — Mar" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-8 border-t border-white/[0.02]">
              <Field label="Duration (Nights)" value={form.nights} onChange={(v) => setForm((p) => ({ ...p, nights: v }))} placeholder="e.g. 3" required />
              <Field label="Duration (Days)" value={form.days} onChange={(v) => setForm((p) => ({ ...p, days: v }))} placeholder="e.g. 4" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-8 border-t border-white/[0.02]">
              <SegmentedControl label="Currency" value={form.currency} onChange={(v) => setForm(p => ({ ...p, currency: v }))} options={[{ label: "₹", value: "₹" }, { label: "$", value: "$" }, { label: "€", value: "€" }]} />
              <Field label="Adult Price" value={form.price} onChange={(v) => setForm((p) => ({ ...p, price: v }))} placeholder="e.g. 79,000" required />
              <Field label="Child Price" value={form.child_price} onChange={(v) => setForm((p) => ({ ...p, child_price: v }))} placeholder="Optional" />
              <Field label="Infant Price" value={form.infant_price} onChange={(v) => setForm((p) => ({ ...p, infant_price: v }))} placeholder="Optional" />
            </div>

            <div className="pt-8 border-t border-white/[0.02]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 md:p-8 rounded-3xl bg-[#1c1c1e] border border-white/[0.04]">
                <div className="flex-1 space-y-1">
                  <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Tax Policy</label>
                  <span className="block text-[13px] font-bold text-white uppercase tracking-wider">
                    {form.tax_status === "Inclusive of Taxes" ? "Global Tax Enabled" : "Global Tax Disabled"}
                  </span>
                  <p className="text-[11px] text-[#86868b] mt-1 leading-relaxed max-w-md">
                    {form.tax_status === "Inclusive of Taxes" 
                      ? "The administrative tax percentage will be calculated and added to the final total." 
                      : "This journey will ignore global tax settings and display as tax-exclusive."}
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setForm((p) => ({ ...p, tax_status: p.tax_status === "Inclusive of Taxes" ? "Excluding of Taxes" : "Inclusive of Taxes" }))} 
                  className={`relative w-16 h-9 rounded-full transition-all duration-500 shrink-0 ${form.tax_status === "Inclusive of Taxes" ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-[#3a3a3c]"}`}
                >
                  <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${form.tax_status === "Inclusive of Taxes" ? "left-[34px]" : "left-1"}`} />
                </button>
              </div>
            </div>
          </section>

          {/* ── SECTION: PROMOTIONS & BADGES ── */}
          <section className="space-y-8">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Promotions &amp; Badges
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <Field label="Original Price (Strikethrough)" value={form.original_price} onChange={(v) => setForm((p) => ({ ...p, original_price: v }))} placeholder="e.g. 95,000 (leave empty if no discount)" />
              <div className="space-y-3">
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Package Badge</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["", "Trending", "Bestseller", "New", "Recommended", "Super Saver"].map((b) => {
                    const isActive = form.badge === b;
                    const label = b || "None";
                    return (
                      <button key={label} type="button" onClick={() => setForm(prev => ({ ...prev, badge: b }))} className={`px-3 py-3 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all border ${isActive ? "bg-white/10 border-white text-white" : "bg-white/5 border-white/5 text-[#48484a] hover:border-white/10"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 md:p-8 rounded-3xl bg-[#1c1c1e] border border-white/[0.04]">
              <div className="flex-1 space-y-1">
                <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Featured Package</label>
                <span className="block text-[13px] font-bold text-white uppercase tracking-wider">
                  {form.is_featured ? "Highlighted on Homepage" : "Standard Listing"}
                </span>
                <p className="text-[11px] text-[#86868b] mt-1 leading-relaxed max-w-md">
                  Featured packages appear prominently in the homepage showcase.
                </p>
              </div>
              <button type="button" onClick={() => setForm((p) => ({ ...p, is_featured: !p.is_featured }))} className={`relative w-16 h-9 rounded-full transition-all duration-500 shrink-0 ${form.is_featured ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-[#3a3a3c]"}`}>
                <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${form.is_featured ? "left-[34px]" : "left-1"}`} />
              </button>
            </div>
          </section>

          {/* ── SECTION: ROUTE & LOGISTICS ── */}
          <section className="space-y-8">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Route &amp; Logistics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <Field label="Route Start" value={form.route_start} onChange={(v) => setForm((p) => ({ ...p, route_start: v }))} placeholder="e.g. Delhi Airport (DEL)" />
              <Field label="Route End" value={form.route_end} onChange={(v) => setForm((p) => ({ ...p, route_end: v }))} placeholder="e.g. Leh Airport (IXL)" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-8 border-t border-white/[0.02]">
              <SegmentedControl label="Difficulty Level" value={form.difficulty_level} onChange={(v) => setForm(p => ({ ...p, difficulty_level: v }))} options={[{ label: "Easy", value: "Easy" }, { label: "Moderate", value: "Moderate" }, { label: "Challenging", value: "Challenging" }]} />
              <div className="space-y-3">
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Min Group Size</label>
                <input type="number" value={form.min_group_size} onChange={(e) => setForm((p) => ({ ...p, min_group_size: parseInt(e.target.value) || 1 }))} className="w-full h-[56px] px-4 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Max Group Size</label>
                <input type="number" value={form.max_group_size} onChange={(e) => setForm((p) => ({ ...p, max_group_size: parseInt(e.target.value) || 20 }))} className="w-full h-[56px] px-4 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
            </div>
          </section>

          {/* ── SECTION: TAXONOMY & DISCOVERY ── */}
          <section className="space-y-8">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Taxonomy &amp; Discovery
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <Field label="Destination Slug" value={form.destination} onChange={(v) => setForm((p) => ({ ...p, destination: v }))} placeholder="e.g. vietnam, ladakh" />
              <Field label="Region" value={form.region} onChange={(v) => setForm((p) => ({ ...p, region: v }))} placeholder="e.g. Southeast Asia, Himalayas" />
              <SegmentedControl label="Trip Type" value={form.trip_type} onChange={(v) => setForm(p => ({ ...p, trip_type: v }))} options={[{ label: "Group", value: "group" }, { label: "Private", value: "private" }, { label: "Custom", value: "custom" }]} />
            </div>

            <div className="space-y-4 pt-8 border-t border-white/[0.02]">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Search Tags</label>
              <div className="flex gap-3">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Type a tag and press Enter..." className="flex-1 h-[56px] px-6 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all" />
                <button type="button" onClick={addTag} className="px-6 h-[56px] shrink-0 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-white/60 text-[12px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all">Add</button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {form.tags.map((tag: string) => (
                    <span key={tag} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-white/60">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-white/30 hover:text-red-400 transition-colors">×</button>
                    </span>
                  ))}
                </div>
              )}
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
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40 shrink-0 mt-1">
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
            <button type="button" onClick={addFaq} className="text-[12px] md:text-[13px] font-bold text-[#86868b] hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
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
                <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Display Position (1 = Top)</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="w-full sm:w-32 h-[56px] px-4 rounded-xl md:rounded-2xl bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-white/[0.05] pt-6 sm:pt-0">
                <div className="text-right">
                  <span className="block text-[13px] font-bold text-white uppercase tracking-wider">{form.is_published ? "Published to Website" : "Saved as Draft"}</span>
                  <span className="block text-[11px] text-[#86868b] mt-1">{form.is_published ? "Live and visible to all guests" : "Hidden from public view"}</span>
                </div>
                <button type="button" onClick={() => setForm((p) => ({ ...p, is_published: !p.is_published }))} className={`relative w-16 h-9 rounded-full transition-all duration-500 shrink-0 ${form.is_published ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-[#3a3a3c]"}`}>
                  <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${form.is_published ? "left-[34px]" : "left-1"}`} />
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
              <button type="button" onClick={() => router.push("/admin/dashboard")} className="w-full sm:w-auto px-12 h-[60px] rounded-2xl bg-red-500/[0.02] border border-red-500/30 text-[#86868b] font-bold text-[14px] tracking-wider uppercase hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all active:scale-[0.98]">
                Discard
              </button>
              <button type="submit" disabled={saving} className="w-full sm:flex-1 h-[60px] rounded-2xl bg-white text-black font-bold text-[14px] tracking-wider uppercase transition-all hover:bg-white/90 disabled:opacity-40 active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                {saving ? "Synchronizing..." : isEditing ? "Save Journey" : "Publish Journey"}
              </button>
            </div>
          </section>

        </form>
      </main>

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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-[56px] px-4 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all"
      />
    </div>
  );
}

/* ── Reusable Segmented Control Component ── */
function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">
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
                ? "bg-white text-black shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                : "text-[#86868b] hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
