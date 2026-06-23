"use client";

import { useEffect, useRef, useState, memo, useMemo } from "react";
import Image from "next/image";
import { Magnetic } from "../Magnetic";

import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, Navigation, ArrowRight } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export const ContactContent = memo(function ContactContent({ isActive, onScroll, startClosing }: { isActive: boolean, onScroll: (scrolled: boolean) => void, startClosing: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { settings } = useSettings();

  // Parse offices dynamically (handles both JSON array and legacy comma-separated string)
  const offices = useMemo(() => {
    if (!settings.contact_offices) {
      return [
        { name: "Mumbai", mapUrl: "" },
        { name: "Delhi", mapUrl: "" },
        { name: "Varanasi", mapUrl: "" }
      ];
    }
    try {
      const parsed = JSON.parse(settings.contact_offices);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          name: item.name || "",
          mapUrl: item.mapUrl || ""
        }));
      }
    } catch (e) {
      // JSON parse failed; fallback to legacy split
    }

    return settings.contact_offices
      .split(",")
      .map(o => o.trim())
      .filter(Boolean)
      .map(name => ({ name, mapUrl: "" }));
  }, [settings.contact_offices]);

  const hours = useMemo(() => {
    return settings.contact_hours
      ? settings.contact_hours.split("\n").map(h => h.trim()).filter(Boolean)
      : ["Mon - Fri: 10 am - 6 pm", "Saturday: Holidays", "Sunday: Holidays"];
  }, [settings.contact_hours]);

  // Unified Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dreamDestination, setDreamDestination] = useState("");
  const [message, setMessage] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone Dropdown States
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ flag: "🇮🇳", code: "+91", name: "India", length: 10 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) {
      setError("Please fill in all required fields.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    const fullPhone = phone ? `${selectedCountry.code}${phone}` : "";

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: "contact",
          packageName: dreamDestination ? `Co-Create: ${dreamDestination}` : "General Inquiry",
          travelerCount: 1,
          specialRequests: `Dream Destination: ${dreamDestination || "Not Specified"}\nMessage/Vision: ${message}`,
          totalAmount: 0,
          customerName: name,
          customerEmail: email,
          customerPhone: fullPhone,
          bookingSource: "CONTACT_FORM",
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to submit message.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0a0a0b] text-white overflow-hidden">
      
      {/* Immersive Fullscreen Background Image with Dark Overlays */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-[0.35]">
        <Image 
          src={settings.contact_header_image || "/private_jet_interior_sunset_1777656427557.png"} 
          alt="Co-Create Experience" 
          fill 
          className="object-cover scale-[1.01] grayscale-[0.2]" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />
      </div>

      {/* Scrollable container on mobile, fixed/hidden on desktop */}
      <div 
        ref={scrollRef}
        onScroll={(e) => onScroll(e.currentTarget.scrollTop > 30)}
        className="flex-1 w-full overflow-y-auto lg:overflow-hidden scrollbar-hide overscroll-behavior-contain transform-gpu"
        data-lenis-prevent
      >
        {/* Main Content Wrapper */}
        <div 
          className={`relative z-10 w-full max-w-7xl mx-auto px-[clamp(1rem,4vw,3.5rem)] py-24 lg:py-0 min-h-full lg:h-full flex flex-col justify-start lg:justify-center items-center pb-32 lg:pb-0 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu ${isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'}`}
        >
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Heading & Contact Info Details */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:space-y-8">
              {/* Header Title */}
              <div className="space-y-3">
                <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.4em] text-white/50 block">
                  {settings.contact_header_subtitle || "TouraLuxe Concierge"}
                </span>
                <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tighter text-white leading-none">
                  {settings.contact_header_title || "Let's Craft Your Journey"}
                </h2>
                <p className="text-xs md:text-sm text-white/50 leading-relaxed max-w-sm">
                  {settings.contact_section_description || "Whether co-creating a customized travel itinerary or managing a group manifest, our lifestyle curating specialists respond within hours."}
                </p>
              </div>

              {/* Quick Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1: Our Offices */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-col justify-between min-h-[90px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 shrink-0">
                      <MapPin size={14} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Our Offices</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {offices.map((office) => {
                      const hasMap = typeof office.mapUrl === "string" && office.mapUrl.trim().length > 0;
                      return hasMap ? (
                        <a 
                          key={office.name}
                          href={office.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs font-semibold text-white/80 hover:text-white transition-colors"
                        >
                          {office.name}
                        </a>
                      ) : (
                        <span key={office.name} className="block text-xs text-white/50">
                          {office.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Card 2: Contact Channels */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-col justify-between min-h-[90px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 shrink-0">
                      <Mail size={14} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Direct Lines</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <a href={`mailto:${settings.contact_email || "hello@touraluxe.com"}`} className="block text-xs font-semibold text-white hover:text-white/80 transition-colors truncate">
                      {settings.contact_email || "hello@touraluxe.com"}
                    </a>
                    <a href={`tel:${settings.contact_phone || "+919870103022"}`} className="block text-xs font-semibold text-white hover:text-white/80 transition-colors truncate">
                      {settings.contact_phone || "+91 9870103022"}
                    </a>
                  </div>
                </div>

                {/* Card 3: Opening Hours */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-col justify-between sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 shrink-0">
                      <Clock size={14} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Operation Hours</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    {hours.map((line, idx) => (
                      <p key={idx} className="text-xs text-white/70">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Card 4: Corporate HQ */}
                {settings.contact_address && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.contact_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-all group/loc sm:col-span-2 block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 shrink-0 group-hover/loc:bg-white/10 transition-colors">
                        <Navigation size={13} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Corporate Headquarters</span>
                    </div>
                    <p className="mt-2 text-xs text-white/60 leading-relaxed group-hover/loc:text-white/80 transition-colors truncate">
                      {settings.contact_address}
                    </p>
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Contact/CTA Form */}
            <div className="lg:col-span-7 bg-white/[0.01] border border-white/5 p-6 lg:p-8 rounded-3xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-center">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-16 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-white">Transmission Transmitted</h4>
                    <p className="text-xs text-white/50 max-w-sm leading-relaxed">
                      Thank you, {name.split(' ')[0]}. Your travel inquiry has been received by our lead curators. A luxury travel designer will reach out within 24 hours.
                    </p>
                  </div>
                  <Magnetic>
                    <button 
                      onClick={() => {
                        setIsSuccess(false);
                        setMessage("");
                        setDreamDestination("");
                      }}
                      className="px-8 py-3 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                    >
                      Send Another Inquiry
                    </button>
                  </Magnetic>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                      {settings.contact_form_subtitle || "Inquiry Manifest"}
                    </span>
                    <h3 className="text-lg font-bold tracking-tight text-white">
                      {settings.contact_form_title || "Submit Your Details"}
                    </h3>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium tracking-wide">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Name & Email Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#86868b] ml-1">Full Name *</label>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name" 
                          className="w-full bg-white/[0.02] border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all"
                        />
                      </div>

                      {/* Email */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#86868b] ml-1">Email Address *</label>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com" 
                          className="w-full bg-white/[0.02] border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone Input with Country Code Selector */}
                    <div className="flex flex-col gap-1.5 relative">
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#86868b] ml-1">Phone Number *</label>
                      <div className="flex items-center gap-3 w-full bg-white/[0.02] border border-white/10 focus-within:border-white/30 rounded-xl px-4 py-2 transition-all">
                        <div className="relative shrink-0">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCountryMenuOpen(!countryMenuOpen);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 cursor-pointer hover:bg-white/10 rounded-lg bg-white/5 border border-white/5 transition-all"
                          >
                            <span className="text-xs">{selectedCountry.flag}</span>
                            <span className="text-[9px] font-bold text-white/70">{selectedCountry.code}</span>
                          </div>
                          {countryMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-44 max-h-36 overflow-y-auto bg-[#121214] border border-white/10 rounded-lg shadow-2xl z-[150] scrollbar-hide">
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
                                    setPhone(""); 
                                    setCountryMenuOpen(false); 
                                  }} 
                                  className="flex items-center justify-between px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">{c.flag}</span>
                                    <span className="text-[9px] font-bold text-white/70">{c.name}</span>
                                  </div>
                                  <span className="text-[8px] font-black text-white/30">{c.code}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                          maxLength={selectedCountry.length}
                          placeholder="Enter your phone number"
                          onFocus={() => setCountryMenuOpen(false)}
                          className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none py-1"
                        />
                      </div>
                    </div>

                    {/* Dream Destination */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#86868b] ml-1">Dream Destination (Optional)</label>
                      <input 
                        type="text" 
                        value={dreamDestination}
                        onChange={(e) => setDreamDestination(e.target.value)}
                        placeholder="e.g. Maldives, Swiss Alps, Amalfi Coast" 
                        className="w-full bg-white/[0.02] border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all"
                      />
                    </div>

                    {/* Your Vision / Message */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#86868b] ml-1">Your Vision / Inquiry Message *</label>
                      <textarea 
                        required
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Share your vision for the perfect trip..." 
                        className="w-full bg-white/[0.02] border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all resize-none scrollbar-hide"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[9px] text-white/30">* Required fields</span>
                    <Magnetic>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="group px-7 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isSubmitting ? (
                          <>Transmitting...</>
                        ) : (
                          <>
                            Send Inquiry <ArrowRight size={12} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                          </>
                        )}
                      </button>
                    </Magnetic>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
});
ContactContent.displayName = "ContactContent";
