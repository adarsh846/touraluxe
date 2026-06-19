"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Upload, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface EditorialManagerProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<void>;
  isUpdating: boolean;
  addNotification?: (message: string, type: "success" | "error" | "info") => void;
}

export function EditorialManager({ settings, onUpdate, isUpdating, addNotification }: EditorialManagerProps) {
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<"hero" | "about" | "quotes" | "services" | "cta" | "contact" | "discovery" | "portal" | "intelligence">("hero");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  // Discovery Intelligence State
  const [synonyms, setSynonyms] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newSynonyms, setNewSynonyms] = useState("");
  const [newIntentKey, setNewIntentKey] = useState("");
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const fetchIntelligence = async () => {
    setLoadingIntelligence(true);
    try {
      const [synRes, msgRes] = await Promise.all([
        supabase.from("search_synonyms").select("*").order("word"),
        supabase.from("intent_messages").select("*").order("intent_key")
      ]);
      if (synRes.data) setSynonyms(synRes.data);
      if (msgRes.data) setMessages(msgRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoadingIntelligence(false);
  };

  useEffect(() => {
    if (activeCategory === "intelligence") {
      fetchIntelligence();
    }
  }, [activeCategory]);

  const handleChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string, customValue?: string) => {
    await onUpdate(key, customValue ?? (localSettings[key] || ""));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = sessionStorage.getItem("admin_token") || "";
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-token": token },
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        handleChange("discovery_default_image", url);
        await onUpdate("discovery_default_image", url);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const categories = [
    { id: "hero", label: "Hero Narrative" },
    { id: "about", label: "Brand Story" },
    { id: "quotes", label: "Editorial Quotes" },
    { id: "services", label: "Services Header" },
    { id: "cta", label: "Final CTA" },
    { id: "contact", label: "Contact & Footer" },
    { id: "discovery", label: "Discovery Atmosphere" },
    { id: "portal", label: "Traveler Portal" },
    { id: "intelligence", label: "Discovery Intelligence" },
  ];

  // Helper to parse JSON safely
  const safeParse = (str: string, fallback: any) => {
    try {
      return str ? JSON.parse(str) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-wrap md:flex-col gap-2 p-1 bg-[#1c1c1e] rounded-[24px] md:rounded-3xl border border-white/[0.05]">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex-none px-4 md:px-6 py-2 md:py-3 rounded-[18px] md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all text-center md:text-left whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? "bg-white text-black shadow-xl scale-[1.02]" 
                    : "text-[#86868b] hover:text-white hover:bg-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {activeCategory === "hero" && (
            <div className="space-y-6">
              <SectionHeader title="Hero Narrative" description="The first impression of TouraLuxe." />
              <div className="grid grid-cols-1 gap-6">
                <InputGroup 
                  label="Primary Headline" 
                  value={localSettings.hero_title || ""} 
                  onChange={(v) => handleChange("hero_title", v)}
                  onSave={() => handleSave("hero_title")}
                  isUpdating={isUpdating}
                  placeholder="We don't sell trips. We craft experiences."
                  isTextArea
                  hint="Use Enter for new lines. These will be animated word-by-word."
                />
                <InputGroup 
                  label="Sub-headline" 
                  value={localSettings.hero_subtitle || ""} 
                  onChange={(v) => handleChange("hero_subtitle", v)}
                  onSave={() => handleSave("hero_subtitle")}
                  isUpdating={isUpdating}
                  placeholder="A new standard in luxury travel..."
                  isTextArea
                />
              </div>
            </div>
          )}

          {activeCategory === "about" && (
            <div className="space-y-6">
              <SectionHeader title="Brand Story" description="Defining our vision, mission, and heritage." />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InputGroup 
                  label="Vision Statement" 
                  value={localSettings.about_vision_text || ""} 
                  onChange={(v) => handleChange("about_vision_text", v)}
                  onSave={() => handleSave("about_vision_text")}
                  isUpdating={isUpdating}
                  isTextArea
                />
                <InputGroup 
                  label="Mission Statement" 
                  value={localSettings.about_mission_text || ""} 
                  onChange={(v) => handleChange("about_mission_text", v)}
                  onSave={() => handleSave("about_mission_text")}
                  isUpdating={isUpdating}
                  isTextArea
                />
              </div>
              
              <div className="p-8 rounded-[40px] bg-[#1c1c1e] border border-white/[0.04]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">Brand Statistics</h4>
                    <p className="text-[10px] uppercase tracking-widest text-[#86868b] font-bold mt-1">Numerical highlights of our heritage.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const current = safeParse(localSettings.about_stats, []);
                      handleChange("about_stats", JSON.stringify([...current, { label: "", value: "" }]));
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    <Plus size={14} />
                    Add Stat
                  </button>
                </div>

                <div className="space-y-3">
                  {safeParse(localSettings.about_stats, []).map((stat: any, i: number) => (
                    <div key={i} className="flex gap-4 items-center animate-in fade-in slide-in-from-left-4 duration-300">
                      <input 
                        placeholder="Label (e.g. Founded)"
                        value={stat.label}
                        onChange={(e) => {
                          const stats = safeParse(localSettings.about_stats, []);
                          stats[i].label = e.target.value;
                          handleChange("about_stats", JSON.stringify(stats));
                        }}
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                      />
                      <input 
                        placeholder="Value (e.g. 2026)"
                        value={stat.value}
                        onChange={(e) => {
                          const stats = safeParse(localSettings.about_stats, []);
                          stats[i].value = e.target.value;
                          handleChange("about_stats", JSON.stringify(stats));
                        }}
                        className="w-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                      />
                      <button 
                        onClick={() => {
                          const stats = safeParse(localSettings.about_stats, []);
                          stats.splice(i, 1);
                          handleChange("about_stats", JSON.stringify(stats));
                        }}
                        className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleSave("about_stats")}
                  disabled={isUpdating}
                  className="mt-8 w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                >
                  {isUpdating ? "Syncing Stats..." : "Save All Statistics"}
                </button>
              </div>
            </div>
          )}

          {activeCategory === "quotes" && (
            <div className="space-y-6">
              <SectionHeader title="Editorial Quotes" description="Curated testimonials and philosophy." />
              
              <div className="p-8 rounded-[40px] bg-[#1c1c1e] border border-white/[0.04]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">Quote Collection</h4>
                    <p className="text-[10px] uppercase tracking-widest text-[#86868b] font-bold mt-1">The voices of TouraLuxe.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const current = safeParse(localSettings.editorial_quotes, []);
                      handleChange("editorial_quotes", JSON.stringify([...current, { quote: "", author: "", role: "" }]));
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    <Plus size={14} />
                    New Quote
                  </button>
                </div>

                <div className="space-y-6">
                  {safeParse(localSettings.editorial_quotes, []).map((q: any, i: number) => (
                    <div key={i} className="p-6 rounded-3xl bg-black/40 border border-white/5 space-y-4 relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <button 
                        onClick={() => {
                          const quotes = safeParse(localSettings.editorial_quotes, []);
                          quotes.splice(i, 1);
                          handleChange("editorial_quotes", JSON.stringify(quotes));
                        }}
                        className="absolute top-4 right-4 p-2 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      <textarea 
                        placeholder="Enter the quote here..."
                        value={q.quote}
                        onChange={(e) => {
                          const quotes = safeParse(localSettings.editorial_quotes, []);
                          quotes[i].quote = e.target.value;
                          handleChange("editorial_quotes", JSON.stringify(quotes));
                        }}
                        className="w-full h-24 bg-transparent border-b border-white/10 p-2 text-sm text-white focus:outline-none focus:border-white/30 transition-all resize-none italic"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="Author Name"
                          value={q.author}
                          onChange={(e) => {
                            const quotes = safeParse(localSettings.editorial_quotes, []);
                            quotes[i].author = e.target.value;
                            handleChange("editorial_quotes", JSON.stringify(quotes));
                          }}
                          className="bg-transparent border-b border-white/10 p-2 text-xs text-white/70 focus:outline-none focus:border-white/30 transition-all font-bold"
                        />
                        <input 
                          placeholder="Role / Title"
                          value={q.role}
                          onChange={(e) => {
                            const quotes = safeParse(localSettings.editorial_quotes, []);
                            quotes[i].role = e.target.value;
                            handleChange("editorial_quotes", JSON.stringify(quotes));
                          }}
                          className="bg-transparent border-b border-white/10 p-2 text-[10px] text-white/40 focus:outline-none focus:border-white/30 transition-all uppercase tracking-widest"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleSave("editorial_quotes")}
                  disabled={isUpdating}
                  className="mt-8 w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                >
                  {isUpdating ? "Syncing Quotes..." : "Update All Quotes"}
                </button>
              </div>
            </div>
          )}

          {activeCategory === "services" && (
            <div className="space-y-6">
              <SectionHeader title="Services Intro" description="The transition to our divisions." />
              <div className="grid grid-cols-1 gap-6">
                <InputGroup 
                  label="Section Title" 
                  value={localSettings.services_title || ""} 
                  onChange={(v) => handleChange("services_title", v)}
                  onSave={() => handleSave("services_title")}
                  isUpdating={isUpdating}
                  placeholder="Beyond First Class."
                />
                <InputGroup 
                  label="Section Description" 
                  value={localSettings.services_description || ""} 
                  onChange={(v) => handleChange("services_description", v)}
                  onSave={() => handleSave("services_description")}
                  isUpdating={isUpdating}
                  placeholder="Our specialized divisions cater to every facet..."
                  isTextArea
                />
              </div>
            </div>
          )}

          {activeCategory === "cta" && (
            <div className="space-y-6">
              <SectionHeader title="Final Call to Action" description="Closing the narrative arc." />
              <div className="grid grid-cols-1 gap-6">
                <InputGroup 
                  label="CTA Heading" 
                  value={localSettings.cta_title || ""} 
                  onChange={(v) => handleChange("cta_title", v)}
                  onSave={() => handleSave("cta_title")}
                  isUpdating={isUpdating}
                  placeholder="Ready to transcend the ordinary?"
                />
                <InputGroup 
                  label="CTA Subtext" 
                  value={localSettings.cta_description || ""} 
                  onChange={(v) => handleChange("cta_description", v)}
                  onSave={() => handleSave("cta_description")}
                  isUpdating={isUpdating}
                  placeholder="Connect with our travel curators..."
                  isTextArea
                />
                <InputGroup 
                  label="Button Text" 
                  value={localSettings.cta_button_text || ""} 
                  onChange={(v) => handleChange("cta_button_text", v)}
                  onSave={() => handleSave("cta_button_text")}
                  isUpdating={isUpdating}
                  placeholder="Have a Query? Speak to us"
                />
              </div>
            </div>
          )}

          {activeCategory === "contact" && (
            <div className="space-y-6">
              <SectionHeader title="Contact & Brand" description="Footer information and global identifiers." />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InputGroup 
                  label="Footer Tagline" 
                  value={localSettings.footer_tagline || ""} 
                  onChange={(v) => handleChange("footer_tagline", v)}
                  onSave={() => handleSave("footer_tagline")}
                  isUpdating={isUpdating}
                  placeholder="We don't sell trips. We craft transcendent experiences..."
                  isTextArea
                />
                <InputGroup 
                  label="Marquee Keywords (Comma Separated)" 
                  value={localSettings.marquee_words || ""} 
                  onChange={(v) => handleChange("marquee_words", v)}
                  onSave={() => handleSave("marquee_words")}
                  isUpdating={isUpdating}
                  placeholder="Explore, Discover, Journey..."
                  isTextArea
                />
                <InputGroup 
                  label="Support Email" 
                  value={localSettings.contact_email || ""} 
                  onChange={(v) => handleChange("contact_email", v)}
                  onSave={() => handleSave("contact_email")}
                  isUpdating={isUpdating}
                  placeholder="concierge@touraluxe.com"
                />
                <InputGroup 
                  label="Contact Phone" 
                  value={localSettings.contact_phone || ""} 
                  onChange={(v) => handleChange("contact_phone", v)}
                  onSave={() => handleSave("contact_phone")}
                  isUpdating={isUpdating}
                  placeholder="+1 (555) TOURALUXE"
                />
              {/* Offices List Manager Card */}
              <div className="p-8 rounded-[40px] bg-[#1c1c1e] border border-white/[0.04] col-span-1 lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">Our Offices & Map Links</h4>
                    <p className="text-[10px] uppercase tracking-widest text-[#86868b] font-bold mt-1">Specify office locations and optional Google Maps links.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const current = safeParse(localSettings.contact_offices, []);
                      const list = Array.isArray(current) ? current : [];
                      handleChange("contact_offices", JSON.stringify([...list, { name: "", mapUrl: "" }]));
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    <Plus size={14} />
                    Add Office
                  </button>
                </div>

                <div className="space-y-4">
                  {(() => {
                    const parsed = safeParse(localSettings.contact_offices, []);
                    const officesList = Array.isArray(parsed) 
                      ? parsed 
                      : (typeof localSettings.contact_offices === "string" && localSettings.contact_offices.length > 0)
                        ? localSettings.contact_offices.split(",").map(o => ({ name: o.trim(), mapUrl: "" }))
                        : [];

                    return officesList.map((office: any, i: number) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-black/20 p-4 rounded-3xl border border-white/[0.02] animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="md:col-span-4">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[#86868b] block mb-1">Office Name</label>
                          <input 
                            placeholder="e.g. Mumbai"
                            value={office.name || ""}
                            onChange={(e) => {
                              const list = [...officesList];
                              list[i] = { ...list[i], name: e.target.value };
                              handleChange("contact_offices", JSON.stringify(list));
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                          />
                        </div>
                        <div className="md:col-span-7">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[#86868b] block mb-1">Google Maps Link (Optional)</label>
                          <input 
                            placeholder="e.g. https://maps.google.com/?q=..."
                            value={office.mapUrl || ""}
                            onChange={(e) => {
                              const list = [...officesList];
                              list[i] = { ...list[i], mapUrl: e.target.value };
                              handleChange("contact_offices", JSON.stringify(list));
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-end md:justify-center pt-2 md:pt-6">
                          <button 
                            onClick={() => {
                              const list = [...officesList];
                              list.splice(i, 1);
                              handleChange("contact_offices", JSON.stringify(list));
                            }}
                            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                <button 
                  onClick={() => handleSave("contact_offices")}
                  disabled={isUpdating}
                  className="w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl font-bold"
                >
                  {isUpdating ? "Syncing Offices..." : "Save All Offices"}
                </button>
              </div>
                <InputGroup 
                  label="Opening Hours (One per line)" 
                  value={localSettings.contact_hours || ""} 
                  onChange={(v) => handleChange("contact_hours", v)}
                  onSave={() => handleSave("contact_hours")}
                  isUpdating={isUpdating}
                  placeholder="Mon - Fri: 10 am - 6 pm&#10;Saturday: Holidays&#10;Sunday: Holidays"
                  isTextArea
                  hint="Enter hours of operation, one entry per line."
                />
                <InputGroup 
                  label="Headquarters Address" 
                  value={localSettings.contact_address || ""} 
                  onChange={(v) => handleChange("contact_address", v)}
                  onSave={() => handleSave("contact_address")}
                  isUpdating={isUpdating}
                  placeholder="TouraLuxe LLC, One World Trade Center, Suite 85, New York, NY 10007"
                  isTextArea
                  hint="Optional: Specific detailed Headquarters address."
                />
                <InputGroup 
                  label="Contact Hero Banner Image URL" 
                  value={localSettings.contact_header_image || ""} 
                  onChange={(v) => handleChange("contact_header_image", v)}
                  onSave={() => handleSave("contact_header_image")}
                  isUpdating={isUpdating}
                  placeholder="/private_jet_interior_sunset_1777656427557.png"
                  hint="Direct URL for the top private jet sunset image or alternative."
                />
                <InputGroup 
                  label="Contact Hero Banner Subtitle" 
                  value={localSettings.contact_header_subtitle || ""} 
                  onChange={(v) => handleChange("contact_header_subtitle", v)}
                  onSave={() => handleSave("contact_header_subtitle")}
                  isUpdating={isUpdating}
                  placeholder="TouraLuxe Concierge"
                />
                <InputGroup 
                  label="Contact Hero Banner Title" 
                  value={localSettings.contact_header_title || ""} 
                  onChange={(v) => handleChange("contact_header_title", v)}
                  onSave={() => handleSave("contact_header_title")}
                  isUpdating={isUpdating}
                  placeholder="Let's Craft Your Journey"
                />
                <InputGroup 
                  label="Contact Details Column Subtitle" 
                  value={localSettings.contact_section_subtitle || ""} 
                  onChange={(v) => handleChange("contact_section_subtitle", v)}
                  onSave={() => handleSave("contact_section_subtitle")}
                  isUpdating={isUpdating}
                  placeholder="Global Concierge"
                />
                <InputGroup 
                  label="Contact Details Column Title" 
                  value={localSettings.contact_section_title || ""} 
                  onChange={(v) => handleChange("contact_section_title", v)}
                  onSave={() => handleSave("contact_section_title")}
                  isUpdating={isUpdating}
                  placeholder="Transcendent Service, Instantly Accessible."
                  isTextArea
                />
                <InputGroup 
                  label="Contact Details Column Description" 
                  value={localSettings.contact_section_description || ""} 
                  onChange={(v) => handleChange("contact_section_description", v)}
                  onSave={() => handleSave("contact_section_description")}
                  isUpdating={isUpdating}
                  placeholder="Whether co-creating a customized travel itinerary or managing a group manifest, our lifestyle curating specialists respond within hours."
                  isTextArea
                />
                <InputGroup 
                  label="Contact Form Subtitle" 
                  value={localSettings.contact_form_subtitle || ""} 
                  onChange={(v) => handleChange("contact_form_subtitle", v)}
                  onSave={() => handleSave("contact_form_subtitle")}
                  isUpdating={isUpdating}
                  placeholder="Inquiry Manifest"
                />
                <InputGroup 
                  label="Contact Form Title" 
                  value={localSettings.contact_form_title || ""} 
                  onChange={(v) => handleChange("contact_form_title", v)}
                  onSave={() => handleSave("contact_form_title")}
                  isUpdating={isUpdating}
                  placeholder="Submit Your Details"
                />
              </div>
            </div>
          )}

          {activeCategory === "discovery" && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionHeader title="Discovery Atmosphere" description="The visual foundation of the search experience." />
              <div className="grid grid-cols-1 gap-6 md:gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#48484a]">Atmosphere Asset</p>
                    <p className="hidden md:block text-[8px] uppercase tracking-widest text-[#86868b] font-bold">Ultrawide (21:9) recommended</p>
                  </div>
                  <div 
                    onClick={() => document.getElementById('discovery-upload')?.click()}
                    className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-[24px] md:rounded-[40px] bg-[#1c1c1e] border-2 border-dashed border-white/[0.04] hover:border-white/10 transition-all cursor-pointer group overflow-hidden flex flex-col items-center justify-center gap-4"
                  >
                    {localSettings.discovery_default_image ? (
                      <>
                        <img 
                          src={localSettings.discovery_default_image} 
                          alt="Default Background" 
                          className="absolute inset-0 w-full h-full object-cover opacity-30 md:opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                        />
                        <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            {isUploading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-white animate-spin" /> : <Upload className="w-4 h-4 md:w-5 md:h-5 text-white" />}
                          </div>
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">Replace Atmosphere Asset</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all duration-500">
                          {isUploading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" /> : <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-[#86868b] group-hover:text-white" />}
                        </div>
                        <div className="text-center px-6">
                          <p className="text-xs md:text-sm font-bold text-white tracking-tight">Upload Discovery Background</p>
                          <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#86868b] font-bold mt-1.5 leading-relaxed">Ultrawide (21:9) recommended for cinematic immersion.</p>
                        </div>
                      </>
                    )}
                    <input 
                      id="discovery-upload"
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                  </div>
                </div>

                <InputGroup 
                  label="Asset URL Override" 
                  value={localSettings.discovery_default_image || ""} 
                  onChange={(v) => handleChange("discovery_default_image", v)}
                  onSave={() => handleSave("discovery_default_image")}
                  isUpdating={isUpdating}
                  placeholder="URL to high-fidelity background image..."
                  hint="Direct URL for external asset hosting."
                />
              </div>
            </div>
          )}

          {activeCategory === "portal" && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionHeader title="Traveler Portal" description="The visual backdrop of the authenticated traveler experience." />
              <div className="grid grid-cols-1 gap-6 md:gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#48484a]">Portal Atmosphere Asset</p>
                    <p className="hidden md:block text-[8px] uppercase tracking-widest text-[#86868b] font-bold">Ultrawide (21:9) recommended</p>
                  </div>
                  <div
                    onClick={() => document.getElementById('portal-upload')?.click()}
                    className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-[24px] md:rounded-[40px] bg-[#1c1c1e] border-2 border-dashed border-white/[0.04] hover:border-white/10 transition-all cursor-pointer group overflow-hidden flex flex-col items-center justify-center gap-4"
                  >
                    {localSettings.portal_default_image ? (
                      <>
                        <img
                          src={localSettings.portal_default_image}
                          alt="Portal Background"
                          className="absolute inset-0 w-full h-full object-cover opacity-30 md:opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                        />
                        <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            {isUploading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-white animate-spin" /> : <Upload className="w-4 h-4 md:w-5 md:h-5 text-white" />}
                          </div>
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">Replace Portal Asset</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all duration-500">
                          {isUploading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" /> : <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-[#86868b] group-hover:text-white" />}
                        </div>
                        <div className="text-center px-6">
                          <p className="text-xs md:text-sm font-bold text-white tracking-tight">Upload Portal Background</p>
                          <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#86868b] font-bold mt-1.5 leading-relaxed">Displayed behind the traveler login and profile lounge.</p>
                        </div>
                      </>
                    )}
                    <input
                      id="portal-upload"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          const token = sessionStorage.getItem("admin_token") || "";
                          const res = await fetch("/api/upload", { method: "POST", headers: { "x-admin-token": token }, body: formData });
                          if (res.ok) {
                            const { url } = await res.json();
                            handleChange("portal_default_image", url);
                            await onUpdate("portal_default_image", url);
                          }
                        } catch (err) { console.error("Portal upload error:", err); }
                        finally { setIsUploading(false); }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                <InputGroup
                  label="Asset URL Override"
                  value={localSettings.portal_default_image || ""}
                  onChange={(v) => handleChange("portal_default_image", v)}
                  onSave={() => handleSave("portal_default_image")}
                  isUpdating={isUpdating}
                  placeholder="URL to high-fidelity portal background image..."
                  hint="Direct URL for external asset hosting."
                />
              </div>
            </div>
          )}

          {activeCategory === "intelligence" && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionHeader title="Discovery Intelligence" description="Manage synonyms and intent recommendations." />
              
              {loadingIntelligence ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                  
                  {/* Section 1: Synonyms */}
                  <div className="p-6 md:p-8 rounded-[32px] bg-[#1c1c1e] border border-white/[0.04]">
                    <h2 className="text-xl font-bold text-white mb-2 italic">Synonym Mapping</h2>
                    <p className="text-[10px] uppercase tracking-widest text-[#86868b] font-bold mb-6">Expand search vocabulary</p>

                    {/* Form */}
                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block mb-2">Target Word</label>
                        <input 
                          type="text" 
                          value={newWord}
                          onChange={(e) => setNewWord(e.target.value)}
                          placeholder="e.g. sea"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block mb-2">Synonyms (Comma separated)</label>
                        <input 
                          type="text" 
                          value={newSynonyms}
                          onChange={(e) => setNewSynonyms(e.target.value)}
                          placeholder="e.g. beach, ocean, coastal"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                        />
                      </div>
                      <button 
                        onClick={async () => {
                          if (!newWord.trim() || !newSynonyms.trim()) return;
                          const synonymArray = newSynonyms.split(",").map(s => s.trim()).filter(s => s.length > 0);
                          const { error } = await supabase
                            .from("search_synonyms")
                            .insert([{ word: newWord.toLowerCase().trim(), synonyms: synonymArray }]);
                          if (!error) {
                            setNewWord("");
                            setNewSynonyms("");
                            fetchIntelligence();
                          } else {
                            if (addNotification) {
                              addNotification(error.message, "error");
                            } else {
                              alert(error.message);
                            }
                          }
                        }}
                        className="w-full py-4 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#f5f5f7] transition-all"
                      >
                        Add Mapping
                      </button>
                    </div>

                    {/* List */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {synonyms.map(row => (
                        <div key={row.id} className="p-4 rounded-xl bg-black/20 border border-white/[0.03] flex justify-between items-center group hover:border-white/10 transition-all">
                          <div>
                            <p className="text-sm font-bold text-white">{row.word}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {row.synonyms.map((s: string) => (
                                <span key={s} className="text-[9px] uppercase font-bold tracking-wider text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{s}</span>
                              ))}
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              if (!confirm("Delete this synonym mapping?")) return;
                              const { error } = await supabase.from("search_synonyms").delete().eq("id", row.id);
                              if (!error) fetchIntelligence();
                            }}
                            className="p-2 text-[#48484a] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Intent Messages */}
                  <div className="p-6 md:p-8 rounded-[32px] bg-[#1c1c1e] border border-white/[0.04]">
                    <h2 className="text-xl font-bold text-white mb-2 italic">Intent Recommendations</h2>
                    <p className="text-[10px] uppercase tracking-widest text-[#86868b] font-bold mb-6">Controlled dynamic responses</p>

                    {/* Form */}
                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block mb-2">Intent Key</label>
                        <input 
                          type="text" 
                          value={newIntentKey}
                          onChange={(e) => setNewIntentKey(e.target.value)}
                          placeholder="e.g. romantic"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block mb-2">Poetic Template (Use {'{options}'} for dynamic insert)</label>
                        <textarea 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="e.g. Escape the ordinary and celebrate your love at {options}."
                          className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all resize-none"
                        />
                      </div>
                      <button 
                        onClick={async () => {
                          if (!newIntentKey.trim() || !newMessage.trim()) return;
                          const existing = messages.find(m => m.intent_key === newIntentKey.trim().toLowerCase());
                          if (existing) {
                            const { error } = await supabase
                              .from("intent_messages")
                              .update({ messages: [...existing.messages, newMessage.trim()] })
                              .eq("id", existing.id);
                            if (!error) {
                              setNewMessage("");
                              fetchIntelligence();
                            } else {
                              if (addNotification) {
                                addNotification(error.message, "error");
                              } else {
                                alert(error.message);
                              }
                            }
                          } else {
                            const { error } = await supabase
                              .from("intent_messages")
                              .insert([{ intent_key: newIntentKey.trim().toLowerCase(), messages: [newMessage.trim()] }]);
                            if (!error) {
                              setNewIntentKey("");
                              setNewMessage("");
                              fetchIntelligence();
                            } else {
                              if (addNotification) {
                                addNotification(error.message, "error");
                              } else {
                                alert(error.message);
                              }
                            }
                          }
                        }}
                        className="w-full py-4 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#f5f5f7] transition-all"
                      >
                        Add Template
                      </button>
                    </div>

                    {/* List */}
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {messages.map(row => (
                        <div key={row.id} className="p-4 rounded-xl bg-black/20 border border-white/[0.03] hover:border-white/10 transition-all">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{row.intent_key}</span>
                          </div>
                          <div className="space-y-2">
                            {row.messages.map((msg: string, idx: number) => (
                              <div key={idx} className="flex justify-between items-start gap-2 text-[12px] text-white/70 bg-white/5 p-2 rounded-lg group">
                                <p className="leading-relaxed flex-1">"{msg}"</p>
                                <button 
                                  onClick={async () => {
                                    const updatedMessages = row.messages.filter((_: string, i: number) => i !== idx);
                                    if (updatedMessages.length === 0) {
                                      if (!confirm("This will delete the entire intent category. Proceed?")) return;
                                      await supabase.from("intent_messages").delete().eq("id", row.id);
                                    } else {
                                      await supabase.from("intent_messages").update({ messages: updatedMessages }).eq("id", row.id);
                                    }
                                    fetchIntelligence();
                                  }}
                                  className="text-[#48484a] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="pb-4 border-b border-white/5">
      <h3 className="text-xl font-bold text-white italic tracking-tight">{title}</h3>
      <p className="text-[10px] uppercase tracking-widest text-[#86868b] font-bold mt-1">{description}</p>
    </div>
  );
}

function InputGroup({ label, value, onChange, onSave, isUpdating, placeholder, isTextArea, hint }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  onSave: () => void;
  isUpdating: boolean;
  placeholder?: string;
  isTextArea?: boolean;
  hint?: string;
}) {
  return (
    <div className="p-6 rounded-[32px] bg-[#1c1c1e] border border-white/[0.04] flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#48484a]">{label}</p>
        {hint && <p className="text-[8px] uppercase tracking-widest text-[#86868b] font-bold">{hint}</p>}
      </div>
      <div className="flex flex-col gap-4">
        {isTextArea ? (
          <textarea 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all resize-none"
          />
        ) : (
          <input 
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
          />
        )}
        <button 
          onClick={onSave}
          disabled={isUpdating}
          className="self-end px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          {isUpdating ? "Saving..." : "Sync Changes"}
        </button>
      </div>
    </div>
  );
}
