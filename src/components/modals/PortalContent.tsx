"use client";

import { useState, useEffect } from "react";
import { useAuth, Profile } from "@/components/AuthProvider";
import { 
  User, Mail, Phone, MapPin, Utensils, Crown, LogOut, 
  Loader2, Check, Compass, Calendar, AlertCircle, FileText, Send,
  Globe, Heart, ChevronDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function PortalContent({ isActive, onScroll }: { isActive: boolean; onScroll: (scrolled: boolean) => void }) {
  const { user, profile, loading: authLoading, signInWithOtp, signInWithGoogle, signOut, updateProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Traveler preferences form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [dietary, setDietary] = useState("");
  const [travelClass, setTravelClass] = useState<'Economy' | 'Premium Economy' | 'Business' | 'First'>("Economy");
  
  // Standard travel industry states
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [nationality, setNationality] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Bookings list state
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Background image from admin
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Sync preferences state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setDepartureCity(profile.departure_city || "");
      setDietary(profile.dietary_preferences || "");
      setTravelClass(profile.travel_class || "Economy");
      setDateOfBirth(profile.date_of_birth || "");
      setGender(profile.gender || "");
      setPassportNumber(profile.passport_number || "");
      setPassportExpiry(profile.passport_expiry || "");
      setNationality(profile.nationality || "");
      setEmergencyContactName(profile.emergency_contact_name || "");
      setEmergencyContactPhone(profile.emergency_contact_phone || "");
    }
  }, [profile]);

  // Fetch bookings when user logs in and subscribe to real-time changes
  useEffect(() => {
    let isMounted = true;
    let fallbackTimeout: NodeJS.Timeout;

    const fetchUserBookings = async (isBackgroundRefresh = false) => {
      if (!user) return;
      
      // Only show the hard loading spinner if we don't already have data
      if (!isBackgroundRefresh) {
        setBookingsLoading(true);
        // Safety fallback: if Supabase hangs for more than 5 seconds, forcefully clear loading state
        fallbackTimeout = setTimeout(() => {
          if (isMounted) setBookingsLoading(false);
        }, 5000);
      }

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
          // Cache-buster: Use a TEXT column (customer_name) to avoid Postgres UUID casting crashes
          .neq("customer_name", `CACHE_BUST_${Date.now()}`)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Fetch bookings error from Supabase:", error);
        } else if (data && isMounted) {
          setBookings(data);
        }
      } catch (err) {
        console.warn("Fetch bookings unexpected error:", err);
      } finally {
        if (!isBackgroundRefresh && isMounted) {
          clearTimeout(fallbackTimeout);
          setBookingsLoading(false);
        }
      }
    };

    let channel: any = null;

    if (user && isActive) {
      fetchUserBookings(false);

      // Realtime Authority 1: Subscribe to any changes in bookings (broad scope, relies on RLS)
      channel = supabase
        .channel('portal_bookings_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'bookings'
          }, 
          () => {
            fetchUserBookings(true); // Silent background refresh
          }
        )
        .subscribe();

      // Realtime Authority 2: Apple-tier fallback background sync
      // Guarantee UI is never stale even if WebSockets drop or Postgres publications are disabled
      const syncInterval = setInterval(() => {
        if (isMounted) fetchUserBookings(true);
      }, 10000); // 10s silent polling

      // Realtime Authority 3: Instantly sync when the user switches back to this tab
      const handleVisibilityChange = () => {
        if (!document.hidden && isMounted) {
          fetchUserBookings(true);
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        isMounted = false;
        clearTimeout(fallbackTimeout);
        clearInterval(syncInterval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
    };
  }, [user, isActive]);

  // Fetch admin-controlled portal background
  useEffect(() => {
    const cached = localStorage.getItem('tr_portal_atmosphere');
    if (cached) setBgImage(cached);

    fetch("/api/settings", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (data.portal_default_image) {
          setBgImage(data.portal_default_image);
          localStorage.setItem('tr_portal_atmosphere', data.portal_default_image);
        }
      })
      .catch(() => {});
  }, []);

  // Track scroll position to update headers
  useEffect(() => {
    const container = document.getElementById("portal-scroll-container");
    if (!container) return;

    const handleScrollEvent = () => {
      onScroll(container.scrollTop > 10);
    };

    container.addEventListener("scroll", handleScrollEvent);
    return () => container.removeEventListener("scroll", handleScrollEvent);
  }, [isActive, onScroll]);

  // Handle Login OTP submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setSuccess("");

    const { error: otpError } = await signInWithOtp(email);
    setLoading(false);

    if (otpError) {
      setError(otpError.message || "Failed to send magic link");
    } else {
      setOtpSent(true);
      setSuccess("Magic link has been dispatched to your inbox!");
    }
  };

  // Handle Google Login submission
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        setError(googleError.message || "Failed to initiate Google sign-in");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during Google sign-in");
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { error: updateError } = await updateProfile({
      full_name: fullName,
      phone,
      departure_city: departureCity,
      dietary_preferences: dietary,
      travel_class: travelClass,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      passport_number: passportNumber || null,
      passport_expiry: passportExpiry || null,
      nationality: nationality || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message || "Failed to save preferences");
    } else {
      setSuccess("Your preferences have been securely saved!");
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  if (!isActive) return null;

  return (
    <div 
      id="portal-scroll-container"
      className="relative w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide text-white selection:bg-white/20 selection:text-white"
    >
      {/* ADMIN-CONTROLLED CINEMATIC BACKGROUND */}
      {bgImage && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img
            src={bgImage}
            onLoad={() => setBgLoaded(true)}
            alt=""
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-[opacity,filter] duration-[1400ms] ease-out brightness-[0.55] transform-gpu",
              bgLoaded ? "opacity-100 blur-0" : "opacity-0 blur-xl"
            )}
            style={{ transform: "translate3d(0,0,0)" }}
          />
          {/* Luxury vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#020202] opacity-90" />
          {/* Grain */}
          <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        </div>
      )}
      {/* Dark fallback when no image */}
      {!bgImage && <div className="fixed inset-0 z-0 bg-[#020202] pointer-events-none" />}

      {/* Scrollable content above background */}
      <div className="relative z-10 pt-28 pb-20 px-6 sm:px-12 md:px-20">
      <div className="max-w-[1100px] mx-auto space-y-16 animate-in fade-in duration-700">
        
        {/* Loading Spinner during session checkout */}
        {authLoading ? (
          <div key="loading-view" className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-white/40 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Syncing with database...</p>
          </div>
        ) : !user ? (
          
          /* ═════════════════════════════════════════════════════════════════════════════
             🔓 VIEW: CUSTOMER LOGIN GATEWAY
             ═════════════════════════════════════════════════════════════════════════════ */
          <div key="login-view" className="min-h-[65vh] flex flex-col justify-center items-center max-w-md mx-auto space-y-12 py-10">
            <div className="text-center space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 block">Access the Lounge</span>
              <h2 className="text-[clamp(2.5rem,7vw,4rem)] text-balance font-black text-white tracking-tighter leading-none">Traveler Portal.</h2>
              <p className="text-white/50 text-sm font-medium tracking-tight leading-relaxed">
                Log in securely via Magic Link to access your active concierge manifests, travel vouchers, and preferences.
              </p>
            </div>

            {otpSent ? (
              <div className="w-full p-8 rounded-3xl bg-white/[0.02] border border-emerald-500/20 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <Send className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">Check Your Inbox</h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    We have dispatched a secure, one-click sign-in link to <span className="text-white font-bold">{email}</span>. Click it to log in instantly.
                  </p>
                </div>
                <button 
                  onClick={() => setOtpSent(false)}
                  className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  ✕ Re-enter Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="w-full space-y-6">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/60 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER YOUR EMAIL ADDRESS"
                    className="w-full pl-14 pr-6 py-4.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.15] text-white text-[15px] placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all shadow-inner"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4.5 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-[#f5f5f7] disabled:opacity-30 disabled:grayscale active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Dispatching Link...
                    </>
                  ) : "Send Magic Link"}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/[0.12]" />
                  <span className="flex-shrink mx-4 text-[8px] font-black uppercase tracking-[0.3em] text-white/40">or sign in with</span>
                  <div className="flex-grow border-t border-white/[0.12]" />
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleGoogleLogin()}
                  className="w-full py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.15] hover:bg-white/[0.06] hover:border-white/[0.25] text-white font-bold text-[13px] tracking-tight transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  {loading ? "Initializing Google..." : "Sign In with Google"}
                </button>
              </form>
            )}
          </div>
        ) : (
          
          /* ═════════════════════════════════════════════════════════════════════════════
             🔒 VIEW: traveler PROFILE & CONCIERGE LOUNGE
             ═════════════════════════════════════════════════════════════════════════════ */
          <div key="auth-view" className="space-y-16">
            
            {/* Header / Profile Info */}
            <div className="border-b border-white/[0.05] pb-8">
              <div className="space-y-3">
                <h2 className="text-[clamp(2rem,6vw,4rem)] text-balance font-light tracking-tight text-white leading-none">
                  Welcome, <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/30">{fullName ? fullName.split(' ')[0] : "Traveler"}</span>.
                </h2>
                <p className="text-[#86868b] text-[10px] font-black uppercase tracking-[0.2em]">{user.email}</p>
              </div>
            </div>

            {/* STACKED FULL-WIDTH SECTION LIST */}
            <div className="space-y-16">
              
              {/* 1. ACTIVE BOOKINGS MANIFESTS (FULL ROW WITH 2-COLUMN CARDS) */}
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <Compass size={16} className="text-white/60" />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/70">My Bookings</h3>
                </div>

                {bookingsLoading && bookings.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Loading bookings...</span>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-white/[0.01] border border-white/[0.04] flex flex-col items-center justify-center gap-3 text-center">
                    <AlertCircle className="w-5 h-5 text-white/30" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">No Bookings Found</p>
                      <p className="text-[10px] text-white/40 max-w-xs leading-relaxed">
                        You don&apos;t have any active custom bookings with this account yet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="p-6 sm:p-7 rounded-3xl bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.08] relative overflow-hidden group space-y-6 transition-all duration-500 shadow-2xl animate-in fade-in slide-in-from-bottom-4"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                        
                        {/* Booking Header */}
                        <div className="flex justify-between items-start gap-4 relative z-10">
                          <div className="space-y-1">
                            <h4 className="text-lg font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors duration-300">
                              {booking.package_name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2.5 text-[8px] font-black text-white/40 uppercase tracking-widest">
                              <span>{booking.traveler_count} {booking.traveler_count === 1 ? 'Guest' : 'Guests'}</span>
                              <span>•</span>
                              <span>{new Date(booking.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border shrink-0",
                            booking.status === 'pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                            booking.status === 'confirmed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                            "bg-white/5 border-white/10 text-white/40"
                          )}>
                            {booking.status}
                          </span>
                        </div>

                        {/* HIGH-END BOOKING TRACKING TIMELINE */}
                        <div className="relative pt-6 border-t border-white/[0.04]">
                          <div className="absolute left-2 top-[34px] bottom-[18px] w-[1.5px] bg-white/5" />
                          
                          <div className="space-y-5">
                            {[
                              { label: "Booking Request Received", desc: "Your booking request has been received and is under review by our design team.", completed: true },
                              { label: "Flights & Accommodations Booking", desc: "We are currently securing your premium flights and room allotments.", completed: booking.status === 'confirmed' || booking.status === 'completed' },
                              { label: "Travel Documents & Vouchers", desc: "Your flight tickets, hotel vouchers, and custom itinerary are ready.", completed: booking.status === 'completed' }
                            ].map((step, idx) => (
                              <div key={idx} className="flex gap-4 relative">
                                <div className={cn(
                                  "w-4 h-4 rounded-full border-2 flex items-center justify-center relative z-10 shrink-0",
                                  step.completed 
                                    ? "bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]" 
                                    : "bg-black border-white/20"
                                )}>
                                  {step.completed && <Check size={8} className="text-black" strokeWidth={4} />}
                                </div>
                                <div className="space-y-1">
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wider block",
                                    step.completed ? "text-white" : "text-white/30"
                                  )}>
                                    {step.label}
                                  </span>
                                  <span className="text-[10px] text-white/40 leading-relaxed block max-w-md">
                                    {step.desc}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. TRAVELER PREFERENCES (SPLIT MULTI-COLUMN CARD SYSTEM ON DESKTOP) */}
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-white/60" />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Traveler Profile</h3>
                </div>

                <form onSubmit={handleSavePreferences} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* LEFT COLUMN: IDENTITY & IMMIGRATION */}
                    <div className="space-y-8">
                      
                      {/* Category 1: Personal Details */}
                      <div className="p-6 md:p-8 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/[0.12] space-y-6">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60 block border-b border-white/[0.10] pb-2">Personal Details</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Full Name */}
                          <div className="space-y-2 col-span-1 sm:col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Full Name (as in Passport)</label>
                            <div className="relative group">
                              <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                              <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="ENTER FULL NAME"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/[0.15] text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                              />
                            </div>
                          </div>

                          {/* Date of Birth */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Date of Birth</label>
                            <div className="relative group">
                              <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors pointer-events-none" />
                              <input
                                type="date"
                                required
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-xs focus:outline-none focus:border-white/20 transition-all cursor-pointer dark:[color-scheme:dark]"
                              />
                            </div>
                          </div>

                          {/* Gender */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Gender</label>
                            <div className="relative group">
                              <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                              <select
                                required
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 rounded-xl bg-black/40 border border-white/[0.15] text-white text-xs focus:outline-none focus:border-white/40 transition-all appearance-none cursor-pointer"
                              >
                                <option value="" className="bg-[#0a0a0b] text-white/50">Select Gender</option>
                                <option value="Male" className="bg-[#0a0a0b] text-white">Male</option>
                                <option value="Female" className="bg-[#0a0a0b] text-white">Female</option>
                                <option value="Other" className="bg-[#0a0a0b] text-white">Other</option>
                                <option value="Undisclosed" className="bg-[#0a0a0b] text-white">Undisclosed</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-focus-within:text-white/60 transition-colors" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category 2: Passport Details */}
                      <div className="p-6 md:p-8 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/[0.12] space-y-6">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60 block border-b border-white/[0.10] pb-2">Passport Details</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Passport Number */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Passport Number</label>
                            <div className="relative group">
                              <FileText size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                              <input
                                type="text"
                                required
                                value={passportNumber}
                                onChange={(e) => setPassportNumber(e.target.value)}
                                placeholder="ENTER PASSPORT NUMBER"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all uppercase"
                              />
                            </div>
                          </div>

                          {/* Passport Expiry */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Passport Expiration Date</label>
                            <div className="relative group">
                              <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors pointer-events-none" />
                              <input
                                type="date"
                                required
                                value={passportExpiry}
                                onChange={(e) => setPassportExpiry(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-xs focus:outline-none focus:border-white/20 transition-all cursor-pointer dark:[color-scheme:dark]"
                              />
                            </div>
                          </div>

                          {/* Nationality */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Nationality</label>
                            <div className="relative group">
                              <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                              <input
                                type="text"
                                required
                                value={nationality}
                                onChange={(e) => setNationality(e.target.value)}
                                placeholder="ENTER NATIONALITY"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/[0.15] text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                              />
                            </div>
                          </div>

                          {/* Departure City */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Departure City</label>
                            <div className="relative group">
                              <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                              <input
                                type="text"
                                required
                                value={departureCity}
                                onChange={(e) => setDepartureCity(e.target.value)}
                                placeholder="ENTER DEPARTURE CITY"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/[0.15] text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: PREFERENCES & EMERGENCY */}
                    <div className="space-y-8">
                      
                      {/* Category 3: Preferences */}
                      <div className="p-6 md:p-8 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/[0.12] space-y-6">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60 block border-b border-white/[0.10] pb-2">Preferences</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Phone Number */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Phone Number</label>
                            <div className="relative group">
                              <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                              <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s\-\+\(\)]/g, ''))}
                                placeholder="ENTER PHONE NUMBER"
                                maxLength={20}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/[0.15] text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                              />
                            </div>
                          </div>

                          {/* Flight Class */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Flight Class Preference</label>
                            <div className="relative group">
                              <Crown size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                              <select
                                required
                                value={travelClass}
                                onChange={(e: any) => setTravelClass(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 rounded-xl bg-black/40 border border-white/[0.15] text-white text-xs focus:outline-none focus:border-white/40 transition-all appearance-none cursor-pointer"
                              >
                                <option value="Economy" className="bg-[#0a0a0b] text-white">Economy Class</option>
                                <option value="Premium Economy" className="bg-[#0a0a0b] text-white">Premium Economy</option>
                                <option value="Business" className="bg-[#0a0a0b] text-white">Business Class</option>
                                <option value="First" className="bg-[#0a0a0b] text-white">First Class Suite</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-focus-within:text-white/60 transition-colors" />
                            </div>
                          </div>

                          {/* Dietary Preferences */}
                          <div className="space-y-2 col-span-1 sm:col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Dietary Preferences</label>
                            <div className="relative group">
                              <Utensils size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                              <input
                                type="text"
                                value={dietary}
                                onChange={(e) => setDietary(e.target.value)}
                                placeholder="ENTER DIETARY PREFERENCES (E.G. VEGETARIAN, GLUTEN FREE)"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/[0.15] text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category 4: Emergency Contact */}
                      <div className="p-6 md:p-8 rounded-3xl bg-black/40 border border-red-500/20 hover:border-red-500/25 backdrop-blur-xl transition-all duration-500 space-y-4 pt-5">
                        <div className="flex items-center gap-2.5 text-white/40">
                          <Heart size={12} className="text-[#ef4444] animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/75">Emergency Contact</span>
                        </div>
                        <p className="text-[10px] text-white/65 leading-relaxed">
                          Please provide an emergency contact for peace of mind during your travels.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          {/* Emergency Contact Name */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Contact Name</label>
                            <div className="relative group">
                              <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                              <input
                                type="text"
                                required
                                value={emergencyContactName}
                                onChange={(e) => setEmergencyContactName(e.target.value)}
                                placeholder="ENTER CONTACT NAME"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/[0.15] text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                              />
                            </div>
                          </div>

                          {/* Emergency Contact Phone */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Emergency Phone</label>
                            <div className="relative group">
                              <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                              <input
                                type="tel"
                                required
                                value={emergencyContactPhone}
                                onChange={(e) => setEmergencyContactPhone(e.target.value.replace(/[^\d\s\-\+\(\)]/g, ''))}
                                placeholder="ENTER EMERGENCY PHONE NUMBER"
                                maxLength={20}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/[0.15] text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Alerts & Save Actions */}
                      <div className="space-y-4 pt-2">
                        {error && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold">
                            <AlertCircle size={12} className="shrink-0" />
                            <span>{error}</span>
                          </div>
                        )}

                        {success && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                            <Check size={12} className="shrink-0" />
                            <span>{success}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-4 rounded-xl bg-white hover:bg-[#f5f5f7] text-black font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-30 disabled:grayscale active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Saving to Manifest...
                            </>
                          ) : "Save Preferences"}
                        </button>
                      </div>

                    </div>

                  </div>
                </form>
              </div>

            </div>

          </div>
        )}

      </div>
      </div>
    </div>
  );
}
