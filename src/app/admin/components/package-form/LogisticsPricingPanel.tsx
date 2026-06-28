"use client";

import type { PanelProps } from "./types";
import { Field, SegmentedControl } from "../PackageForm";
import { usePricing } from "@/hooks/usePricing";
import { cn } from "@/lib/utils";

interface LogisticsPricingPanelProps extends PanelProps {
  availableDestinations: Array<{ name: string; slug: string }>;
  dynamicOptions: {
    tripTypes: string[];
    difficulties: string[];
  };
}

export function LogisticsPricingPanel({
  form,
  setForm,
  setIsDirty,
  availableDestinations,
  dynamicOptions,
  mode,
}: LogisticsPricingPanelProps) {
  const { computePrice } = usePricing();

  return (
    <>
      {/* ── VIEW: IDENTITY (Guests, Season, Duration, Badges) ── */}
      {(!mode || mode === "identity") && (
        <>
          {/* ── SECTION 3: LOGISTICS & GENERAL META ── */}
          <section className="space-y-6 pt-12">
            <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
              Duration &amp; Season
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              <Field 
                label="Best For (Interests / Themes)" 
                value={form.guests} 
                onChange={(v: string) => setForm((p) => { setIsDirty(true); return { ...p, guests: v }; })} 
                placeholder="e.g. Culture, Food, Nature, Families, Solo Travelers" 
                description="Comma-separated interests/themes suited for this trip (displays dynamically on the front-end)." 
              />
              <div className="relative group">
                <Field 
                  label="Best Travel Season" 
                  value={form.season} 
                  onChange={(v: string) => setForm((p) => { setIsDirty(true); return { ...p, season: v }; })} 
                  placeholder="e.g. October — March" 
                  description={
                    form.seasons_list && form.seasons_list.length > 0 
                      ? "Auto-calculated based on detailed seasons below."
                      : "Months or season when destination weather is optimal."
                  }
                  disabled={form.seasons_list && form.seasons_list.length > 0}
                />
                {form.seasons_list && form.seasons_list.length > 0 && (
                  <span className="absolute top-0.5 right-0 text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 select-none pointer-events-none">
                    Auto-Sync
                  </span>
                )}
              </div>
            </div>

            {/* Multi Best Time to Visit */}
            <div className="space-y-4 pt-6 border-t border-white/[0.03] col-span-full">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white/90">Best Time to Visit (Detailed Seasons)</label>
                  <span className="text-[10px] text-white/30 font-normal">Configure detailed seasonal highlights (e.g. Dec-May | Peak Season | Expect dry and mild weather...)</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setForm(p => ({ ...p, seasons_list: [...(p.seasons_list || []), { season: "", type: "Peak Season", highlights: "" }] }))}
                  className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 hover:text-white transition-colors"
                >
                  + Add Season
                </button>
              </div>

              {form.seasons_list && form.seasons_list.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {form.seasons_list.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start bg-white/[0.01] border border-white/[0.03] p-5 rounded-[2rem] relative group">
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Season / Month Range</label>
                            <input 
                              type="text"
                              value={item.season}
                              onChange={(e) => {
                                const newSeasons = [...(form.seasons_list || [])];
                                newSeasons[idx].season = e.target.value;
                                setForm(p => ({ ...p, seasons_list: newSeasons }));
                                setIsDirty(true);
                              }}
                              placeholder="e.g. Dec-May"
                              className="w-full h-11 bg-black/45 border border-white/10 rounded-xl px-4 text-xs font-bold text-white focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Season Category</label>
                            <select 
                              value={item.type || "Peak Season"}
                              onChange={(e) => {
                                const newSeasons = [...(form.seasons_list || [])];
                                newSeasons[idx].type = e.target.value;
                                setForm(p => ({ ...p, seasons_list: newSeasons }));
                                setIsDirty(true);
                              }}
                              className="w-full h-11 bg-black/45 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all appearance-none cursor-pointer"
                            >
                              <option value="Peak Season">Peak Season</option>
                              <option value="Moderate Season">Moderate Season</option>
                              <option value="Off Season">Off Season</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/40">What to Expect (Detailed Bullet Points, one per line)</label>
                          <textarea 
                            value={item.highlights}
                            onChange={(e) => {
                              const newSeasons = [...(form.seasons_list || [])];
                              newSeasons[idx].highlights = e.target.value;
                              setForm(p => ({ ...p, seasons_list: newSeasons }));
                              setIsDirty(true);
                            }}
                            placeholder="e.g. Expect dry and mild weather...&#10;Hotel prices are at peak...&#10;Lunar New Year celebrations..."
                            className="w-full h-24 bg-black/45 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all resize-none"
                          />
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setForm(p => ({ ...p, seasons_list: (p.seasons_list || []).filter((_, i) => i !== idx) }))}
                        className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-300 mt-7"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              <Field 
                label="Duration (Nights)" 
                value={form.nights} 
                onChange={(v: string) => setForm((p) => { setIsDirty(true); return { ...p, nights: v }; })} 
                placeholder="e.g. 3" 
                description="Total number of nights spent at hotels/camps on this trip." 
                required 
              />
              <Field 
                label="Duration (Days)" 
                value={form.days} 
                onChange={(v: string) => setForm((p) => { setIsDirty(true); return { ...p, days: v }; })} 
                placeholder="e.g. 4" 
                description="Total duration of the itinerary in days." 
                required 
              />
            </div>
          </section>

          {/* ── SECTION: PROMOTIONS & BADGES ── */}
          <section className="space-y-6 pt-12 border-t border-white/[0.03]">
            <h3 className="text-[10px] font-black tracking-[0.3em] text-white/70 uppercase">
              Badges &amp; Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">Package Badge</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["", "Trending", "Bestseller", "New", "Recommended", "Super Saver"].map((b) => {
                    const isActive = form.badge === b;
                    const label = b || "None";
                    return (
                      <button 
                        key={label} 
                        type="button" 
                        onClick={() => setForm(prev => { setIsDirty(true); return { ...prev, badge: b }; })} 
                        className={`px-3 py-3 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all border ${
                          isActive ? "bg-white/10 border-white text-white" : "bg-white/5 border-white/5 text-white/90 hover:border-white/10"
                        }`}
                      >
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
                    Travelers love seeing a discount! Add a higher &quot;Old Price&quot; to show them exactly how much they&apos;re saving.
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
                onClick={() => setForm((p) => { setIsDirty(true); return { ...p, is_featured: !p.is_featured }; })} 
                className={`relative w-16 h-9 rounded-full transition-all duration-1000 shrink-0 ${
                  form.is_featured ? "bg-amber-500/20 border border-amber-500/20" : "bg-white/5 border border-white/10"
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white/80 shadow-2xl transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  form.is_featured ? "left-[33px]" : "left-1"
                }`} />
              </button>
            </div>
          </section>
        </>
      )}

      {/* ── VIEW: LOGISTICS (Route, Difficulty, Group Size) ── */}
      {(!mode || mode === "logistics") && (
        <section className="space-y-8">
          <h3 className="text-[13px] md:text-[14px] font-bold tracking-[0.2em] text-white/80 uppercase border-b border-white/5 pb-5">
            Group Capacity
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:gap-8 items-end">
              {/* Group Size Toggle + Inputs */}
              <div className="space-y-4">
                {/* Toggle Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">Group Size</span>
                    <span className="text-[10px] text-white/30 font-normal">Show pax range on the package page</span>
                  </div>
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      const isEnabled = form.max_group_size != null;
                      setIsDirty(true);
                      setForm(p => ({
                        ...p,
                        max_group_size: isEnabled ? null : 10,
                        min_group_size: isEnabled ? p.min_group_size : 1,
                      }));
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${
                      form.max_group_size != null ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                        form.max_group_size != null ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Inputs — only visible when toggle is on */}
                {form.max_group_size != null && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">Min Pax</label>
                      <input
                        type="number"
                        min={1}
                        max={form.max_group_size}
                        value={form.min_group_size}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value);
                          const clamped = isNaN(raw) ? 1 : Math.min(form.max_group_size!, Math.max(1, raw));
                          setForm(p => { setIsDirty(true); return { ...p, min_group_size: clamped }; });
                        }}
                        className="w-full h-[48px] px-4 rounded-xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">Max Pax <span className="text-white/20 normal-case tracking-normal">(≤ 20)</span></label>
                      <input
                        type="number"
                        min={form.min_group_size}
                        max={20}
                        value={form.max_group_size}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value);
                          const clamped = isNaN(raw) ? 1 : Math.min(20, Math.max(form.min_group_size || 1, raw));
                          setForm(p => { setIsDirty(true); return { ...p, max_group_size: clamped }; });
                        }}
                        className="w-full h-[48px] px-4 rounded-xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[14px] focus:outline-none focus:border-white/20 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── VIEW: TAXONOMY & DISCOVERY (Only in identity mode) ── */}
      {(!mode || mode === "identity") && (
        <section className="space-y-8 pt-12 border-t border-white/[0.03]">
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
              label="Geographic Region / Circuit" 
              value={form.region} 
              onChange={(v: string) => setForm((p) => { setIsDirty(true); return { ...p, region: v }; })} 
              placeholder="e.g. Bernese Oberland, Ladakh Circuit" 
              description="The specific sub-region or travel circuit of the destination."
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
                        if (e.key === "Enter") {
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
                        const input = document.getElementById("custom-trip-type") as HTMLInputElement;
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

          </div>

          {/* Discovery Themes & Tags */}
          <div className="space-y-4 pt-8 border-t border-white/[0.02]">
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">Discovery Themes &amp; Tags</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {form.tags.map((tag: string) => (
                <span key={tag} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-white/70">
                  {tag}
                  <button 
                    type="button"
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
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !form.tags.includes(val)) {
                      setForm(p => ({ ...p, tags: [...p.tags, val] }));
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
                className="flex-1 h-[52px] px-5 rounded-xl bg-black/40 border border-white/10 text-white text-[13px] focus:outline-none focus:border-white/30 transition-all"
              />
              <button 
                type="button"
                onClick={() => {
                  const input = document.getElementById("new-tag-input") as HTMLInputElement;
                  const val = input.value.trim();
                  if (val && !form.tags.includes(val)) {
                    setForm(p => ({ ...p, tags: [...p.tags, val] }));
                    input.value = "";
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
      )}
    </>
  );
}
