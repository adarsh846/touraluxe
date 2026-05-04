"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Package } from "@/lib/supabase";

interface Booking {
  id: string;
  created_at: string;
  package_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  traveler_count: number;
  total_amount: number;
  status: string;
  special_requests: string;
  internal_notes?: string;
  booking_source?: string;
}



// --- Helpers ---
const formatSource = (source: string) => {
  if (!source) return "General Inquiry";
  return source
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// --- Sub-components ---

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="p-5 md:p-8 rounded-[24px] md:rounded-[32px] bg-[#1c1c1e] border border-white/[0.04] shadow-sm hover:border-white/[0.1] transition-all">
    <p className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#86868b] mb-2">{label}</p>
    <p className="text-2xl md:text-3xl font-bold text-white tabular-nums tracking-tighter">{value}</p>
  </div>
);

const BookingDetailModal = ({ 
  booking, 
  onClose, 
  onUpdate, 
  isUpdating 
}: { 
  booking: Booking; 
  onClose: () => void; 
  onUpdate: (id: string, updates: Partial<Booking>) => void;
  isUpdating: boolean;
}) => {
  const parts = booking.special_requests?.split('|') || [];
  const dates = parts.find(p => p.includes('Dates:'))?.replace('Dates:', '').trim();
  const dest = parts.find(p => p.includes('Destination:'))?.replace('Destination:', '').trim();
  const coTravelersRaw = parts.find(p => p.includes('Co-Travelers:'))?.replace('Co-Travelers:', '').trim();
  const adults = parts.find(p => p.includes('Adults:'))?.replace('Adults:', '').trim();
  const kids = parts.find(p => p.includes('Kids:'))?.replace('Kids:', '').trim();
  const notes = parts.find(p => p.includes('Notes:'))?.replace('Notes:', '').trim();
  
  let coTravelers: {name: string, age?: string}[] = [];
  try {
    if (coTravelersRaw) coTravelers = JSON.parse(coTravelersRaw).filter((ct: {name: string}) => ct.name.trim() !== "");
  } catch (e) {}

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#1c1c1e] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh]">
        <div className="p-6 md:p-10 flex justify-between items-start border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-white uppercase italic">{booking.package_name}</h2>
            <p className="text-xs tracking-[0.2em] text-white/40 uppercase mt-1">Booking ID: TRX-{booking.id.slice(0, 8).toUpperCase()}</p>
            {booking.booking_source && (
              <span className="inline-block mt-3 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                Source: {formatSource(booking.booking_source)}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] mb-4">Workflow Status</p>
              <div className="grid grid-cols-2 gap-2">
                {['pending', 'confirmed', 'cancelled', 'archived'].map((id) => (
                  <button
                    key={id}
                    onClick={() => onUpdate(booking.id, { status: id })}
                    disabled={isUpdating}
                    className={`w-full px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      booking.status === id
                        ? id === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
                          id === 'cancelled' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]' :
                          id === 'pending' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
                          'bg-white/10 border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                        : 'bg-white/5 border-white/5 text-[#48484a] hover:text-white hover:border-white/10'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/[0.03] flex flex-col justify-between space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] mb-1">Total Est. Cost</p>
                <p className="text-xl md:text-2xl font-bold text-white tracking-tighter">₹{Number(booking.total_amount).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#48484a] mb-1">Travelers</p>
                  <p className="text-xs font-bold text-white">{booking.traveler_count || 1} Guests</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#48484a] mb-1">Timestamp</p>
                  <p className="text-[10px] font-medium text-white/60">{new Date(booking.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/[0.03]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] mb-6 border-b border-white/5 pb-2">Primary Traveler Identity</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-[11px] font-bold uppercase text-[#86868b]">Full Name</span><span className="text-sm text-white font-bold">{booking.customer_name || "Confidential"}</span></div>
              <div className="flex justify-between items-center"><span className="text-[11px] font-bold uppercase text-[#86868b]">Email Address</span><span className="text-sm text-white font-medium lowercase truncate ml-4">{booking.customer_email || "Not Provided"}</span></div>
              <div className="flex justify-between items-center"><span className="text-[11px] font-bold uppercase text-[#86868b]">Mobile Number</span><span className="text-sm text-white font-medium">{booking.customer_phone || "Not Provided"}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] mb-4">Client Vision</p>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[9px] font-bold uppercase text-white/30 block mb-1">Expedition Window</span>
                  <p className="text-sm font-bold text-white italic">{dates && dates !== 'to' ? dates : "Flexible / On Inquiry"}</p>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[9px] font-bold uppercase text-white/30 block mb-1">Target Destination</span>
                  <p className="text-sm font-bold text-white italic">{dest && dest !== 'Not Specified' ? dest : "Undisclosed / Global"}</p>
                </div>
                {coTravelers.length > 0 && (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] font-bold uppercase text-white/30 block mb-2">Manifest: Co-Travelers</span>
                    <div className="flex flex-wrap gap-2">
                      {coTravelers.map((ct, i) => (
                        <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase font-bold tracking-widest text-white/80 border border-white/10">
                          {ct.name} {ct.age ? `(${ct.age}y)` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(adults || kids) && (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex gap-6">
                    {adults && (
                      <div>
                        <span className="text-[9px] font-bold uppercase text-white/30 block mb-1">Adults</span>
                        <p className="text-sm font-bold text-white italic">{adults}</p>
                      </div>
                    )}
                    {kids && (
                      <div>
                        <span className="text-[9px] font-bold uppercase text-white/30 block mb-1">Children</span>
                        <p className="text-sm font-bold text-white italic">{kids}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[9px] font-bold uppercase text-white/30 block mb-1">Desires</span>
                  <p className="text-[13px] text-[#86868b] leading-relaxed italic">{notes || "None provided by client."}</p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/[0.03]">
              <div className="flex items-center justify-between mb-4"><p className="text-[10px] font-bold uppercase text-[#48484a]">Internal Mission Notes</p></div>
              <textarea 
                defaultValue={booking.internal_notes || ""}
                onBlur={(e) => onUpdate(booking.id, { internal_notes: e.target.value })}
                placeholder="Capture private intel..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-5 text-[13px] text-white focus:outline-none focus:border-white/30 transition-all resize-none custom-scrollbar shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [view, setView] = useState<"catalog" | "bookings">("catalog");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getToken = useCallback(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return null; }
    return token;
  }, [router]);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [pkgRes, bookRes] = await Promise.all([
        fetch("/api/packages", { headers: { "x-admin-token": token } }),
        fetch("/api/bookings", { headers: { "x-admin-token": token } }),
      ]);
      if (pkgRes.ok) setPackages(await pkgRes.json());
      if (bookRes.ok) setBookings(await bookRes.json());
    } catch (err) { console.error("Fetch error:", err); }
    setLoading(false);
  }, [getToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Realtime Intelligence Engine ---
  useEffect(() => {
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: '*', table: 'bookings', schema: 'public' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', table: 'packages', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleUpdateBooking = async (id: string, updates: Partial<Booking>) => {
    const token = getToken();
    if (!token) return;
    setIsUpdating(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ id, ...updates })
      });
      if (res.ok) {
        await fetchData();
        if (selectedBooking && selectedBooking.id === id) {
          const result = await res.json();
          setSelectedBooking(result.data[0]);
        }
      }
    } catch (err) { console.error("Update error:", err); }
    setIsUpdating(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const token = getToken();
    if (!token) return;
    setDeleting(id);
    await fetch(`/api/packages/${id}`, { method: "DELETE", headers: { "x-admin-token": token } });
    setPackages((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const handleTogglePublish = async (pkg: Package) => {
    const token = getToken();
    if (!token) return;
    await fetch(`/api/packages/${pkg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ ...pkg, is_published: !pkg.is_published }),
    });
    setPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, is_published: !p.is_published } : p));
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
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
            <div className="relative block">
              {/* iOS Deep Shadow & Glow (Static) */}
              <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
              <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
              
              <div className={`relative flex items-center justify-center bg-[#f5f5f7] rounded-full overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-700 ${isScrolled ? "w-[5.5rem] h-8" : "w-28 h-10"}`}>
                <div className={`relative flex items-center justify-center transition-all duration-500 ${isScrolled ? "w-[5.5rem] h-8" : "w-28 h-10"}`}>
                  <Image 
                    src="/assets/logo-transparent.webp" 
                    alt="TouraLuxe" 
                    fill 
                    priority
                    className="object-contain scale-[2.1] translate-y-[4px] brightness-[0.05]" 
                  />
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 translate-y-[1px]">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 md:gap-8 min-w-0">
            <nav className="flex items-center bg-[#1c1c1e] p-1 rounded-full border border-white/[0.05] shadow-inner shrink-0">
              {["catalog", "bookings"].map((v) => (
                <button 
                  key={v} 
                  onClick={() => setView(v as any)} 
                  className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-[13px] font-black uppercase tracking-widest transition-all ${view === v ? "bg-white text-black shadow-2xl scale-[1.02]" : "text-[#86868b] hover:text-white"}`}
                >
                  {v}
                </button>
              ))}
            </nav>
            <button 
              onClick={() => { sessionStorage.removeItem("admin_token"); router.push("/admin"); }} 
              className="text-[10px] md:text-[13px] font-bold uppercase tracking-widest text-[#86868b] hover:text-red-400 transition-all shrink-0"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-16 animate-in fade-in duration-700">
          {view === "catalog" ? (
            <>
              <StatCard label="Total" value={packages.length} />
              <StatCard label="Live" value={packages.filter(p => p.is_published).length} />
              <StatCard label="Drafts" value={packages.filter(p => !p.is_published).length} />
              <StatCard label="Destinations" value={new Set(packages.map(p => p.location)).size} />
            </>
          ) : (
            <>
              <StatCard label="Bookings" value={bookings.length} />
              <StatCard label="Confirmed" value={bookings.filter(b => b.status === 'confirmed').length} />
              <StatCard label="Revenue" value={`₹${bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0).toLocaleString()}`} />
              <StatCard label="Travelers" value={bookings.reduce((sum, b) => sum + (b.traveler_count || 0), 0)} />
            </>
          )}
        </div>

        {view === "catalog" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight italic">Experience Catalog</h2>
              <button onClick={() => router.push("/admin/packages/new")} className="px-5 py-2.5 rounded-full bg-white text-black text-[12px] md:text-[13px] font-bold">+ New Package</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5 rounded-[24px] bg-[#1c1c1e] border border-white/[0.04] group hover:border-white/[0.08] transition-all">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative w-16 h-16 md:w-20 md:h-14 rounded-2xl overflow-hidden bg-white/5 shrink-0">
                      {pkg.image && <img src={pkg.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] md:text-[17px] font-bold truncate text-white">{pkg.title}</h3>
                      <p className="text-[12px] md:text-[13px] text-[#86868b]">{pkg.location} · {pkg.currency || "₹"}{Number(pkg.price.replace(/[^0-9]/g, "")).toLocaleString('en-IN')}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Array.isArray(pkg.category) ? pkg.category.map((cat) => (
                          <span key={cat} className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/10 text-[9px] font-black uppercase tracking-wider text-white/40">{cat}</span>
                        )) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/10 text-[9px] font-black uppercase tracking-wider text-white/40">{pkg.category || "Uncategorized"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t border-white/5 md:border-0">
                    <button onClick={() => handleTogglePublish(pkg)} className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${pkg.is_published ? "bg-white/5 border-white/10 text-white/60" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>{pkg.is_published ? "Unpublish" : "Publish"}</button>
                    <button onClick={() => router.push(`/admin/packages/${pkg.id}/edit`)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold">Edit</button>
                    <button onClick={() => handleDelete(pkg.id, pkg.title)} className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight italic uppercase mb-8">Flight Manifests</h2>
            
            {/* Mobile Manifest Cards (sm only) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {bookings.map((b) => (
                <div 
                  key={b.id} 
                  onClick={() => setSelectedBooking(b)}
                  className="p-5 rounded-[24px] bg-[#1c1c1e] border border-white/[0.04] active:scale-[0.98] transition-all"
                >
                  {/* Row 1: Date & Status */}
                  <div className="flex justify-between items-start mb-5 pb-4 border-b border-white/5">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#48484a] mb-1.5">Booking Date</p>
                      <p className="text-[13px] text-white font-bold">{new Date(b.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#48484a] mb-1.5 text-right">Status</p>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${b.status === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : b.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>{b.status}</span>
                    </div>
                  </div>

                  <div className="mb-5 flex justify-between items-start">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#48484a] mb-1.5">Division</p>
                      <p className="text-[14px] text-white font-bold italic">{b.package_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#48484a] mb-1.5">Origin</p>
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded border border-white/5">{formatSource((b as any).booking_source)}</span>
                    </div>
                  </div>

                  {/* Row 3: Client & Pricing */}
                  <div className="flex justify-between items-end">
                    <div className="flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#48484a] mb-1.5">Client Name</p>
                      <p className="text-[14px] text-white/90 font-medium truncate pr-4">{b.customer_name || "Confidential"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#48484a] mb-1.5">Total Est. Cost</p>
                      <p className="text-[16px] text-white font-black tabular-nums tracking-tighter">₹{Number(b.total_amount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Manifest Table (md and up) */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar -mx-4 px-4 pb-4">
              <table className="w-full text-left border-separate border-spacing-y-2 table-fixed">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#48484a]">
                    <th className="px-5 w-[14%]">Booking Date</th>
                    <th className="px-5 w-[18%]">Division</th>
                    <th className="px-5 w-[24%]">Client Name</th>
                    <th className="px-5 w-[18%]">Origin</th>
                    <th className="px-5 w-[15%] text-right">Total Est. Cost</th>
                    <th className="px-5 w-[13%] text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} onClick={() => setSelectedBooking(b)} className="group bg-[#1c1c1e] hover:bg-[#2c2c2e] transition-all cursor-pointer shadow-sm">
                      <td className="py-5 px-5 text-[13px] text-[#86868b] font-bold first:rounded-l-[20px] truncate">{new Date(b.created_at).toLocaleDateString()}</td>
                      <td className="py-5 px-5 text-[14px] font-bold text-white truncate">{b.package_name}</td>
                      <td className="py-5 px-5 text-[14px] text-white/90 font-medium truncate">{b.customer_name || "Confidential"}</td>
                      <td className="py-5 px-5 text-[10px] font-black uppercase tracking-widest text-white/30 truncate">
                        <span className="bg-white/5 px-2 py-1 rounded-full border border-white/5">{formatSource((b as any).booking_source)}</span>
                      </td>
                      <td className="py-5 px-5 text-[14px] text-white font-bold text-right tabular-nums whitespace-nowrap">₹{Number(b.total_amount).toLocaleString()}</td>
                      <td className="py-5 px-5 text-center last:rounded-r-[20px] whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${b.status === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : b.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedBooking && <BookingDetailModal booking={selectedBooking} isUpdating={isUpdating} onClose={() => setSelectedBooking(null)} onUpdate={handleUpdateBooking} />}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
