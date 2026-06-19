"use client";

import { useEffect, useRef, useState, memo, useMemo } from "react";
import Image from "next/image";
import { Magnetic } from "../Magnetic";
import { useAuth } from "@/components/AuthProvider";
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, Navigation } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export const ContactContent = memo(function ContactContent({ isActive, onScroll, startClosing }: { isActive: boolean, onScroll: (scrolled: boolean) => void, startClosing: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
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

  const hours = settings.contact_hours
    ? settings.contact_hours.split("\n").map(h => h.trim()).filter(Boolean)
    : ["Mon - Fri: 10 am - 6 pm", "Saturday: Holidays", "Sunday: Holidays"];

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

  // Prefill user data if logged in
  useEffect(() => {
    if (user) {
      if (profile?.full_name) setName(profile.full_name);
      if (user.email) setEmail(user.email);
      if (profile?.phone) {
        const rawPhone = profile.phone;
        const codeMatch = rawPhone.match(/^\+(\d+)\s*/);
        if (codeMatch) {
          const matchedCode = `+${codeMatch[1]}`;
          const cleanPhone = rawPhone.replace(matchedCode, "").trim();
          setPhone(cleanPhone);
          const countries = [
            { flag: "🇮🇳", code: "+91", name: "India", length: 10 },
            { flag: "🇺🇸", code: "+1", name: "USA", length: 10 },
            { flag: "🇬🇧", code: "+44", name: "UK", length: 10 },
            { flag: "🇦🇪", code: "+971", name: "UAE", length: 9 },
            { flag: "🇸🇬", code: "+65", name: "Singapore", length: 8 },
            { flag: "🇦🇺", code: "+61", name: "Australia", length: 9 }
          ];
          const country = countries.find(c => c.code === matchedCode);
          if (country) setSelectedCountry(country);
        } else {
          setPhone(rawPhone);
        }
      }
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
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
          userId: user?.id || null
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
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <div 
        ref={scrollRef} 
        onScroll={(e) => onScroll(e.currentTarget.scrollTop > 30)}
        className="flex-1 w-full overflow-y-auto scrollbar-hide overscroll-behavior-contain transform-gpu bg-[#0a0a0b]"
        data-lenis-prevent
      >
        <div 
          className={`w-full flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu ${isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'}`}
        >
          {/* Header Image featuring Private Jet sunset */}
          <div className="relative w-full aspect-[4/3] md:aspect-[2.4/1] overflow-hidden bg-[#0a0a0b]">
            <Image 
              src={settings.contact_header_image || "/private_jet_interior_sunset_1777656427557.png"} 
              alt="Co-Create Experience" 
              fill 
              className="object-cover scale-[1.01] opacity-70 grayscale-[0.1]" 
              priority 
            />
            {/* Smooth Progressive Blend */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0a0b]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
            
            {/* Header Title Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.4em] text-white/70 mb-3">
                {settings.contact_header_subtitle || "TouraLuxe Concierge"}
              </span>
              <h2 className="text-[clamp(2rem,7vw,3.5rem)] font-bold tracking-tighter text-white">
                {settings.contact_header_title || "Let's Craft Your Journey"}
              </h2>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-50 transition-all duration-700">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Scroll</span>
              <svg className="w-4 h-4 text-white/50" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </div>

          {/* Form and Contact Details Grid */}
          <div className="px-[clamp(1.25rem,6vw,4rem)] py-8 max-w-6xl mx-auto w-full pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* Left Column: Contact Cards & Details */}
              <div className="lg:col-span-5 space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-[1px] bg-white/20" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/40">
                      {settings.contact_section_subtitle || "Global Concierge"}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-white leading-tight">
                    {settings.contact_section_title || "Transcendent Service, Instantly Accessible."}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-sm">
                    {settings.contact_section_description || "Whether co-creating a customized travel itinerary or managing a group manifest, our lifestyle curating specialists respond within hours."}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Card: Our Offices */}
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div className="space-y-3 w-full">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Our Offices</span>
                      <div className="space-y-1.5">
                        {offices.map((office) => {
                          const hasMap = typeof office.mapUrl === "string" && office.mapUrl.trim().length > 0;
                          return hasMap ? (
                            <a 
                              key={office.name}
                              href={office.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm font-medium text-white/80 hover:text-white transition-colors duration-200"
                            >
                              {office.name}
                            </a>
                          ) : (
                            <span 
                              key={office.name}
                              className="block text-sm font-medium text-white/50"
                            >
                              {office.name}
                            </span>
                          );
                        })}
                      </div>
                      {offices.some(o => typeof o.mapUrl === "string" && o.mapUrl.trim().length > 0) && (
                        <div className="pt-2 border-t border-white/5">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">View Map:</span>
                            {offices
                              .filter(o => typeof o.mapUrl === "string" && o.mapUrl.trim().length > 0)
                              .map((office) => (
                                <a 
                                  key={office.name}
                                  href={office.mapUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-bold text-white/55 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-0.5 rounded-full transition-all"
                                >
                                  {office.name}
                                </a>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card: Opening Hours */}
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Opening Hours</span>
                      <div className="space-y-0.5">
                        {hours.map((line, idx) => (
                          <p key={idx} className="text-sm font-medium text-white/70">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card: Customer Support */}
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 shrink-0">
                      <Mail size={16} />
                    </div>
                    <div className="space-y-1.5 w-full">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Customer Service</span>
                      <a href={`mailto:${settings.contact_email || "hello@touraluxe.com"}`} className="block text-sm font-medium text-white hover:text-white/80 transition-colors">
                        {settings.contact_email || "hello@touraluxe.com"}
                      </a>
                      <a href={`tel:${settings.contact_phone || "+919870103022"}`} className="block text-sm font-medium text-white hover:text-white/80 transition-colors">
                        tel: {settings.contact_phone || "+91 9870103022"}
                      </a>
                    </div>
                  </div>

                  {/* Card: Headquarters (Optional detailed coordinates) */}
                  {settings.contact_address && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.contact_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300 group/loc cursor-pointer hover:bg-white/[0.04]"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 shrink-0 group-hover/loc:bg-white/10 group-hover/loc:text-white transition-all">
                        <Navigation size={15} />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Corporate HQ</span>
                        <p className="text-[11px] text-white/60 leading-relaxed group-hover/loc:text-white/80 transition-colors">
                          {settings.contact_address}
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Right Column: Contact/CTA Form */}
              <div className="lg:col-span-7 bg-white/[0.02] border border-white/5 p-6 md:p-10 rounded-3xl relative overflow-hidden">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 size={32} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white">Transmission Transmitted</h4>
                      <p className="text-sm text-white/50 max-w-sm">
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
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-[1px] bg-white/20" />
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/40">
                          {settings.contact_form_subtitle || "Inquiry Manifest"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold tracking-tight text-white mt-2">
                        {settings.contact_form_title || "Submit Your Details"}
                      </h3>
                    </div>

                    {error && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium tracking-wide">
                        {error}
                      </div>
                    )}

                    <div className="space-y-6">
                      {/* Name & Email Group */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#86868b] ml-1">Full Name *</label>
                          <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name" 
                            className="w-full bg-white/[0.03] border border-white/10 focus:border-white/30 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
                          />
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#86868b] ml-1">Email Address *</label>
                          <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com" 
                            className="w-full bg-white/[0.03] border border-white/10 focus:border-white/30 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Phone Input with Country Code Selector */}
                      <div className="flex flex-col gap-2 relative">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#86868b] ml-1">Phone Number (Optional)</label>
                        <div className="flex items-center gap-3 w-full bg-white/[0.03] border border-white/10 focus-within:border-white/30 rounded-2xl px-5 py-2.5 transition-all">
                          <div className="relative shrink-0">
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCountryMenuOpen(!countryMenuOpen);
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer hover:bg-white/10 rounded-lg bg-white/5 border border-white/5 transition-all"
                            >
                              <span className="text-xs">{selectedCountry.flag}</span>
                              <span className="text-[10px] font-bold text-white/70">{selectedCountry.code}</span>
                            </div>
                            {countryMenuOpen && (
                              <div className="absolute top-full left-0 mt-2 w-48 max-h-40 overflow-y-auto bg-[#121214] border border-white/10 rounded-xl shadow-2xl z-[150] scrollbar-hide">
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
                                    className="flex items-center justify-between px-4 py-2.5 hover:bg-white/10 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs">{c.flag}</span>
                                      <span className="text-[10px] font-bold text-white/70">{c.name}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-white/30">{c.code}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                            maxLength={selectedCountry.length}
                            placeholder="Phone number"
                            onFocus={() => setCountryMenuOpen(false)}
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none py-1"
                          />
                        </div>
                      </div>

                      {/* Dream Destination (from CtaContent) */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#86868b] ml-1">Dream Destination (Optional)</label>
                        <input 
                          type="text" 
                          value={dreamDestination}
                          onChange={(e) => setDreamDestination(e.target.value)}
                          placeholder="e.g. Maldives, Swiss Alps, Amalfi Coast" 
                          className="w-full bg-white/[0.03] border border-white/10 focus:border-white/30 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
                        />
                      </div>

                      {/* Your Vision / Message */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#86868b] ml-1">Your Vision / Inquiry Message *</label>
                        <textarea 
                          required
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Share your vision for the perfect trip, or write your query..." 
                          className="w-full bg-white/[0.03] border border-white/10 focus:border-white/30 rounded-3xl px-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all resize-none scrollbar-hide"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <span className="text-[10px] text-white/30">* Required fields</span>
                      <Magnetic>
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="px-8 py-3.5 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {isSubmitting ? (
                            <>Transmitting...</>
                          ) : (
                            <>
                              Send Inquiry <Send size={12} />
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
    </div>
  );
});
