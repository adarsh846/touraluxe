"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Package } from "@/lib/supabase";
import { EditorialManager } from "../components/EditorialManager";

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
}

interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "info";
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
    <p className="text-[8px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#86868b] mb-2">{label}</p>
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
    if (coTravelersRaw) coTravelers = JSON.parse(coTravelersRaw).filter((ct: any) => ct.name.trim() !== "");
  } catch (e) {}

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#1c1c1e] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh]">
        <div className="p-6 md:p-10 flex justify-between items-start border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-white uppercase italic">{booking.package_name}</h2>
            <p className="text-xs tracking-[0.2em] text-white/40 uppercase mt-1">Booking ID: TRX-{booking.id.slice(0, 8).toUpperCase()}</p>
            {(booking as any).booking_source && (
              <span className="inline-block mt-3 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                Source: {formatSource((booking as any).booking_source)}
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
  const [view, setView] = useState<"catalog" | "bookings" | "content">("catalog");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [localTax, setLocalTax] = useState("");
  const [localTripTypes, setLocalTripTypes] = useState("");
  const [localDifficulties, setLocalDifficulties] = useState("");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  const addNotification = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

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
      const [pkgRes, bookRes, setRes] = await Promise.all([
        fetch("/api/packages", { headers: { "x-admin-token": token }, cache: "no-store" }),
        fetch("/api/bookings", { headers: { "x-admin-token": token }, cache: "no-store" }),
        fetch("/api/settings", { headers: { "x-admin-token": token }, cache: "no-store" }),
      ]);
      if (pkgRes.ok) setPackages(await pkgRes.json());
      if (bookRes.ok) setBookings(await bookRes.json());
      if (setRes.ok) {
        const data = await setRes.json();
        setSettings(data);
        // Initialize localTax from DB only if it's currently empty
        if (!localTax) {
          setLocalTax(data.tax_percentage || "0");
          setLocalTripTypes(data.available_trip_types || "Group, Private, Custom");
          setLocalDifficulties(data.available_difficulties || "Easy, Moderate, Challenging");
        }
      }
    } catch (err) { console.error("Fetch error:", err); }
    setLoading(false);
  }, [getToken, isUpdatingSettings]);

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
      .on('postgres_changes', { event: 'UPDATE', table: 'site_settings', schema: 'public', filter: 'key=eq.tax_percentage' }, (payload: any) => {
        if (payload.new && payload.new.value) {
          setSettings(prev => ({ ...prev, tax_percentage: payload.new.value }));
        }
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

  const handleUpdateDiscovery = async () => {
    const token = getToken();
    if (!token) return;
    setIsUpdatingSettings(true);
    try {
      await Promise.all([
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": token },
          body: JSON.stringify({ key: "available_trip_types", value: localTripTypes })
        }),
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": token },
          body: JSON.stringify({ key: "available_difficulties", value: localDifficulties })
        })
      ]);
      await fetchData();
    } catch (err) { console.error("Discovery update error:", err); }
    setIsUpdatingSettings(false);
  };

  const handleUpdateTax = async () => {
    const token = getToken();
    if (!token) return;
    setIsUpdatingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ key: "tax_percentage", value: localTax })
      });
      const result = await res.json();
      if (res.ok) {
        setSettings(prev => ({ ...prev, tax_percentage: localTax }));
        await fetchData();
        addNotification("Tax policy updated successfully.", "success");
      } else {
        addNotification(`Update failed: ${result.error || "Unknown error"}`, "error");
      }
    } catch (err) { 
      console.error("Settings update error:", err);
      addNotification("A network error occurred while updating the policy.", "error");
    }
    setIsUpdatingSettings(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const token = getToken();
    if (!token) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/packages/${id}`, { method: "DELETE", headers: { "x-admin-token": token } });
      if (res.ok) {
        setPackages((prev) => prev.filter((p) => p.id !== id));
        addNotification(`${title} deleted successfully.`, "success");
      } else {
        addNotification(`Failed to delete package.`, "error");
      }
    } catch (err) {
      addNotification("Error deleting package.", "error");
    }
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
        />        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between relative z-10 gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-5 min-w-0">
            <div className="relative block shrink-0">
              {/* iOS Deep Shadow & Glow (Static) */}
              <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
              <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
              
              <div className={`relative flex items-center justify-center bg-[#f5f5f7] rounded-full overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-700 ${isScrolled ? "w-[4.2rem] md:w-[5.5rem] h-6 md:h-8" : "w-[4.8rem] md:w-28 h-7.5 md:h-10"}`}>
                <div className={`relative flex items-center justify-center transition-all duration-500 ${isScrolled ? "w-[4.2rem] md:w-[5.5rem] h-6 md:h-8" : "w-[4.8rem] md:w-28 h-7.5 md:h-10"}`}>
                  <Image 
                    src="/assets/logo-transparent.webp" 
                    alt="TouraLuxe" 
                    fill 
                    priority
                    className="object-contain scale-[2.1] translate-y-[3px] md:translate-y-[4px] brightness-[0.05]" 
                  />
                </div>
              </div>
            </div>
            <span className="hidden lg:inline-block text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 translate-y-[1px]">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-8 min-w-0">
            <nav className="flex items-center bg-[#1c1c1e] p-0.5 rounded-full border border-white/[0.05] shadow-inner sm:max-w-none">
              {["catalog", "bookings", "content"].map((v) => (
                <button 
                  key={v} 
                  onClick={() => setView(v as any)} 
                  className={`px-2.5 md:px-6 py-1 md:py-2 rounded-full text-[8.5px] md:text-[13px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === v ? "bg-white text-black shadow-2xl scale-[1.02]" : "text-[#86868b] hover:text-white"}`}
                >
                  {v}
                </button>
              ))}
            </nav>
            <button 
              onClick={() => { sessionStorage.removeItem("admin_token"); router.push("/admin"); }} 
              className="px-2 md:px-0 text-[8.5px] md:text-[13px] font-bold uppercase tracking-widest text-[#86868b] hover:text-red-400 transition-all shrink-0 flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">Logout</span>
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-16 animate-in fade-in duration-700">
          {view === "catalog" ? (
            <>
              <StatCard label="Total Journeys" value={packages.length} />
              <StatCard label="Live on Site" value={packages.filter(p => p.is_published).length} />
              <StatCard label="Draft Items" value={packages.filter(p => !p.is_published).length} />
              <StatCard label="Destinations" value={new Set(packages.map(p => p.location)).size} />
            </>
          ) : (
            <>
              <StatCard label="Total Bookings" value={bookings.length} />
              <StatCard label="Confirmed" value={bookings.filter(b => b.status === 'confirmed').length} />
              <StatCard label="Gross Revenue" value={`₹${bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0).toLocaleString()}`} />
              <StatCard label="Total Travelers" value={bookings.reduce((sum, b) => sum + (b.traveler_count || 0), 0)} />
            </>
          )}
        </div>

        {/* Global Configuration Segment */}
        <div className="mb-10 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="p-4 md:p-8 rounded-[20px] md:rounded-[32px] bg-[#1c1c1e] border border-white/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-[15px] md:text-lg font-bold text-white tracking-tight italic">Global Tax Control</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                  Live: {settings.tax_percentage || "0"}%
                </span>
              </div>
              <p className="text-[9px] md:text-[11px] uppercase tracking-widest text-[#86868b] font-bold">Governs tax-enabled journeys</p>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              <div className="relative group flex-1 md:flex-none">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-white/20 uppercase tracking-widest">GST</span>
                <input 
                  type="number" 
                  value={localTax} 
                  onChange={(e) => setLocalTax(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl py-2.5 md:py-4 pl-12 md:pl-20 pr-7 md:pr-10 text-[12px] md:text-sm font-bold text-white w-full md:w-40 focus:outline-none focus:border-white/30 transition-all text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/40 uppercase tracking-widest">%</span>
              </div>
              <button 
                onClick={handleUpdateTax}
                disabled={isUpdatingSettings}
                className="px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl bg-white text-black text-[9px] md:text-[11px] font-black uppercase tracking-widest hover:bg-[#f5f5f7] active:scale-95 transition-all disabled:opacity-50"
              >
                Sync
              </button>
            </div>
          </div>
        </div>

        {view === "catalog" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight italic">Experience Catalog</h2>
              <div className="flex items-center gap-1.5 md:gap-3">
                <button onClick={() => router.push("/admin/destinations")} className="flex-1 sm:flex-none px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] md:text-[13px] font-bold hover:bg-white/10 transition-all whitespace-nowrap">Destinations</button>
                <button onClick={() => router.push("/admin/batch-dates")} className="flex-1 sm:flex-none px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] md:text-[13px] font-bold hover:bg-white/10 transition-all whitespace-nowrap">Batches</button>
                <button onClick={() => router.push("/admin/packages/new")} className="flex-[1.2] sm:flex-none px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-white text-black text-[10px] md:text-[13px] font-bold whitespace-nowrap">+ New</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {packages.map((pkg) => {
                const isExclusive = pkg.tax_status === "Exclusive of Taxes";
                return (
                  <div key={pkg.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5 rounded-[24px] bg-[#1c1c1e] border border-white/[0.04] group hover:border-white/[0.08] transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative w-16 h-16 md:w-20 md:h-14 rounded-2xl overflow-hidden bg-white/5 shrink-0">
                        {pkg.image && <img src={pkg.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] md:text-[17px] font-bold truncate text-white">{pkg.title}</h3>
                        <p className="text-[12px] md:text-[13px] text-[#86868b]">
                          {pkg.location} · {(() => {
                            const base = parseInt(pkg.price.replace(/[^0-9]/g, "")) || 0;
                            const taxRate = parseFloat(settings.tax_percentage || "0");
                            // MASTER REFLECTION: Dashboard must show the SAME price as the live site.
                            const finalPrice = isExclusive && taxRate > 0 ? base + (base * taxRate / 100) : base;
                            return `${pkg.currency || "₹"}${Math.round(finalPrice).toLocaleString('en-IN')}`;
                          })()}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Array.isArray(pkg.category) ? pkg.category.map((cat) => (
                          <span key={cat} className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/10 text-[9px] font-black uppercase tracking-wider text-white/40">{cat}</span>
                        )) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/10 text-[9px] font-black uppercase tracking-wider text-white/40">{pkg.category || "Uncategorized"}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${isExclusive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"}`}>
                          {isExclusive ? "+ TAX" : "INCL. TAX"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t border-white/5 md:border-0">
                    <button onClick={() => handleTogglePublish(pkg)} className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${pkg.is_published ? "bg-white/5 border-white/10 text-white/60" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>{pkg.is_published ? "Unpublish" : "Publish"}</button>
                    <button onClick={() => router.push(`/admin/packages/${pkg.id}/edit`)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold">Edit</button>
                    <button onClick={() => handleDelete(pkg.id, pkg.title)} className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        ) : view === "bookings" ? (
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
                    <th className="px-5 w-[12%]">Booking Date</th>
                    <th className="px-5 w-[16%]">Division</th>
                    <th className="px-5 w-[20%]">Client Name</th>
                    <th className="px-5 w-[24%]">Origin</th>
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
                      <td className="py-5 px-5 text-[10px] font-black uppercase tracking-widest text-white/30">
                        <span className="bg-white/5 px-2.5 py-1.5 rounded-full border border-white/5 whitespace-nowrap">{formatSource((b as any).booking_source)}</span>
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
        ) : (
          <EditorialManager 
            settings={settings} 
            isUpdating={isUpdatingSettings} 
            addNotification={addNotification}
            onUpdate={async (key, value) => {
              const token = getToken();
              if (!token) return;
              setIsUpdatingSettings(true);
              try {
                const res = await fetch("/api/settings", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", "x-admin-token": token },
                  body: JSON.stringify({ key, value })
                });
                if (res.ok) {
                  setSettings(prev => ({ ...prev, [key]: value }));
                  addNotification(`${key.replace(/_/g, ' ')} updated successfully.`, "success");
                } else {
                  addNotification("Failed to update setting.", "error");
                }
              } catch (err) {
                addNotification("Network error occurred.", "error");
              }
              setIsUpdatingSettings(false);
            }}
          />
        )}
      </main>

      {selectedBooking && <BookingDetailModal booking={selectedBooking} isUpdating={isUpdating} onClose={() => setSelectedBooking(null)} onUpdate={handleUpdateBooking} />}

      {/* Dynamic Island Notification System */}
      <div className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none w-full max-w-[350px] md:max-w-[450px] px-4">
        {notifications.map((n) => (
          <div 
            key={n.id} 
            className={`pointer-events-auto flex items-start gap-3 px-5 py-3 rounded-2xl backdrop-blur-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-8 zoom-in-95 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              n.type === "success" ? "bg-black/90 border-emerald-500/30 text-emerald-400" :
              n.type === "error" ? "bg-black/90 border-rose-500/30 text-rose-400" :
              "bg-black/90 border-white/10 text-white"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
              n.type === "success" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" :
              n.type === "error" ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" :
              "bg-white/40"
            }`} />
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] leading-relaxed break-words">{n.message}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
