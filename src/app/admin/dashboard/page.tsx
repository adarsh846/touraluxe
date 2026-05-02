"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Package } from "@/lib/supabase";

export default function AdminDashboard() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const getToken = useCallback(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
      return null;
    }
    return token;
  }, [router]);

  const fetchPackages = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const res = await fetch("/api/packages", {
      headers: { "x-admin-token": token },
    });

    if (res.ok) {
      const data = await res.json();
      setPackages(data);
    }
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    const token = getToken();
    if (!token) return;

    setDeleting(id);
    await fetch(`/api/packages/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token },
    });

    setPackages((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const handleTogglePublish = async (pkg: Package) => {
    const token = getToken();
    if (!token) return;

    await fetch(`/api/packages/${pkg.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify({ ...pkg, is_published: !pkg.is_published }),
    });

    setPackages((prev) =>
      prev.map((p) =>
        p.id === pkg.id ? { ...p, is_published: !p.is_published } : p
      )
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative group block">
              <div className="relative flex items-center justify-center bg-[#f5f5f7] rounded-full overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] w-20 md:w-[5.5rem] h-7 md:h-8">
                <div className="relative flex items-center justify-center w-20 md:w-[5.5rem] h-7 md:h-8">
                  <Image
                    src="/assets/logo-transparent.webp"
                    alt="TouraLuxe Logo"
                    fill
                    priority
                    quality={75}
                    sizes="(max-width: 768px) 80px, 88px"
                    className="object-contain scale-[1.8] md:scale-[2.1] translate-y-[1px] md:translate-y-[2.5px] brightness-[0.05]"
                  />
                </div>
              </div>
            </div>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 bg-white/10 px-2 py-1 rounded-full border border-white/10 shadow-sm backdrop-blur-sm">
              Admin
            </span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => router.push("/admin/packages/new")}
              className="hidden sm:block px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white text-black text-[12px] md:text-[13px] font-bold transition-all hover:bg-white/90 active:scale-[0.97]"
            >
              + New Package
            </button>
            <button
              onClick={() => router.push("/admin/packages/new")}
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white text-black text-lg font-bold"
            >
              +
            </button>
            <button
              onClick={handleLogout}
              className="text-[12px] md:text-[13px] font-medium text-[#86868b] hover:text-white transition-colors px-2"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
          {[
            { label: "Total", value: packages.length },
            { label: "Live", value: packages.filter((p) => p.is_published).length },
            { label: "Drafts", value: packages.filter((p) => !p.is_published).length },
            { label: "Destinations", value: new Set(packages.map((p) => p.location)).size },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-[#1c1c1e] border border-white/[0.04] flex flex-col justify-center"
            >
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-[#48484a] mb-1">
                {stat.label}
              </p>
              <p className="text-xl md:text-3xl font-semibold text-white tabular-nums tracking-tight">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-5 md:mb-8">
          <h2 className="text-lg md:text-2xl font-semibold text-white tracking-tight">Experience Catalog</h2>
          <span className="text-[11px] md:text-[12px] text-[#48484a] font-medium">{packages.length} items found</span>
        </div>

        {/* Package List */}
        {packages.length === 0 ? (
          <div className="text-center py-16 md:py-32 rounded-3xl border border-dashed border-white/10">
            <p className="text-[#86868b] text-base md:text-lg mb-6">Your catalog is currently empty.</p>
            <button
              onClick={() => router.push("/admin/packages/new")}
              className="px-6 md:px-8 py-3 md:py-4 rounded-full bg-white text-black font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Launch First Experience
            </button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-4 md:p-5 rounded-2xl md:rounded-3xl bg-[#1c1c1e] border border-white/[0.04] transition-all hover:border-white/[0.1] group"
              >
                {/* Header Row (Mobile Only) / Content Row (Desktop) */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 md:w-24 md:h-16 rounded-xl md:rounded-2xl overflow-hidden bg-white/5 flex-shrink-0 shadow-2xl">
                    {pkg.image && pkg.image !== "/assets/placeholder.webp" ? (
                      <img
                        src={pkg.image}
                        alt={pkg.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#48484a] text-[10px] font-bold uppercase">
                        No IMG
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5 md:mb-1">
                      <h3 className="text-[15px] md:text-[17px] font-semibold text-white truncate leading-tight">
                        {pkg.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          pkg.is_published
                            ? "bg-green-500/5 text-green-400 border-green-500/20"
                            : "bg-amber-500/5 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {pkg.is_published ? "Live" : "Draft"}
                      </span>
                    </div>
                    <p className="text-[12px] md:text-[13px] text-[#86868b] font-medium truncate">
                      <span className="text-white/60">{pkg.location}</span> · {pkg.price} · {pkg.duration}
                    </p>
                  </div>
                </div>

                {/* Actions - Visible on mobile, hover-only on desktop */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-white/[0.05] md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => handleTogglePublish(pkg)}
                    className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[11px] md:text-[12px] font-bold text-[#86868b] hover:text-white hover:bg-white/[0.1] active:scale-95 transition-all"
                  >
                    {pkg.is_published ? "Unpublish" : "Go Live"}
                  </button>
                  <button
                    onClick={() => router.push(`/admin/packages/${pkg.id}/edit`)}
                    className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[11px] md:text-[12px] font-bold text-[#86868b] hover:text-white hover:bg-white/[0.1] active:scale-95 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id, pkg.title)}
                    disabled={deleting === pkg.id}
                    className="px-4 py-2 rounded-xl bg-red-500/[0.06] border border-red-500/[0.06] text-[11px] md:text-[12px] font-bold text-red-400 hover:bg-red-500/[0.15] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {deleting === pkg.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
