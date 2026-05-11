"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Package, BatchDate } from "@/lib/supabase";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  filling_fast: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  sold_out: "bg-red-500/10 border-red-500/20 text-red-400",
  completed: "bg-white/5 border-white/10 text-white/30",
};

export default function BatchDateManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageIdParam = searchParams.get("package");

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>(packageIdParam || "");
  const [batches, setBatches] = useState<BatchDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New batch form
  const [newBatch, setNewBatch] = useState({
    start_date: "",
    end_date: "",
    status: "available",
    slots_total: 20,
    slots_booked: 0,
    price_override: "",
    notes: "",
  });

  const getToken = useCallback(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return ""; }
    return token;
  }, [router]);

  // Fetch packages for dropdown
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/packages", { headers: { "x-admin-token": token }, cache: "no-store" })
      .then(res => res.json())
      .then(data => { setPackages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [getToken]);

  // Fetch batch dates when package changes
  useEffect(() => {
    if (!selectedPackage) { setBatches([]); return; }
    const token = getToken();
    if (!token) return;
    fetch(`/api/batch-dates?package_id=${selectedPackage}`, { headers: { "x-admin-token": token }, cache: "no-store" })
      .then(res => res.json())
      .then(data => setBatches(Array.isArray(data) ? data : []))
      .catch(() => setBatches([]));
  }, [selectedPackage, getToken]);

  const handleAddBatch = async () => {
    if (!selectedPackage || !newBatch.start_date || !newBatch.end_date) return;
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch("/api/batch-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ ...newBatch, package_id: selectedPackage }),
      });
      if (res.ok) {
        const data = await res.json();
        setBatches(prev => [...prev, data].sort((a, b) => a.start_date.localeCompare(b.start_date)));
        setNewBatch({ start_date: "", end_date: "", status: "available", slots_total: 20, slots_booked: 0, price_override: "", notes: "" });
      }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const token = getToken();
    if (!token) return;
    const batch = batches.find(b => b.id === id);
    if (!batch) return;
    try {
      const res = await fetch("/api/batch-dates", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ ...batch, id, status }),
      });
      if (res.ok) setBatches(prev => prev.map(b => b.id === id ? { ...b, status: status as BatchDate["status"] } : b));
    } catch (err) { console.error(err); }
  };

  const handleUpdateSlots = async (id: string, slots_booked: number) => {
    const token = getToken();
    if (!token) return;
    const batch = batches.find(b => b.id === id);
    if (!batch) return;
    try {
      const res = await fetch("/api/batch-dates", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ ...batch, id, slots_booked }),
      });
      if (res.ok) setBatches(prev => prev.map(b => b.id === id ? { ...b, slots_booked } : b));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this batch date?")) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/batch-dates?id=${id}`, { method: "DELETE", headers: { "x-admin-token": token } });
      if (res.ok) setBatches(prev => prev.filter(b => b.id !== id));
    } catch (err) { console.error(err); }
  };

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 bg-black/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin/dashboard" className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">← Dashboard</a>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">Batch Dates</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 pt-28 pb-16">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-2">Departure Calendar</h1>
        <p className="text-white/30 text-sm mb-12">Manage fixed departure dates, availability, and slot inventory for your packages.</p>

        {/* Package Selector */}
        <div className="p-6 md:p-8 rounded-[32px] bg-[#1c1c1e] border border-white/[0.04] mb-12">
          <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#48484a] mb-4">Select Package</label>
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="w-full h-[56px] px-6 rounded-2xl bg-black border border-white/[0.08] text-white text-[15px] focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
          >
            <option value="">— Choose a package —</option>
            {packages.map(pkg => (
              <option key={pkg.id} value={pkg.id}>{pkg.title} ({pkg.duration})</option>
            ))}
          </select>
        </div>

        {selectedPackage && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <StatCard label="Total Batches" value={batches.length} />
              <StatCard label="Available" value={batches.filter(b => b.status === "available").length} />
              <StatCard label="Filling Fast" value={batches.filter(b => b.status === "filling_fast").length} />
              <StatCard label="Sold Out" value={batches.filter(b => b.status === "sold_out").length} />
            </div>

            {/* Add New Batch */}
            <div className="p-6 md:p-8 rounded-[32px] bg-[#1c1c1e] border border-white/[0.04] mb-12 space-y-6">
              <h3 className="text-lg font-bold text-white tracking-tight">Add Departure Batch</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Start Date</label>
                  <input type="date" value={newBatch.start_date} onChange={(e) => setNewBatch(p => ({ ...p, start_date: e.target.value }))} className="w-full h-[48px] px-4 rounded-xl bg-black border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/20 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#48484a]">End Date</label>
                  <input type="date" value={newBatch.end_date} onChange={(e) => setNewBatch(p => ({ ...p, end_date: e.target.value }))} className="w-full h-[48px] px-4 rounded-xl bg-black border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/20 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Total Slots</label>
                  <input type="number" value={newBatch.slots_total} onChange={(e) => setNewBatch(p => ({ ...p, slots_total: parseInt(e.target.value) || 20 }))} className="w-full h-[48px] px-4 rounded-xl bg-black border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Price Override</label>
                  <input type="text" value={newBatch.price_override} onChange={(e) => setNewBatch(p => ({ ...p, price_override: e.target.value }))} placeholder="Leave blank for default" className="w-full h-[48px] px-4 rounded-xl bg-black border border-white/[0.08] text-white text-sm placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Notes (Internal)</label>
                <input type="text" value={newBatch.notes} onChange={(e) => setNewBatch(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Peak season, special group..." className="w-full h-[48px] px-4 rounded-xl bg-black border border-white/[0.08] text-white text-sm placeholder:text-[#3a3a3c] focus:outline-none focus:border-white/20 transition-all" />
              </div>
              <button onClick={handleAddBatch} disabled={saving || !newBatch.start_date || !newBatch.end_date} className="px-8 py-3 rounded-full bg-white text-black text-[12px] font-bold uppercase tracking-wider hover:bg-[#f5f5f7] active:scale-95 transition-all disabled:opacity-50">
                {saving ? "Adding..." : "+ Add Batch"}
              </button>
            </div>

            {/* Batch List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white tracking-tight mb-6">
                {selectedPkg ? `Departures for "${selectedPkg.title}"` : "Departures"}
              </h3>
              {batches.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-white/20 text-sm">No batch dates yet. Add one above.</p>
                </div>
              ) : (
                batches.map(batch => {
                  const startDate = new Date(batch.start_date);
                  const endDate = new Date(batch.end_date);
                  const isPast = endDate < new Date();
                  const slotsLeft = batch.slots_total - batch.slots_booked;
                  const fillPercent = batch.slots_total > 0 ? (batch.slots_booked / batch.slots_total) * 100 : 0;

                  return (
                    <div key={batch.id} className={`p-5 md:p-6 rounded-[24px] bg-[#1c1c1e] border border-white/[0.04] ${isPast ? "opacity-50" : ""} hover:border-white/[0.08] transition-all`}>
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Date Block */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/[0.06] shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{startDate.toLocaleDateString("en", { month: "short" })}</span>
                            <span className="text-2xl font-bold text-white leading-none">{startDate.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-white">
                              {startDate.toLocaleDateString("en", { day: "numeric", month: "short" })} → {endDate.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${STATUS_COLORS[batch.status] || STATUS_COLORS.available}`}>
                                {batch.status.replace("_", " ")}
                              </span>
                              <span className="text-[11px] text-white/40">
                                {slotsLeft} of {batch.slots_total} slots left
                              </span>
                              {batch.price_override && (
                                <span className="text-[11px] text-blue-400/60">₹{batch.price_override}</span>
                              )}
                            </div>
                            {batch.notes && <p className="text-[11px] text-white/20 mt-1 italic">{batch.notes}</p>}
                            {/* Progress Bar */}
                            <div className="mt-2 w-full max-w-[200px] h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${fillPercent > 80 ? "bg-red-400" : fillPercent > 50 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${fillPercent}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 md:pt-0 border-t border-white/5 md:border-0 flex-wrap">
                          {/* Status toggles */}
                          {["available", "filling_fast", "sold_out"].map(st => (
                            <button key={st} onClick={() => handleUpdateStatus(batch.id, st)} className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border ${batch.status === st ? STATUS_COLORS[st] : "bg-white/[0.02] border-white/5 text-white/20 hover:text-white/40"}`}>
                              {st.replace("_", " ")}
                            </button>
                          ))}
                          {/* Slots +/- */}
                          <div className="flex items-center gap-1 ml-2">
                            <button onClick={() => handleUpdateSlots(batch.id, Math.max(0, batch.slots_booked - 1))} className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.06] text-white/40 hover:text-white text-sm font-bold transition-all">−</button>
                            <span className="text-[12px] font-bold text-white tabular-nums w-8 text-center">{batch.slots_booked}</span>
                            <button onClick={() => handleUpdateSlots(batch.id, Math.min(batch.slots_total, batch.slots_booked + 1))} className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.06] text-white/40 hover:text-white text-sm font-bold transition-all">+</button>
                          </div>
                          {/* Delete */}
                          <button onClick={() => handleDelete(batch.id)} className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all ml-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
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
