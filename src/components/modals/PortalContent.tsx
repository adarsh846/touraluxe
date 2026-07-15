"use client";

import { useEffect, useRef, useState, memo, useMemo } from "react";
import Image from "next/image";
import { Magnetic } from "../Magnetic";
import { 
  Search, 
  Compass, 
  Lock, 
  User, 
  Calendar, 
  MapPin, 
  CreditCard, 
  ArrowRight, 
  Clock, 
  Plane, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  MessageSquare
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface TrackingBooking {
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
  booking_source: string;
}

export const PortalContent = memo(function PortalContent({ 
  isActive 
}: { 
  isActive: boolean; 
  onScroll?: (scrolled: boolean) => void;
}) {
  const { settings } = useSettings();

  // Search Credentials States
  const [referenceId, setReferenceId] = useState("TRX-");
  const [verificationType, setVerificationType] = useState<"email" | "phone">("email");
  const [verificationValue, setVerificationValue] = useState("");
  
  // Phone inputs flag helper
  const [selectedCountry, setSelectedCountry] = useState({ flag: "🇮🇳", code: "+91", name: "India", length: 10 });
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);

  // Flow control states
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<TrackingBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetPortal = () => {
    setBooking(null);
    setError(null);
    setReferenceId("TRX-");
    setVerificationValue("");
  };

  // Dynamic clock for high-end airport/lounge feel
  const [time, setTime] = useState("");
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to parse dates and details from special requests column
  const parsedDetails = useMemo(() => {
    if (!booking?.special_requests) return null;
    const parts = booking.special_requests.split('|') || [];
    
    let rawDates = parts.find(p => p.includes('Dates:'))?.replace('Dates:', '').trim() || "";
    if (!rawDates) {
      const depPart = parts.find(p => p.includes('Departure:'));
      if (depPart) {
        rawDates = depPart
          .replace('Departure:', '')
          .replace('Return:', 'to')
          .replace(',', '')
          .trim();
      }
    }
    
    // Format all YYYY-MM-DD dates to DD-MM-YYYY
    const formattedDates = rawDates.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, "$3-$2-$1");
    
    const departureHub = parts.find(p => p.includes('Departure Hub:'))?.replace('Departure Hub:', '').trim() || "";
    const flights = parts.find(p => p.includes('Flights:'))?.replace('Flights:', '').trim() || "";
    const notes = parts.find(p => p.includes('Notes:'))?.replace('Notes:', '').trim() || "";
    
    return { dates: formattedDates, departureHub, flights, notes };
  }, [booking]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceId.trim()) {
      setError("Booking Reference ID is required.");
      return;
    }
    if (!verificationValue.trim()) {
      setError(`Verified ${verificationType === "email" ? "email address" : "phone number"} is required.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const normalizedRef = referenceId.trim().toLowerCase().replace(/^trx-/, "");
      
      let queryUrl = `/api/bookings/track?id=${normalizedRef}`;
      if (verificationType === "email") {
        queryUrl += `&email=${encodeURIComponent(verificationValue.trim())}`;
      } else {
        const fullPhone = `${selectedCountry.code}${verificationValue.trim()}`;
        queryUrl += `&phone=${encodeURIComponent(fullPhone)}`;
      }

      const res = await fetch(queryUrl);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed. Check reference ID and contact details.");
      }

      setBooking(data.booking);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppSupportUrl = () => {
    if (!booking) return "";
    const prefix = "TRX-" + booking.id.slice(0, 8).toUpperCase();
    const whatsappNum = settings.whatsapp_number || "919870103022";
    const text = `Hi TouraLuxe! I am checking in on my active booking Reference ID: ${prefix} (${booking.package_name}). Please share the latest status update. Thank you.`;
    return `https://wa.me/${whatsappNum.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
  };

  // User-friendly Status mapping timeline
  const workflowSteps = useMemo(() => {
    if (!booking) return [];
    
    const status = booking.status?.toLowerCase() || "pending";
    
    if (status === "cancelled") {
      return [
        { title: "Inquiry Received", desc: "We received your booking request.", status: "completed" },
        { title: "Booking Cancelled", desc: "This request has been cancelled.", status: "error" }
      ];
    }

    return [
      { 
        title: "Inquiry Received", 
        desc: "We have received your booking request.", 
        status: "completed" 
      },
      { 
        title: "Designing Itinerary", 
        desc: "Crafting your personalized route and options.", 
        status: status === "pending" ? "active" : "completed" 
      },
      { 
        title: "Proposal Ready", 
        desc: "Reviewing flight logistics and hotel quotes.", 
        status: status === "pending" ? "pending" : (status === "confirmed" ? "completed" : "pending") 
      },
      { 
        title: "Confirmed & Finalized", 
        desc: "All details confirmed. Travel vouchers ready.", 
        status: status === "confirmed" ? "active" : (status === "archived" ? "completed" : "pending") 
      }
    ];
  }, [booking]);

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-black flex flex-col font-sans">
      
      {/* --- Fullscreen Backdrop --- */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image 
          src={settings.portal_default_image || "/private_jet_interior_sunset_1777656427557.png"} 
          alt="Ambient Background" 
          fill
          priority
          className="object-cover scale-[1.01] opacity-[0.35] blur-[2px] transition-all duration-1000" 
        />
        {/* Dynamic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
        <div className="absolute inset-0 bg-radial-vignette" />
      </div>

      {/* --- Custom Top Header Bar --- */}
      <div className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-white/[0.03] backdrop-blur-[3px] shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-6">
            <Image
              src="/assets/logo-transparent.webp"
              alt="TouraLuxe"
              fill
              className="object-contain translate-y-[2px]"
            />
          </div>
          <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-[0.3em] text-white/30 border-l border-white/10 pl-4 py-0.5">
            Booking Tracker
          </span>
        </div>
        <div className="flex items-center gap-4">
          {time && (
            <div className="text-[10px] font-mono tracking-widest text-white/40 uppercase hidden sm:block">
              GMT {time}
            </div>
          )}
        </div>
      </div>

      {/* --- Main Centered App Window --- */}
      <div className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center p-4 md:p-8 relative z-10 overflow-hidden">
        
        {!booking ? (
          /* --- SIMPLIFIED SEARCH VIEW CARD --- */
          <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/[0.08] rounded-[24px] p-6 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase italic">
                Track Your Booking
              </h2>
              <p className="text-xs text-white/50 leading-relaxed max-w-sm mx-auto">
                Enter your booking ID and email or phone number to view your live travel itinerary and status.
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-start gap-2.5">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              {/* Reference ID input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#86868b] ml-1">Booking Reference ID *</label>
                <div className="relative flex items-center">
                  <Search size={13} className="absolute left-4.5 text-white/25" />
                  <input 
                    type="text" 
                    required
                    value={referenceId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.toUpperCase().startsWith("TRX-")) {
                        setReferenceId("TRX-" + val.slice(4));
                      } else {
                        setReferenceId("TRX-");
                      }
                    }}
                    placeholder="e.g. TRX-XXXXXXXX" 
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-white/25 rounded-xl pl-11 pr-5 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all uppercase"
                  />
                </div>
              </div>

              {/* Verification Control */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#86868b] ml-1">Verify Using *</label>
                <div className="flex w-full p-0.5 h-9 rounded-lg bg-[#121214] border border-white/[0.05] relative">
                  {(["email", "phone"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setVerificationType(type);
                        setVerificationValue("");
                      }}
                      className={`flex-1 h-full flex items-center justify-center text-[9px] font-bold uppercase tracking-wider transition-all duration-300 rounded-md z-10 ${
                        verificationType === type
                          ? "bg-white text-black shadow-md"
                          : "text-white/30 hover:text-white"
                      }`}
                    >
                      {type === "email" ? "Email Address" : "Phone Number"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Contact Field */}
              {verificationType === "email" ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#86868b] ml-1">Registered Email *</label>
                  <input 
                    type="email" 
                    required
                    value={verificationValue}
                    onChange={(e) => setVerificationValue(e.target.value)}
                    placeholder="your@email.com" 
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-white/25 rounded-xl px-5 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#86868b] ml-1">Registered Phone *</label>
                  <div className="flex items-center gap-3 w-full bg-white/[0.03] border border-white/10 focus-within:border-white/25 rounded-xl px-4 py-2 transition-all">
                    <div className="relative shrink-0">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCountryMenuOpen(!countryMenuOpen);
                        }}
                        className="flex items-center gap-1 px-1.5 py-1 cursor-pointer hover:bg-white/10 rounded bg-white/5 border border-white/5 transition-all"
                      >
                        <span className="text-xs">{selectedCountry.flag}</span>
                        <span className="text-[9px] font-bold text-white/60">{selectedCountry.code}</span>
                      </div>
                      {countryMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 max-h-40 overflow-y-auto bg-[#121214] border border-white/10 rounded-xl shadow-2xl z-[150] scrollbar-hide">
                          {[
                            { flag: "🇮🇳", code: "+91", name: "India", length: 10 },
                            { flag: "🇺🇸", code: "+1", name: "USA", length: 10 },
                            { flag: "🇬🇧", code: "+44", name: "UK", length: 10 },
                            { flag: "🇦🇪", code: "+971", name: "UAE", length: 9 },
                            { flag: "🇸🇬", code: "+65", name: "Singapore", length: 8 },
                            { flag: "🇦🇺", code: "+61", name: "Australia", length: 9 },
                          ].map((c) => (
                            <div 
                              key={c.name} 
                              onClick={() => { 
                                setSelectedCountry(c); 
                                setVerificationValue(""); 
                                setCountryMenuOpen(false); 
                              }} 
                              className="flex items-center justify-between px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs">{c.flag}</span>
                                <span className="text-[9px] font-bold text-white/70">{c.name}</span>
                              </div>
                              <span className="text-[9px] font-black text-white/30">{c.code}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      required
                      value={verificationValue}
                      onChange={(e) => setVerificationValue(e.target.value.replace(/[^0-9]/g, ""))}
                      maxLength={selectedCountry.length}
                      placeholder="Phone digits"
                      onFocus={() => setCountryMenuOpen(false)}
                      className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none py-0.5"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[9px] text-white/20">* Required fields</span>
                <Magnetic>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="group px-7 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : (
                      <>
                        Track Booking <ArrowRight size={12} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </Magnetic>
              </div>
            </form>
          </div>
        ) : (
          /* --- DETAILED VIEW CARD --- */
          <div className="w-full max-h-[85vh] bg-black/40 backdrop-blur-2xl border border-white/[0.08] rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-[0_24px_80px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500">
            
            {/* Left Column (Booking Info Summary) */}
            <div className="w-full md:w-[42%] bg-white/[0.01] border-b md:border-b-0 md:border-r border-white/[0.05] p-6 md:p-10 flex flex-col justify-between shrink-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#86868b]">
                    Booking Active
                  </span>
                </div>

                <div className="space-y-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#86868b] block mb-1">Your Package</span>
                  <h2 className="text-2xl md:text-[26px] font-bold text-white tracking-tight italic uppercase leading-tight line-clamp-2">
                    {booking.package_name}
                  </h2>
                  <p className="text-xs text-white/45">
                    Booking ID: <span className="font-mono text-white/70">TRX-{booking.id.slice(0, 8).toUpperCase()}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.05]">
                    <div>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-[#86868b] block mb-0.5">Travelers</span>
                      <span className="text-xs font-bold text-white/90">{booking.traveler_count || 1} Guests</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-[#86868b] block mb-0.5">Total Value</span>
                      <span className="text-xs font-bold text-white/90">
                        {booking.total_amount && booking.total_amount > 0 
                          ? `₹${Number(booking.total_amount).toLocaleString()}` 
                          : "Curating Proposal"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Security Note */}
              <div className="hidden md:flex flex-col gap-2 pt-6 border-t border-white/[0.03]">
                <div className="flex gap-2 items-center">
                  <Lock size={11} className="text-white/30" />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">Secure Access</span>
                </div>
                <p className="text-[9px] text-white/30 leading-normal">
                  Your details are secure. Identity verification ensures only authorized guests can view active travel itineraries.
                </p>
              </div>
            </div>

            {/* Right Column (Timeline details) */}
            <div className="flex-1 p-6 md:p-10 flex flex-col justify-center overflow-y-auto max-h-[60vh] md:max-h-[85vh] custom-scrollbar">
              <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 flex flex-col justify-between h-full">
                
                {/* Timeline & Details */}
                <div className="space-y-6 pl-3">
                  
                  {/* Stepper timeline */}
                  <div className="relative pl-5 py-1 border-l border-white/5 space-y-6">
                    {workflowSteps.map((step, idx) => (
                      <div key={idx} className="relative flex flex-col space-y-0.5">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[26px] w-[9px] h-[9px] rounded-full border-2 bg-black ${
                          step.status === "completed" ? "border-emerald-500 bg-emerald-500/10 scale-100" :
                          step.status === "active" ? "border-amber-400 bg-amber-400/20 animate-pulse scale-125" :
                          step.status === "error" ? "border-red-500 bg-red-500/10 scale-110" :
                          "border-white/10 bg-black scale-95"
                        }`} />

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-bold ${
                            step.status === "completed" ? "text-white/80" :
                            step.status === "active" ? "text-white" :
                            step.status === "error" ? "text-red-400" :
                            "text-white/20"
                          }`}>
                            {step.title}
                          </span>
                          {step.status === "completed" && <CheckCircle2 size={10} className="text-emerald-500/80" />}
                        </div>

                        <p className={`text-[9.5px] leading-relaxed ${
                          step.status === "completed" ? "text-white/35" :
                          step.status === "active" ? "text-white/55" :
                          "text-white/15"
                        }`}>
                          {step.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/[0.05]">
                    
                    {/* Travel Dates */}
                    <div className="flex items-center gap-3 bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
                      <Calendar size={13} className="text-white/30" />
                      <div>
                        <span className="text-[7.5px] font-bold uppercase tracking-wider text-white/30 block">Travel Dates</span>
                        <span className="text-[11px] font-bold text-white/70">
                          {parsedDetails?.dates && parsedDetails.dates !== "to" ? parsedDetails.dates : "Flexible"}
                        </span>
                      </div>
                    </div>

                    {/* Departure City */}
                    <div className="flex items-center gap-3 bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
                      <Plane size={13} className="text-white/30" />
                      <div>
                        <span className="text-[7.5px] font-bold uppercase tracking-wider text-white/30 block">Departure City</span>
                        <span className="text-[11px] font-bold text-white/70 font-mono">
                          {parsedDetails?.departureHub && parsedDetails.departureHub !== "Not Specified" ? parsedDetails.departureHub : "To Be Confirmed"}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Special requests */}
                  {parsedDetails?.notes && (
                    <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                      <span className="text-[7.5px] font-bold uppercase tracking-wider text-white/30 block mb-0.5">Special Requests</span>
                      <p className="text-[10px] text-white/40 leading-relaxed italic">"{parsedDetails.notes}"</p>
                    </div>
                  )}

                </div>

                {/* Operations Footer */}
                <div className="pt-4 border-t border-white/[0.05] flex gap-3 shrink-0">
                  <Magnetic>
                    <button 
                      onClick={resetPortal}
                      className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw size={11} />
                      Check Another
                    </button>
                  </Magnetic>
                  <Magnetic>
                    <a 
                      href={getWhatsAppSupportUrl()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group/wa relative overflow-hidden flex-1 px-6 py-2.5 rounded-full bg-[#25D366] text-black text-[9.5px] font-black uppercase tracking-wider transition-all duration-700 active:scale-95 text-center flex items-center justify-center cursor-pointer shadow-[0_4px_15px_rgba(37,211,102,0.2)]"
                    >
                      <div className="relative z-10 flex items-center justify-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-black shrink-0" viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                        </svg>
                        <span>Chat on WhatsApp</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#25D366] via-[#35e376] to-[#25D366] opacity-0 group-hover/wa:opacity-100 transition-opacity duration-500" />
                    </a>
                  </Magnetic>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 9px; }
        .bg-radial-vignette {
          background: radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.6) 80%);
        }
      `}</style>

    </div>
  );
});
