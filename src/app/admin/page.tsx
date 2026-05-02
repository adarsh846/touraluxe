"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Verify password by making a test API call
    const res = await fetch("/api/packages", {
      headers: { "x-admin-token": password },
    });

    if (res.ok) {
      // Store in sessionStorage (cleared on tab close)
      sessionStorage.setItem("admin_token", password);
      router.push("/admin/dashboard");
    } else {
      if (res.status === 401) {
        setError("Invalid password");
      } else {
        const data = await res.json();
        setError(data.error || "Server connection error");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative group block">
            {/* iOS 26 Deep Shadow & Glow */}
            <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
            <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />

            <div className="relative flex items-center justify-center bg-[#f5f5f7] rounded-full overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] w-28 h-10">
              <div className="relative flex items-center justify-center w-28 h-10">
                <Image
                  src="/assets/logo-transparent.webp"
                  alt="TouraLuxe Logo"
                  fill
                  priority
                  quality={75}
                  sizes="112px"
                  className="object-contain scale-[2.1] translate-y-[4px] brightness-[0.05]"
                />
              </div>
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b] mt-8">
            Admin Dashboard
          </p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 rounded-xl bg-[#1c1c1e] border border-white/[0.08] text-white text-[15px] placeholder:text-[#48484a] focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold text-[15px] transition-all hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-[#48484a] mt-8">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
