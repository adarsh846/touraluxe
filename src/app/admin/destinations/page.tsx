"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Destination } from "@/lib/supabase";

export default function DestinationStudio() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // ── Editor State ──
  const [isEditing, setIsEditing] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    region: "",
    country: "",
    cover_image: "",
    description: "",
    meta_title: "",
    meta_description: "",
    is_international: true,
    sort_order: 99,
    is_published: true,
    faq: [{ question: "", answer: "" }] as { question: string; answer: string }[],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getToken = useCallback(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return ""; }
    return token;
  }, [router]);

  const fetchDestinations = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/destinations", { headers: { "x-admin-token": token }, cache: "no-store" });
      if (res.ok) setDestinations(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [getToken]);

  useEffect(() => { fetchDestinations(); }, [fetchDestinations]);

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

  const handleEdit = (dest: Destination) => {
    setForm({
      name: dest.name,
      slug: dest.slug,
      region: dest.region || "",
      country: dest.country || "",
      cover_image: dest.cover_image || "",
      description: dest.description || "",
      meta_title: dest.meta_title || "",
      meta_description: dest.meta_description || "",
      is_international: dest.is_international ?? true,
      sort_order: dest.sort_order ?? 99,
      is_published: dest.is_published ?? true,
      faq: (dest.faq && dest.faq.length > 0) ? dest.faq : [{ question: "", answer: "" }],
    });
    setEditSlug(dest.slug);
    setIsEditing(true);
    setIsDirty(false);
  };

  const handleNew = () => {
    setForm({
      name: "", slug: "", region: "", country: "", cover_image: "", description: "",
      meta_title: "", meta_description: "", is_international: true, sort_order: 99, is_published: true,
      faq: [{ question: "", answer: "" }],
    });
    setEditSlug(null);
    setIsEditing(true);
    setIsDirty(false);
  };

  const safeBack = useCallback(() => {
    if (isDirty && !confirm("You have unsaved changes. Discard them?")) return;
    if (isEditing) {
      setIsEditing(false);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin/dashboard");
    }
  }, [isDirty, isEditing, router]);

  const handleSave = async () => {
    const token = getToken();
    if (!token || !form.name.trim()) return;
    setSaving(true);

    const payload = {
      ...form,
      slug: form.slug || autoSlug(form.name),
      faq: form.faq.filter(f => f.question.trim() !== ""),
    };

    const url = editSlug ? `/api/destinations/${editSlug}` : "/api/destinations";
    const method = editSlug ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchDestinations();
        setIsEditing(false);
        setEditSlug(null);
        setIsDirty(false);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) { alert("Network error"); }
    setSaving(false);
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const token = getToken();
    if (!token) return;
    setDeleting(slug);
    try {
      const res = await fetch(`/api/destinations/${slug}`, { method: "DELETE", headers: { "x-admin-token": token } });
      if (res.ok) setDestinations(prev => prev.filter(d => d.slug !== slug));
    } catch (err) { console.error(err); }
    setDeleting(null);
  };

  const addFaq = () => setForm(prev => ({ ...prev, faq: [...prev.faq, { question: "", answer: "" }] }));
  const removeFaq = (i: number) => setForm(prev => ({ ...prev, faq: prev.faq.filter((_: any, idx: number) => idx !== i) }));
  const updateFaq = (i: number, field: string, value: string) => {
    setForm(prev => {
      const faq = [...prev.faq];
      faq[i] = { ...faq[i], [field]: value };
      setIsDirty(true);
      return { ...prev, faq };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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
        setForm(prev => ({ ...prev, cover_image: url }));
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      alert("Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  // ── EDITOR VIEW ──
  if (isEditing) {
    return (
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header 
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] px-4 md:px-8 ${
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
            <button onClick={safeBack} className="relative block group">
              {/* iOS Deep Shadow & Glow */}
              <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
              <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
              
              <div className={`relative flex items-center justify-center bg-[#f5f5f7] rounded-full overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-700 ${isScrolled ? "w-[4.5rem] md:w-[5.5rem] h-7 md:h-8" : "w-24 md:w-28 h-9 md:h-10"}`}>
                <div className={`relative flex items-center justify-center transition-all duration-500 ${isScrolled ? "w-[4.5rem] md:w-[5.5rem] h-7 md:h-8" : "w-24 md:w-28 h-9 md:h-10"}`}>
                  <Image 
                    src="/assets/logo-transparent.webp" 
                    alt="TouraLuxe" 
                    fill 
                    priority
                    className="object-contain scale-[2.1] translate-y-[4px] brightness-[0.05]" 
                  />
                </div>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                Admin
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                Destinations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={safeBack} className="hidden md:block text-[11px] font-bold uppercase tracking-[0.2em] text-[#86868b] hover:text-white transition-colors">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving} className="hidden md:block px-6 py-2.5 rounded-full bg-white text-black text-[11px] font-bold uppercase tracking-wider hover:bg-[#f5f5f7] active:scale-95 transition-all disabled:opacity-50 shadow-2xl">
              {saving ? "Saving..." : editSlug ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </header>

        <main className="max-w-[900px] mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-32 md:pb-24 space-y-12 md:space-y-16">
          <div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-2">
              {editSlug ? "Edit Destination" : "New Destination"}
            </h1>
            <p className="text-white/30 text-sm">Configure destination details and SEO metadata.</p>
          </div>

          {/* Basic Info */}
          <section className="space-y-8">
            <h3 className="text-[13px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Name" value={form.name} onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, name: v, slug: p.slug || autoSlug(v) }})} placeholder="e.g. Vietnam" required />
              <Field label="Slug (URL)" value={form.slug} onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, slug: v }})} placeholder="auto-generated from name" />
              <Field label="Country" value={form.country} onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, country: v }})} placeholder="e.g. Vietnam" />
              <Field label="Region" value={form.region} onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, region: v }})} placeholder="e.g. Southeast Asia" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-5 rounded-2xl bg-[#1c1c1e] border border-white/[0.04]">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">International</span>
                  <span className="block text-[12px] text-white/50 mt-1">{form.is_international ? "Yes — International" : "No — Domestic (India)"}</span>
                </div>
                <button type="button" onClick={() => setForm(p => { setIsDirty(true); return { ...p, is_international: !p.is_international }})} className={`relative w-14 h-8 rounded-full transition-all duration-500 shrink-0 ${form.is_international ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-[#3a3a3c]"}`}>
                  <div className={`absolute top-0.5 w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-500 ${form.is_international ? "left-[26px]" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-5 rounded-2xl bg-[#1c1c1e] border border-white/[0.04]">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Published</span>
                  <span className="block text-[12px] text-white/50 mt-1">{form.is_published ? "Live on website" : "Hidden (Draft)"}</span>
                </div>
                <button type="button" onClick={() => setForm(p => { setIsDirty(true); return { ...p, is_published: !p.is_published }})} className={`relative w-14 h-8 rounded-full transition-all duration-500 shrink-0 ${form.is_published ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-[#3a3a3c]"}`}>
                  <div className={`absolute top-0.5 w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-500 ${form.is_published ? "left-[26px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Cover Image */}
          <section className="space-y-8">
            <h3 className="text-[13px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">Cover Image</h3>
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden bg-[#1c1c1e] border-2 border-dashed border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group shadow-2xl"
              >
                {form.cover_image ? (
                  <>
                    <Image src={form.cover_image} alt="Cover Preview" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="text-sm text-white font-bold uppercase tracking-wider">{uploading ? "Processing..." : "Replace Asset"}</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                      <svg className="w-6 h-6 text-[#86868b] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-sm text-[#48484a] font-medium">{uploading ? "Processing asset..." : "Upload destination cover (16:9)"}</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Field label="Manual Image URL (Fallback)" value={form.cover_image} onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, cover_image: v }})} placeholder="https://..." />
            </div>
          </section>

          {/* Description */}
          <section className="space-y-8">
            <h3 className="text-[13px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">Description</h3>
            <div className="space-y-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Destination Narrative</label>
              <textarea value={form.description} onChange={(e) => setForm(p => { setIsDirty(true); return { ...p, description: e.target.value }})} placeholder="A rich description of this destination..." rows={4} className="w-full px-6 py-5 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed" />
            </div>
          </section>

          {/* SEO */}
          <section className="space-y-8">
            <h3 className="text-[13px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">SEO Metadata</h3>
            <div className="grid grid-cols-1 gap-6">
              <Field label="Meta Title" value={form.meta_title} onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, meta_title: v }})} placeholder="e.g. Vietnam Tour Packages 2026 — TouraLuxe" />
              <div className="space-y-4">
                <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Meta Description</label>
                <textarea value={form.meta_description} onChange={(e) => setForm(p => { setIsDirty(true); return { ...p, meta_description: e.target.value }})} placeholder="SEO description for search engines..." rows={3} className="w-full px-6 py-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all resize-none" />
              </div>
              <Field label="Sort Order (1 = Top)" value={String(form.sort_order)} onChange={(v) => setForm(p => { setIsDirty(true); return { ...p, sort_order: parseInt(v) || 99 }})} placeholder="99" />
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-8">
            <h3 className="text-[13px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">Destination FAQ</h3>
            <div className="space-y-4">
              {form.faq.map((item, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[9px] font-black text-white/40 shrink-0">Q{i + 1}</div>
                    <div className="flex-1 space-y-3">
                      <input value={item.question} onChange={(e) => updateFaq(i, "question", e.target.value)} placeholder="Question..." className="w-full h-[48px] px-5 rounded-xl bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all" />
                      <textarea value={item.answer} onChange={(e) => updateFaq(i, "answer", e.target.value)} placeholder="Answer..." rows={2} className="w-full px-5 py-3 rounded-xl bg-black border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all resize-none" />
                    </div>
                    {form.faq.length > 1 && (
                      <button onClick={() => removeFaq(i)} className="w-8 h-8 rounded-full bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all text-sm shrink-0">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addFaq} className="text-[12px] font-bold text-[#86868b] hover:text-white transition-colors">+ Add FAQ</button>
          </section>
        </main>

        {/* Floating Action Bar (Mobile Editor only) */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-[70] animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3 p-2 rounded-[24px] bg-black/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <button 
              type="button" 
              onClick={safeBack} 
              className="flex-1 h-12 rounded-[18px] bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-[#86868b] active:scale-95 transition-all"
            >
              Discard
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-[2] h-12 rounded-[18px] bg-white text-black text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
            >
              {saving ? "Saving..." : editSlug ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header 
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] px-4 md:px-8 ${
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
            <button onClick={safeBack} className="relative block group shrink-0">
              {/* iOS Deep Shadow & Glow */}
              <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
              <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
              
              <div className={`relative flex items-center justify-center bg-[#f5f5f7] rounded-full overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-700 ${isScrolled ? "w-[4.5rem] md:w-[5.5rem] h-7 md:h-8" : "w-24 md:w-28 h-9 md:h-10"}`}>
                <div className={`relative flex items-center justify-center transition-all duration-500 ${isScrolled ? "w-[4.5rem] md:w-[5.5rem] h-7 md:h-8" : "w-24 md:w-28 h-9 md:h-10"}`}>
                  <Image 
                    src="/assets/logo-transparent.webp" 
                    alt="TouraLuxe" 
                    fill 
                    priority
                    className="object-contain scale-[2.1] translate-y-[4px] brightness-[0.05]" 
                  />
                </div>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-block text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 translate-y-[1px]">
                Admin
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 translate-y-[1px]">
                Destinations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={safeBack} className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#86868b] hover:text-white transition-colors">
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
            <button onClick={handleNew} className="px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-white text-black text-[10px] md:text-[12px] font-bold uppercase tracking-wider hover:bg-[#f5f5f7] active:scale-95 transition-all shadow-2xl">
              <span className="hidden sm:inline">+ New Destination</span>
              <span className="sm:hidden">+ New</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 pt-28 pb-16">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-2">Destination Studio</h1>
        <p className="text-white/30 text-sm mb-12">Manage destination pages and SEO metadata for your listing system.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard label="Total" value={destinations.length} />
          <StatCard label="Published" value={destinations.filter(d => d.is_published).length} />
          <StatCard label="International" value={destinations.filter(d => d.is_international).length} />
          <StatCard label="Domestic" value={destinations.filter(d => !d.is_international).length} />
        </div>

        {/* Destination List */}
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {destinations.map(dest => (
            <div key={dest.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-[20px] md:rounded-[24px] bg-[#1c1c1e] border border-white/[0.04] group hover:border-white/[0.08] transition-all">
              <div className="relative w-14 h-14 md:w-20 md:h-14 rounded-xl md:rounded-2xl overflow-hidden bg-white/5 shrink-0">
                {dest.cover_image ? (
                  <Image src={dest.cover_image} alt={dest.name} fill className="object-cover group-hover:scale-110 transition-all duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10 text-xl">🌍</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[14px] md:text-[17px] font-bold truncate text-white">{dest.name}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleEdit(dest)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] md:text-[11px] font-bold hover:bg-white/10 transition-all">Edit</button>
                    <button onClick={() => handleDelete(dest.slug, dest.name)} disabled={deleting === dest.slug} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-[#86868b] truncate">/{dest.slug} · {dest.region || "No region"}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${dest.is_international ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                    {dest.is_international ? "International" : "Domestic"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${dest.is_published ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-white/20"}`}>
                    {dest.is_published ? "Live" : "Draft"}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {destinations.length === 0 && (
            <div className="text-center py-24">
              <p className="text-white/20 text-sm mb-4">No destinations yet.</p>
              <button onClick={handleNew} className="px-6 py-3 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">
                Create Your First Destination
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Reusable Field ──
function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="space-y-3">
      <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a]">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="w-full h-[56px] px-6 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all" />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-5 md:p-8 rounded-[24px] md:rounded-[32px] bg-[#1c1c1e] border border-white/[0.04] hover:border-white/[0.1] transition-all">
      <p className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#86868b] mb-2">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-white tabular-nums tracking-tighter">{value}</p>
    </div>
  );
}
