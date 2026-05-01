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
    <div className="min-h-screen bg-black">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-2xl">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="text-[13px] text-[#86868b] hover:text-white transition-colors flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-[15px] font-semibold text-white">
            {isEditing ? "Edit Package" : "New Package"}
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#86868b] mb-3">
              Cover Image
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-[#1c1c1e] border-2 border-dashed border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer group"
            >
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-sm text-white font-medium">
                      Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <svg
                    className="w-10 h-10 text-[#48484a]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-[#48484a]">
                    {uploading ? "Uploading..." : "Click to upload image"}
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

          {/* Price, Duration (Nights/Days), Guests */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field
              label="Price"
              value={form.price}
              onChange={(v) => setForm((p) => ({ ...p, price: v }))}
              placeholder="€12,500"
              required
            />
            <Field
              label="Nights"
              value={form.nights}
              onChange={(v) => setForm((p) => ({ ...p, nights: v }))}
              placeholder="3"
              required
            />
            <Field
              label="Days"
              value={form.days}
              onChange={(v) => setForm((p) => ({ ...p, days: v }))}
              placeholder="4"
              required
            />
            <Field
              label="Guests"
              value={form.guests}
              onChange={(v) => setForm((p) => ({ ...p, guests: v }))}
              placeholder="1"
            />
          </div>

          {/* Tagline */}
          <Field
            label="Tagline"
            value={form.tagline}
            onChange={(v) => setForm((p) => ({ ...p, tagline: v }))}
            placeholder="A short, evocative phrase"
          />

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#86868b] mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Describe this experience in rich detail..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-[#1c1c1e] border border-white/[0.08] text-white text-[15px] placeholder:text-[#48484a] focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all resize-none"
            />
          </div>

          {/* Highlights */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#86868b] mb-3">
              Highlights / What&apos;s Included
            </label>
            <div className="space-y-2">
              {form.highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={h}
                    onChange={(e) => handleHighlightChange(i, e.target.value)}
                    placeholder={`Highlight ${i + 1}`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/[0.08] text-white text-[14px] placeholder:text-[#48484a] focus:outline-none focus:border-white/20 transition-all"
                  />
                  {form.highlights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      className="px-3 rounded-xl bg-red-500/[0.06] border border-red-500/[0.06] text-red-400 text-sm hover:bg-red-500/[0.15] transition-all"
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
              className="mt-3 text-[13px] text-[#86868b] hover:text-white transition-colors"
            >
              + Add Highlight
            </button>
          </div>

          {/* Sort Order & Publish Toggle */}
          <div className="flex items-center gap-6 p-5 rounded-2xl bg-[#1c1c1e] border border-white/[0.04]">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#86868b] mb-2">
                Sort Order
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
                className="w-20 px-3 py-2 rounded-lg bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[13px] text-[#86868b]">
                {form.is_published ? "Published (Live)" : "Draft (Hidden)"}
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, is_published: !p.is_published }))
                }
                className={`relative w-12 h-7 rounded-full transition-all ${
                  form.is_published ? "bg-green-500" : "bg-[#48484a]"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                    form.is_published ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 rounded-xl bg-white text-black font-semibold text-[15px] transition-all hover:bg-white/90 disabled:opacity-40 active:scale-[0.98]"
            >
              {saving
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Create Package"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="px-8 py-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#86868b] font-medium text-[15px] transition-all hover:bg-white/[0.1] hover:text-white"
            >
              Cancel
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
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#86868b] mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl bg-[#1c1c1e] border border-white/[0.08] text-white text-[15px] placeholder:text-[#48484a] focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
      />
    </div>
  );
}
