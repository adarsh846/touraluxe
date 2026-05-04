"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/packages", {
      headers: { "x-admin-token": password },
    });

    if (res.ok) {
      sessionStorage.setItem("admin_token", password);
      router.push("/admin/dashboard");
    } else {
      setError(res.status === 401 ? "Invalid password" : "Connection error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="relative block">
            <div className="absolute inset-0 bg-black/70 blur-2xl rounded-full translate-y-4 scale-95 opacity-80" />
            <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-1 scale-90" />
            <div className="relative flex items-center justify-center bg-[#f5f5f7] rounded-full overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] w-28 h-10 transition-all">
              <div className="relative flex items-center justify-center w-28 h-10">
                <Image src="/assets/logo-transparent.webp" alt="TouraLuxe" fill priority className="object-contain scale-[2.1] translate-y-[4px] brightness-[0.05]" />
              </div>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868b] mt-8">Admin Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full pl-5 pr-12 py-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.08] text-white text-[15px] placeholder:text-[#48484a] focus:outline-none focus:border-white/20 transition-all shadow-inner"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#48484a] hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>

          {error && <p className="text-red-400 text-[13px] text-center font-bold">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-4 rounded-2xl bg-white text-black font-black text-[14px] uppercase tracking-widest transition-all hover:bg-[#f5f5f7] disabled:opacity-30 disabled:grayscale active:scale-[0.98] shadow-2xl"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[#48484a] mt-10">Protected area. Authorized personnel only.</p>
      </div>

      <style jsx>{`
        input::-ms-reveal,
        input::-ms-clear {
          display: none;
        }
      `}</style>
    </div>
  );
}
