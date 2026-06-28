"use client";

import type { PanelProps } from "./types";
import { Field } from "../PackageForm";

export function BasicInfoPanel({ form, setForm, setIsDirty, mode }: PanelProps) {
  const ALLOWED_CATEGORIES = ["Luxury Tours", "Group Trips", "Adventure Tours", "Luxury Honeymoons", "MICE Events", "Custom Journeys"];

  // ── Highlights Handlers ──
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

  // ── Inclusions Handlers ──
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

  // ── Exclusions Handlers ──
  const handleExclusionChange = (index: number, value: string) => {
    setForm((prev) => {
      const exclusions = [...prev.exclusions];
      exclusions[index] = value;
      return { ...prev, exclusions };
    });
  };

  const addExclusion = () => {
    setForm((prev) => ({ ...prev, exclusions: [...prev.exclusions, ""] }));
  };

  const removeExclusion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      exclusions: prev.exclusions.filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      {/* ── VIEW: IDENTITY (Title, Category, Subtitle, Description) ── */}
      {(!mode || mode === "identity") && (
        <>
          <section className="space-y-8 pt-4">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Identity Card
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Field 
                label="Package Title" 
                value={form.title} 
                onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, title: v }})} 
                placeholder="e.g. Alpine Chalet Retreat" 
                description="The main public headline of your tour package. Keep it catchy and clear." 
                required 
              />
              <Field 
                label="Location Tag" 
                value={form.location} 
                onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, location: v }})} 
                placeholder="e.g. Swiss Alps" 
                description="The primary region or country (e.g. Switzerland, Kashmir)." 
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Field 
                label="Short Subtitle Tagline" 
                value={form.tagline} 
                onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, tagline: v }})} 
                placeholder="e.g. Witness the infinite from the wild" 
                description="A short, evocative sub-headline displayed below the title." 
              />
              <Field 
                label="Destinations Covered" 
                value={form.destinations_covered} 
                onChange={(v) => setForm((p) => { setIsDirty(true); return { ...p, destinations_covered: v }})} 
                placeholder="e.g. Zurich, Zermatt, St. Moritz" 
                description="List the main cities or stops visited, separated by commas." 
              />
            </div>

            <div className="space-y-4 pt-4">
              <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">
                Service Category (Multi-Select)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {ALLOWED_CATEGORIES.map((cat) => {
                  const isActive = form.category.includes(cat);
                  return (
                    <button 
                      key={cat} 
                      type="button" 
                      onClick={() => setForm(prev => { 
                        setIsDirty(true); 
                        return { 
                          ...prev, 
                          category: isActive ? prev.category.filter(c => c !== cat) : [...prev.category, cat] 
                        };
                      })} 
                      className={`px-4 py-4 min-h-[64px] rounded-xl text-[11px] md:text-[12px] font-bold uppercase tracking-wider transition-all border text-left flex items-center justify-between group ${
                        isActive 
                          ? "bg-white/10 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                          : "bg-white/5 border-white/5 text-white/90 hover:border-white/10 hover:text-white/50"
                      }`}
                    >
                      <span className="pr-2">{cat}</span>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${isActive ? "bg-white scale-100" : "bg-white/10 scale-50"}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4">
            <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">Experience Narrative</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm((p) => { setIsDirty(true); return { ...p, description: e.target.value }})} 
              placeholder="Craft the story of this journey..." 
              rows={6} 
              required 
              className="w-full px-6 py-6 rounded-2xl md:rounded-3xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed" 
            />
          </section>

          <section className="space-y-4 pt-4">
            <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">The Soul of the Journey</label>
            <textarea 
              value={form.soul_of_journey || ""} 
              onChange={(e) => setForm((p) => { setIsDirty(true); return { ...p, soul_of_journey: e.target.value }})} 
              placeholder="e.g. Every day is an unwritten chapter of your life's greatest story. Handcrafted to evoke wonder..." 
              rows={4} 
              className="w-full px-6 py-6 rounded-2xl md:rounded-3xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed" 
            />
          </section>
        </>
      )}

      {/* ── VIEW: LISTS (Highlights, Inclusions, Exclusions) ── */}
      {(!mode || mode === "lists") && (
        <section className="space-y-10">
          <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
            Content Lists
          </h3>

          <div className="space-y-5">
            <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">Journey Highlights</label>
            <div className="space-y-3">
              {form.highlights.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <input 
                    value={h} 
                    onChange={(e) => handleHighlightChange(i, e.target.value)} 
                    placeholder={`Highlight ${i + 1}`} 
                    className="flex-1 h-[56px] px-6 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all" 
                  />
                  {form.highlights.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeHighlight(i)} 
                      className="w-14 h-[56px] shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
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
              className="text-[12px] md:text-[13px] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 py-2 mt-2"
            >
              + Add Highlight
            </button>
          </div>

          <div className="space-y-5 pt-8 border-t border-white/[0.02]">
            <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">What&apos;s Included (Inclusions)</label>
            <div className="space-y-3">
              {form.inclusions.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <input 
                    value={h} 
                    onChange={(e) => handleInclusionChange(i, e.target.value)} 
                    placeholder={`Inclusion ${i + 1}`} 
                    className="flex-1 h-[56px] px-6 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all" 
                  />
                  {form.inclusions.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeInclusion(i)} 
                      className="w-14 h-[56px] shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={addInclusion} 
              className="text-[12px] md:text-[13px] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 py-2 mt-2"
            >
              + Add Inclusion
            </button>
          </div>

          <div className="space-y-5 pt-8 border-t border-white/[0.02]">
            <label className="block text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">What&apos;s NOT Included (Exclusions)</label>
            <div className="space-y-3">
              {form.exclusions.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <input 
                    value={h} 
                    onChange={(e) => handleExclusionChange(i, e.target.value)} 
                    placeholder={`Exclusion ${i + 1}`} 
                    className="flex-1 h-[56px] px-6 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.08] text-white text-[14px] placeholder:text-[#3a3a3c] focus:outline-none focus:border-red-500/20 transition-all" 
                  />
                  {form.exclusions.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeExclusion(i)} 
                      className="w-14 h-[56px] shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl bg-red-500/[0.05] border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={addExclusion} 
              className="text-[12px] md:text-[13px] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 py-2 mt-2"
            >
              + Add Exclusion
            </button>
          </div>
        </section>
      )}
    </>
  );
}
