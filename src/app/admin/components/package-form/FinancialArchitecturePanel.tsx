"use client";

import type { PanelProps } from "./types";
import { Field, SegmentedControl } from "../PackageForm";
import { usePricing } from "@/hooks/usePricing";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

export function FinancialArchitecturePanel({ form, setForm, setIsDirty }: PanelProps) {
  const { computePrice } = usePricing();

  return (
    <>
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
                onChange={(v: string) => setForm(p => { setIsDirty(true); return { ...p, currency: v }; })} 
                options={[{ label: "₹ INR", value: "₹" }, { label: "$ USD", value: "$" }, { label: "€ EUR", value: "€" }]} 
                description="Global currency for this specific journey."
              />
              <Field 
                label="Original Price (Before Discount)" 
                value={String(form.original_price)} 
                onChange={(v: string) => setForm((p) => { setIsDirty(true); return { ...p, original_price: v }; })} 
                placeholder="e.g. 95,000" 
                description="The previous, higher price before sale. Leave blank if there's no discount."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SegmentedControl 
                label="Airfare Status" 
                value={form.flights_status} 
                onChange={(v: string) => setForm(p => { setIsDirty(true); return { ...p, flights_status: v as any }; })} 
                options={[
                  { label: "Excluded", value: "excluded" },
                  { label: "Included", value: "included" },
                  { label: "On Request", value: "on_request" }
                ]} 
              />
              <Field 
                label="Base Land Cost (per Adult)" 
                value={String(form.price)} 
                onChange={(v: string) => setForm((p) => { setIsDirty(true); return { ...p, price: v }; })} 
                placeholder="e.g. 80,000" 
                description="The core package cost per adult. Taxes and flight estimates will be added to this."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Child Price (Base Land Cost)" value={String(form.child_price)} onChange={(v: string) => setForm((p) => { setIsDirty(true); return { ...p, child_price: v }; })} placeholder="e.g. 40,000" description="Optional base land cost per child (ages 2-12). If empty, adult base applies." />
              <Field label="Infant Price (Base Land Cost)" value={String(form.infant_price)} onChange={(v: string) => setForm((p) => { setIsDirty(true); return { ...p, infant_price: v }; })} placeholder="e.g. 15,000" description="Optional base land cost per infant (under 2 years). If empty, adult base applies." />
            </div>

            {/* Pricing Terms & Notes */}
            <div className="space-y-2 pt-4">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
                Pricing Terms &amp; Notes (Speech Bubble)
              </label>
              <textarea
                className="w-full h-24 bg-[#1c1c1e] border border-white/[0.06] rounded-xl md:rounded-2xl p-4 text-[13px] text-white focus:border-white/20 transition-all outline-none resize-y"
                placeholder="e.g. Flight estimates are subject to airline fare fluctuations. Land rate is inclusive of 5% GST."
                value={form.pricing_note || ""}
                onChange={(e) => {
                  setIsDirty(true);
                  setForm((p) => ({ ...p, pricing_note: e.target.value }));
                }}
              />
              <p className="text-[10px] text-white/50 italic font-medium leading-tight px-1">
                Add optional terms &amp; conditions or helper notes for this package&apos;s pricing breakdown (e.g. tax statements, inclusions details). This displays in the Speech Bubble details popover.
              </p>
            </div>

            {/* Configurable Flight Terms and Conditions */}
            <div className="space-y-2 pt-4">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
                Flight Inclusions & Terms (Speech Bubble)
              </label>
              <textarea
                value={form.flight_terms || ""}
                onChange={(e) => setForm((p) => { setIsDirty(true); return { ...p, flight_terms: e.target.value }; })}
                placeholder="• Economy class return airfare from designated hub is fully covered.&#10;• Premium Economy/Business Class upgrades available upon custom quote.&#10;• Baggage allowance is subject to airline default policies (typically 20-30kg)."
                rows={4}
                className="w-full p-4 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-white text-[15px] placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all font-mono resize-y"
              />
              <p className="text-[10px] text-white/50 italic font-medium leading-tight px-1">
                Configure the custom terms displayed in the interactive flight Speech Bubble popover. Enter each point on a new line starting with • or normal bullets.
              </p>
            </div>

            {form.flights_status !== "excluded" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                
                {/* Route Points */}
                <div className="space-y-4 pb-8 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2 text-[10px] text-white/30 italic">
                    <span>✈️</span>
                    {form.flight_type?.toLowerCase().includes("round") ? (
                      <span>Round-Trip — only the <span className="text-white/50 font-semibold not-italic">departure hub</span> is needed. The return arrival mirrors it automatically.</span>
                    ) : form.flight_type?.toLowerCase().includes("one") ? (
                      <span>One-Way — set both the <span className="text-white/50 font-semibold not-italic">departure</span> and <span className="text-white/50 font-semibold not-italic">arrival</span> airports.</span>
                    ) : form.flight_type?.toLowerCase().includes("multi") ? (
                      <span>Multi-City — set the <span className="text-white/50 font-semibold not-italic">first departure</span> and <span className="text-white/50 font-semibold not-italic">final arrival</span> airports.</span>
                    ) : (
                      <span>Set the flight route points.</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {/* Starting City */}
                    <Field
                      label="Starting City / Airport"
                      value={form.route_start}
                      onChange={(v: string) => {
                        const isRoundTrip = form.flight_type?.toLowerCase().includes("round");
                        setForm((p) => ({
                          ...p,
                          route_start: v,
                          route_end: isRoundTrip ? v : p.route_end,
                        }));
                        setIsDirty(true);
                      }}
                      placeholder="e.g. Delhi Airport (DEL)"
                      description="The departure hub for this tour."
                    />

                    {/* Ending City */}
                    {form.flight_type?.toLowerCase().includes("round") ? (
                      <div className="flex flex-col justify-end pb-2">
                        <span className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Ending City / Airport</span>
                        <div className="h-[56px] px-4 rounded-xl md:rounded-2xl bg-[#1c1c1e] border border-white/[0.06] flex items-center gap-2">
                          <span className="text-[12px] text-white/30 italic">Mirrors departure</span>
                          {form.route_start && (
                            <span className="text-[12px] text-white/50 font-bold">— {form.route_start}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/20 mt-1.5 px-1 italic">Auto-set for round trips</p>
                      </div>
                    ) : (
                      <Field
                        label="Ending City / Airport"
                        value={form.route_end}
                        onChange={(v: string) => { setIsDirty(true); setForm((p) => ({ ...p, route_end: v })); }}
                        placeholder="e.g. Leh Airport (IXL)"
                        description="The final arrival/drop point of this tour."
                      />
                    )}
                  </div>
                </div>

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
                        onChange={(v: string) => setForm(p => ({ ...p, flight_price_child: v || " " }))} 
                        placeholder="e.g. 60,000" 
                        description="Estimated flight cost per child traveler."
                      />
                      <Field 
                        label="Custom Infant Airfare" 
                        value={form.flight_price_infant.trim()} 
                        onChange={(v: string) => setForm(p => ({ ...p, flight_price_infant: v || " " }))} 
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
                          onClick={() => {
                            const isRoundTrip = preset.toLowerCase().includes("round");
                            setForm(p => ({
                              ...p,
                              flight_type: preset,
                              route_end: isRoundTrip ? p.route_start : p.route_end
                            }));
                            setIsDirty(true);
                          }}
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
                    onChange={(e) => {
                      const val = e.target.value;
                      const isRoundTrip = val.toLowerCase().includes("round");
                      setForm((p) => ({
                        ...p,
                        flight_type: val,
                        route_end: isRoundTrip ? p.route_start : p.route_end
                      }));
                      setIsDirty(true);
                    }}
                  />
                </div>

                {/* Departure Hubs */}
                <div className="space-y-4 pt-6 border-t border-white/[0.05]">
                  <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white/90">Departure Hubs</label>
                  <div className="flex flex-wrap gap-2">
                    {form.departure_cities.map((city: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-white flex items-center gap-2">
                        {city}
                        <button type="button" onClick={() => setForm(p => ({ ...p, departure_cities: p.departure_cities.filter((_: any, idx: number) => idx !== i) }))} className="text-white/90 hover:text-white transition-colors">×</button>
                      </span>
                    ))}
                    <input 
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
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
            )}
          </div>

          <div className="space-y-6 md:space-y-8 h-full">
            <Field 
              label="Customer Price (Actual)" 
              value={String(form.price)} 
              onChange={(v: string) => setForm((p) => { setIsDirty(true); return { ...p, price: v }; })} 
              placeholder="e.g. 79,000" 
              description="The final price travelers will see and pay."
              required 
            />
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
                        <span>Tour &amp; Services:</span>
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
                  : "We&apos;ll add GST on top of this price."}
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
                onClick={() => setForm((p) => { setIsDirty(true); return { ...p, tax_status: p.tax_status === "Inclusive of Taxes" ? "Exclusive of Taxes" : "Inclusive of Taxes" }; })} 
                className={`relative w-16 h-9 rounded-full transition-all duration-1000 shrink-0 ${
                  form.tax_status === "Exclusive of Taxes" ? "bg-emerald-500/20 border border-emerald-500/20" : "bg-blue-500/20 border border-blue-500/20"
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white/80 shadow-2xl transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  form.tax_status === "Exclusive of Taxes" ? "left-[33px]" : "left-1"
                }`} />
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
              Dynamic Comfort Tiers &amp; Logistics Configurator
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
                      hotels: [],
                      pdf_url: ""
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
                <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Accommodation &amp; Price Tiers</span>
                <button 
                  type="button" 
                  onClick={() => setForm(p => ({
                    ...p,
                    tiers: [...p.tiers, { name: `Tier ${p.tiers.length + 1}`, price_grid: [], hotels: [], pdf_url: "" }]
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
                        
                        {/* PDF Flyer */}
                        <div>
                          <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Digital Itinerary Flyer (PDF)</label>
                          <div className="flex flex-col gap-2">
                            <input 
                              className="w-full h-9 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[11px] text-white/70 transition-all outline-none"
                              value={tier.pdf_url || ""}
                              onChange={(e) => {
                                setIsDirty(true);
                                const nextTiers = [...form.tiers];
                                nextTiers[tIdx].pdf_url = e.target.value;
                                setForm(p => ({ ...p, tiers: nextTiers }));
                              }}
                              placeholder="PDF URL for this comfort tier..."
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
    </>
  );
}
