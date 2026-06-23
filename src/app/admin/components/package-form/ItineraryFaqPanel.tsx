"use client";

import { useState, useRef } from "react";
import type { PanelProps } from "./types";

interface ItineraryFaqPanelProps extends PanelProps {
  setToast: (toast: { show: boolean; message: string; type: "success" | "error" }) => void;
}

export function ItineraryFaqPanel({ form, setForm, setIsDirty, setToast }: ItineraryFaqPanelProps) {
  const itineraryUploadRef = useRef<HTMLInputElement>(null);

  const [itineraryUploading, setItineraryUploading] = useState(false);
  const [itineraryUploadIndex, setItineraryUploadIndex] = useState<number | null>(null);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin_token") || "";
    }
    return "";
  };

  // ── Itinerary Handlers ──
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

  // ── FAQ Handlers ──
  const handleFaqChange = (index: number, field: string, value: string) => {
    setForm((prev) => {
      const faq = [...prev.faq];
      faq[index] = { ...faq[index], [field]: value };
      return { ...prev, faq };
    });
  };

  const addFaq = () => {
    setForm((prev) => ({ ...prev, faq: [...prev.faq, { question: "", answer: "" }] }));
  };

  const removeFaq = (index: number) => {
    setForm((prev) => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      {/* ── SECTION: ITINERARY (DAY-BY-DAY) ── */}
      <section className="space-y-5 pt-8 border-t border-white/[0.02]">
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
      </section>

      {/* ── SECTION: FAQ ── */}
      <section className="space-y-8 pt-8 border-t border-white/[0.02]">
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
    </>
  );
}
