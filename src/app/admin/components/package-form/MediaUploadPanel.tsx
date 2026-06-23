"use client";

import { useState, useRef, useEffect } from "react";
import type { PanelProps } from "./types";

interface MediaUploadPanelProps extends PanelProps {
  setToast: (toast: { show: boolean; message: string; type: "success" | "error" }) => void;
}

export function MediaUploadPanel({ form, setForm, setIsDirty, setToast }: MediaUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(form.image || "");

  // Sync image preview if form.image is updated externally
  useEffect(() => {
    setImagePreview(form.image || "");
  }, [form.image]);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin_token") || "";
    }
    return "";
  };

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
        setToast({ show: true, message: "Upload failed. Please try again.", type: "error" });
        setImagePreview("");
      }
    } catch {
      setToast({ show: true, message: "Upload failed. Check your connection.", type: "error" });
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

  const moveGalleryImage = (index: number, direction: "up" | "down") => {
    setForm((prev) => {
      const gallery = [...(prev.gallery || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
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

  return (
    <>
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
                    onClick={() => moveGalleryImage(index, "up")}
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
                    onClick={() => moveGalleryImage(index, "down")}
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
              if (e.key === "Enter") {
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

      {/* ── SECTION: ITINERARY FLYER (Digital Assets) ── */}
      <section className="space-y-4 pt-8 border-t border-white/[0.02]">
        <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
          Digital Assets (Itinerary Flyer)
        </h3>
        <div className="p-8 rounded-[2rem] bg-[#1c1c1e] border border-white/[0.06] flex flex-col md:flex-row items-center gap-8 group relative overflow-hidden">
          <div className="relative z-10 flex-1 space-y-2">
            <div className="flex items-center gap-4">
              {form.pdf_url ? (
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    {form.pdf_url.toLowerCase().endsWith(".pdf") ? (
                      <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2v20l10-10L7 2z" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-white/90 truncate max-w-[200px]">
                    {form.pdf_url.split("/").pop()?.split("-").slice(1).join("-") || "Asset Loaded"}
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
              className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                pdfUploading 
                  ? "bg-white/5 text-white/70" 
                  : "bg-white/10 text-white hover:bg-white/20 active:scale-95 border border-white/10 shadow-xl"
              }`}
            >
              {pdfUploading ? "Uploading..." : form.pdf_url ? "Replace Asset" : "Upload Asset"}
            </button>
            <input ref={pdfInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePdfUpload} className="hidden" />
          </div>
        </div>
      </section>
    </>
  );
}
