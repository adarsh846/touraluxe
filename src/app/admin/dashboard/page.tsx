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
    <div className="min-h-screen bg-black">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group block">
              <div className="relative flex items-center justify-center bg-[#f5f5f7] rounded-full overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] w-[5.5rem] h-8">
                <div className="relative flex items-center justify-center w-[5.5rem] h-8">
                  <Image
                    src="/assets/logo-transparent.webp"
                    alt="TouraLuxe Logo"
                    fill
                    priority
                    quality={75}
                    sizes="88px"
                    className="object-contain scale-[2.1] translate-y-[2.5px] brightness-[0.05]"
                  />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/packages/new")}
              className="px-4 py-1.5 rounded-lg bg-white text-black text-[13px] font-semibold transition-all hover:bg-white/90 active:scale-[0.97]"
            >
              + New Package
            </button>
            <button
              onClick={handleLogout}
              className="text-[13px] text-[#86868b] hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Packages", value: packages.length },
            { label: "Published", value: packages.filter((p) => p.is_published).length },
            { label: "Drafts", value: packages.filter((p) => !p.is_published).length },
            { label: "Locations", value: new Set(packages.map((p) => p.location)).size },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-2xl bg-[#1c1c1e] border border-white/[0.04]"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#48484a] mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Heading */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">All Packages</h2>
        </div>

        {/* Package List */}
        {packages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#48484a] text-lg mb-4">No packages yet</p>
            <button
              onClick={() => router.push("/admin/packages/new")}
              className="px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm transition-all hover:bg-white/90"
            >
              Create Your First Package
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center gap-5 p-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.04] transition-all hover:border-white/[0.08] group"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                  {pkg.image && pkg.image !== "/assets/placeholder.webp" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pkg.image}
                      alt={pkg.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#48484a] text-xs">
                      No img
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-medium text-white truncate">
                      {pkg.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        pkg.is_published
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {pkg.is_published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#86868b] mt-0.5">
                    {pkg.location} · {pkg.price} · {pkg.duration}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleTogglePublish(pkg)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.06] text-[12px] text-[#86868b] hover:text-white hover:bg-white/[0.1] transition-all"
                  >
                    {pkg.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => router.push(`/admin/packages/${pkg.id}/edit`)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.06] text-[12px] text-[#86868b] hover:text-white hover:bg-white/[0.1] transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id, pkg.title)}
                    disabled={deleting === pkg.id}
                    className="px-3 py-1.5 rounded-lg bg-red-500/[0.06] border border-red-500/[0.06] text-[12px] text-red-400 hover:bg-red-500/[0.15] transition-all disabled:opacity-50"
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
