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
    category: Array.isArray(initialData?.category) 
      ? initialData.category.filter(cat => ALLOWED_CATEGORIES.includes(cat)) 
      : (initialData?.category && ALLOWED_CATEGORIES.includes(initialData.category as string) ? [initialData.category as string] : []),
    is_published: initialData?.is_published ?? false,
    sort_order: initialData?.sort_order ?? 99,
    tax_status: initialData?.tax_status || "Inclusive of Taxes",
    currency: initialData?.currency || "₹",
    season: initialData?.season || "",
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
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Included in Tour Package</label>
              <div className="space-y-3">
                {form.highlights.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <input value={h} onChange={(e) => handleHighlightChange(i, e.target.value)} placeholder={`Feature ${i + 1}`} className="flex-1 h-[56px] px-6 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all" />
                    {form.highlights.length > 1 && (
                      <button type="button" onClick={() => { const newHighlights = [...form.highlights]; newHighlights.splice(i, 1); setForm((p) => ({ ...p, highlights: newHighlights })); }} className="w-14 h-[56px] shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all active:scale-90">×</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setForm(p => ({ ...p, highlights: [...p.highlights, ""] }))} className="text-[12px] md:text-[13px] font-bold text-[#86868b] hover:text-white transition-colors flex items-center gap-2 py-2 mt-2">
                + Include Feature
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
