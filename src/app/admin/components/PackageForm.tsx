"use client";

import { useState, useRef, useCallback } from "react";
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

  const [form, setForm] = useState({
    title: initialData?.title || "",
    location: initialData?.location || "",
    image: initialData?.image || "",
    price: initialData?.price || "",
    nights: initialDur.nights,
    days: initialDur.days,
    guests: initialData?.guests || "",
    tagline: initialData?.tagline || "",
    description: initialData?.description || "",
    highlights: initialData?.highlights || [""],
    is_published: initialData?.is_published ?? false,
    sort_order: initialData?.sort_order ?? 99,
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(initialData?.image || "");

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
      season: "", // Removed from UI
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
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-2xl">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="text-[13px] md:text-[14px] font-medium text-[#86868b] hover:text-white transition-colors flex items-center gap-1.5 py-2"
          >
            <span className="text-lg">←</span> <span className="hidden xs:inline">Back</span>
          </button>
          <h1 className="text-[14px] md:text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
            {isEditing ? "Edit Experience" : "New Experience"}
            <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/5">
              Admin
            </span>
          </h1>
          <div className="w-12" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
          {/* Image Upload */}
          <div className="space-y-3">
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">
              Cinematic Cover
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-[16/9] rounded-2xl md:rounded-3xl overflow-hidden bg-[#1c1c1e] border-2 border-dashed border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group"
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <span className="text-sm text-white font-bold uppercase tracking-wider">
                      Replace Asset
                    </span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#48484a]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-[13px] md:text-sm text-[#48484a] font-medium">
                    {uploading ? "Processing asset..." : "Upload experience cover (16:9 recommended)"}
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Title & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Package Title"
              value={form.title}
              onChange={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="e.g. Alpine Chalet Retreat"
              required
            />
            <Field
              label="Location"
              value={form.location}
              onChange={(v) => setForm((p) => ({ ...p, location: v }))}
              placeholder="e.g. Swiss Alps"
              required
            />
          </div>

          {/* Price & Capacity Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Field
              label="Starting Price"
              value={form.price}
              onChange={(v) => setForm((p) => ({ ...p, price: v }))}
              placeholder="€12,500"
              required
            />
            <Field
              label="Nights"
              value={form.nights}
              onChange={(v) => setForm((p) => ({ ...p, nights: v }))}
              placeholder="0"
              required
            />
            <Field
              label="Days"
              value={form.days}
              onChange={(v) => setForm((p) => ({ ...p, days: v }))}
              placeholder="0"
              required
            />
            <div className="col-span-2 md:col-span-1">
              <Field
                label="Max Guests"
                value={form.guests}
                onChange={(v) => setForm((p) => ({ ...p, guests: v }))}
                placeholder="2-4"
              />
            </div>
          </div>

          {/* Tagline */}
          <Field
            label="Visual Tagline"
            value={form.tagline}
            onChange={(v) => setForm((p) => ({ ...p, tagline: v }))}
            placeholder="e.g. Witness the infinite from the wild"
          />

          {/* Description */}
          <div className="space-y-3">
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">
              Experience Narrative
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Craft the story of this journey..."
              rows={6}
              className="w-full px-4 py-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Highlights */}
          <div className="space-y-4">
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">
              What&apos;s Included
            </label>
            <div className="space-y-3">
              {form.highlights.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <input
                    value={h}
                    onChange={(e) => handleHighlightChange(i, e.target.value)}
                    placeholder={`Feature ${i + 1}`}
                    className="flex-1 px-4 py-3 rounded-xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all"
                  />
                  {form.highlights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addHighlight}
              className="text-[12px] md:text-[13px] font-bold text-[#86868b] hover:text-white transition-colors flex items-center gap-2 py-2"
            >
              + Include Feature
            </button>
          </div>

          {/* Controls Container */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-3xl bg-[#1c1c1e] border border-white/[0.04]">
            <div className="flex-1 space-y-3">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">
                Priority Order
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    sort_order: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full sm:w-24 px-4 py-3 rounded-xl bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-white/[0.05] pt-4 sm:pt-0">
              <span className="text-[13px] font-bold text-[#48484a] uppercase tracking-wider">
                {form.is_published ? "Status: Live" : "Status: Draft"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, is_published: !p.is_published }))
                }
                className={`relative w-14 h-8 rounded-full transition-all duration-500 ${
                  form.is_published ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-[#3a3a3c]"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    form.is_published ? "left-[30px]" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 md:pt-10">
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[#86868b] font-bold text-sm hover:bg-white/[0.06] hover:text-white transition-all active:scale-[0.98]"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 py-4 rounded-2xl bg-white text-black font-bold text-sm transition-all hover:bg-white/90 disabled:opacity-40 active:scale-[0.98] shadow-2xl shadow-white/5"
            >
              {saving
                ? "Synchronizing..."
                : isEditing
                ? "Save Experience"
                : "Launch Experience"}
            </button>
          </div>
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
        className="w-full px-4 py-3.5 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all"
      />
    </div>
  );
}
