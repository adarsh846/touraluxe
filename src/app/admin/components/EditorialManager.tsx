"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, GripVertical, Upload, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DEFAULT_ABOUT_STATS = [
  { label: "Founded", value: "2026" },
  { label: "Global Reach", value: "120+ Cities" },
  { label: "Excellence", value: "Premium" },
  { label: "Execution", value: "Seamless" }
];

const DEFAULT_SERVICES = [
  {
    id: 1,
    title: "Luxury Tours",
    tagline: "Exclusive global access.",
    desc: "Bespoke luxury journeys across the world’s most exclusive destinations.",
    fullDesc: "We curate bespoke luxury journeys across the world’s most exclusive destinations—combining personalized itineraries, premium stays, and unforgettable experiences. From secluded Mediterranean villas to private island escapes, every journey is a masterpiece of comfort and discovery.",
    image: "/luxury_villa_secluded_1777655165196.webp",
    highlights: ["Personalized Itineraries", "Premium Property Access", "Luxury Urban Transfers", "Visa Concierge Support"],
    cta: "Book Your Journey"
  },
  {
    id: 2,
    title: "Group Trips",
    tagline: "Travel together, luxuriously.",
    desc: "Luxury backpacking and group journeys for those who seek connection and adventure.",
    fullDesc: "Inspired by the community spirit of the world's leading group travel sites, our Group Expeditions redefine collective travel. We combine the raw thrill of backpacking with the refinement of TouraLuxe. From shared villas in the Swiss Alps to curated group treks in Patagonia, we ensure you never travel alone while maintaining absolute comfort.",
    image: "/assets/services/group.png",
    highlights: ["Fixed-Date Departures", "Curated Group Villas", "Adventure Curation", "Community Events"],
    cta: "Join an Expedition"
  },
  {
    id: 3,
    title: "Adventure Tours",
    tagline: "Luxury at the edge.",
    desc: "High-altitude trekking, specialized biking, and elite survival experiences.",
    fullDesc: "For those who demand more than a vacation. Our Extreme division manages the logistics for high-risk, high-reward adventures. Whether it's a private biking expedition across the Spiti Valley or a guided ascent of a 6,000m peak, our precision planning keeps you safe at the edge of the world.",
    image: "/assets/services/extreme.png",
    highlights: ["Specialized Gear Logistics", "Elite Mountain Guides", "Off-Road Expeditions", "Satellite Comms Support"],
    cta: "Start Your Adventure"
  },
  {
    id: 4,
    title: "Luxury Honeymoons",
    tagline: "Absolute romantic perfection.",
    desc: "Choreographed romantic immersions where every detail is executed to achieve flawlessness.",
    fullDesc: "We craft the perfect beginning to your forever. Every detail—from the precise thread count of your linens to the timing of a private sunset dinner on a deserted sandbank—is choreographed to achieve absolute romantic perfection. Our Eternal Escapes are more than trips; they are immortal immersions in love, curated for those who demand nothing less than a flawless reality.",
    image: "/assets/services/honeymoon.png",
    highlights: ["Overwater Villas", "Private Island Dining", "Couples' Wellness", "Bespoke Romance Concierge"],
    cta: "Plan Your Honeymoon"
  },
  {
    id: 5,
    title: "MICE Events",
    tagline: "Corporate excellence redefined.",
    desc: "World-class Meetings, Incentives, Conferences, and Events across global destinations.",
    fullDesc: "Our MICE division delivers seamless, high-impact corporate programs that go beyond logistics. From executive board meetings and large-scale global summits to achievement-based incentive travel and gala events, we blend strategic expertise with elevated luxury to create meaningful, results-driven experiences.",
    image: "/corporate_event_exotic_1777655212281.webp",
    highlights: ["Global Summit Curation", "Executive Board Meetings", "Corporate Incentive Programs", "Event Management Solutions"],
    cta: "Plan Your Event"
  },
  {
    id: 6,
    title: "Custom Journeys",
    tagline: "Luxury tailored to you.",
    desc: "Fully customized journeys tailored to your specific preferences and travel style.",
    fullDesc: "Taking the 'Customized Tours' from our heritage and elevating them to art. We design fully bespoke journeys that reflect your unique interests. From vintage car tours through the Italian countryside to private museum access, we deliver seamless, luxurious experiences crafted just for you.",
    image: "/assets/services/bespoke.png",
    highlights: ["Tailored Itineraries", "Private Access Tours", "Boutique Stays", "Personalized Welcome"],
    cta: "Design Your Tour"
  },
  {
    id: 7,
    title: "AI Travel Planner",
    tagline: "Instant luxe itineraries.",
    desc: "Instant, AI-driven travel planning that learns from your desires.",
    fullDesc: "Taking the innovation of TouraLuxe to the digital frontier. Our AI Travel Planner uses generative intelligence to build complex itineraries in real-time. Simply describe your mood, and our system will bank the aircraft towards your next dream destination, presenting a fully-costed plan in seconds.",
    image: "/assets/services/ai.png",
    highlights: ["Generative Planning", "Instant Price Breakdown", "Dynamic Scenic Sync", "24/7 AI Support"],
    cta: "Start Planning"
  }
];

interface EditorialManagerProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<void>;
  isUpdating: boolean;
  addNotification?: (message: string, type: "success" | "error" | "info") => void;
}

// Helper to parse JSON safely
const safeParse = (str: string, fallback: any) => {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    return fallback;
  }
};

export function EditorialManager({ settings, onUpdate, isUpdating, addNotification }: EditorialManagerProps) {
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<"hero" | "about" | "quotes" | "services" | "cta" | "contact" | "discovery" | "portal" | "intelligence">("hero");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const [selectedServiceId, setSelectedServiceId] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const currentServicesList = useMemo(() => {
    return safeParse(localSettings.services_data, DEFAULT_SERVICES);
  }, [localSettings.services_data]);
  const handleServiceFieldChange = (serviceId: number, field: string, value: any) => {
    const list = [...currentServicesList];
    const index = list.findIndex(s => s.id === serviceId);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        [field]: value
      };
      handleChange("services_data", JSON.stringify(list));
    }
  };

  const handleAddDivision = () => {
    const nextId = currentServicesList.length > 0 
      ? Math.max(...currentServicesList.map((s: any) => s.id)) + 1 
      : 1;
    const newService = {
      id: nextId,
      title: `New Division ${nextId}`,
      tagline: "Exclusive global access.",
      desc: "A brief description of this new division.",
      fullDesc: "An immersive description of this new division for the modal view.",
      image: "/luxury_villa_secluded_1777655165196.webp",
      highlights: ["Personalized Itineraries", "Premium Access"],
      cta: "Explore Division"
    };
    const list = [...currentServicesList, newService];
    handleChange("services_data", JSON.stringify(list));
    setSelectedServiceId(nextId);
    if (addNotification) {
      addNotification("New service division added locally. Click 'Sync Division Settings' to persist.", "info");
    }
  };

  const handleDeleteDivision = (serviceId: number) => {
    const list = currentServicesList.filter((s: any) => s.id !== serviceId);
    handleChange("services_data", JSON.stringify(list));
    if (list.length > 0) {
      setSelectedServiceId(list[0].id);
    }
    if (addNotification) {
      addNotification("Service division removed locally. Click 'Sync Division Settings' to persist.", "info");
    }
  };

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
    { id: "portal", label: "Track Your Booking" },
    { id: "intelligence", label: "Discovery Intelligence" },
  ];



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
              <SectionHeader title="Brand Story & Heritage" description="Refining all titles, images, vision/mission narratives, and quotes." />

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#48484a]">About Hero Image Asset</p>
                  <p className="hidden md:block text-[8px] uppercase tracking-widest text-[#86868b] font-bold">Ultrawide (21:9) or Wide (16:9) recommended</p>
                </div>
                <div
                  onClick={() => document.getElementById('about-upload')?.click()}
                  className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-[24px] md:rounded-[40px] bg-[#1c1c1e] border-2 border-dashed border-white/[0.04] hover:border-white/10 transition-all cursor-pointer group overflow-hidden flex flex-col items-center justify-center gap-4"
                >
                  {localSettings.about_hero_image ? (
                    <>
                      <img
                        src={localSettings.about_hero_image}
                        alt="About Background"
                        className="absolute inset-0 w-full h-full object-cover opacity-30 md:opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                      />
                      <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          {isUploading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-white animate-spin" /> : <Upload className="w-4 h-4 md:w-5 md:h-5 text-white" />}
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">Replace About Hero Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all duration-500">
                        {isUploading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" /> : <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-[#86868b] group-hover:text-white" />}
                      </div>
                      <div className="text-center px-6">
                        <p className="text-xs md:text-sm font-bold text-white tracking-tight">Upload About Hero Background</p>
                        <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#86868b] font-bold mt-1.5 leading-relaxed">Displayed behind the About Us modal header.</p>
                      </div>
                    </>
                  )}
                  <input
                    id="about-upload"
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
                          handleChange("about_hero_image", url);
                          await onUpdate("about_hero_image", url);
                        }
                      } catch (err) { console.error("About hero upload error:", err); }
                      finally { setIsUploading(false); }
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InputGroup 
                  label="About Hero Image URL" 
                  value={localSettings.about_hero_image || ""} 
                  onChange={(v) => handleChange("about_hero_image", v)}
                  onSave={() => handleSave("about_hero_image")}
                  isUpdating={isUpdating}
                  placeholder="/about_hero.webp"
                />
                <InputGroup 
                  label="About Hero Subtitle" 
                  value={localSettings.about_hero_subtitle || ""} 
                  onChange={(v) => handleChange("about_hero_subtitle", v)}
                  onSave={() => handleSave("about_hero_subtitle")}
                  isUpdating={isUpdating}
                  placeholder="Luxury Redefined"
                />
                <InputGroup 
                  label="About Hero Title" 
                  value={localSettings.about_hero_title || ""} 
                  onChange={(v) => handleChange("about_hero_title", v)}
                  onSave={() => handleSave("about_hero_title")}
                  isUpdating={isUpdating}
                  placeholder="About Us"
                />
                <InputGroup 
                  label="Vision Column Subtitle" 
                  value={localSettings.about_vision_subtitle || ""} 
                  onChange={(v) => handleChange("about_vision_subtitle", v)}
                  onSave={() => handleSave("about_vision_subtitle")}
                  isUpdating={isUpdating}
                  placeholder="Our Vision"
                />
                <InputGroup 
                  label="Vision Column Heading" 
                  value={localSettings.about_vision_heading || ""} 
                  onChange={(v) => handleChange("about_vision_heading", v)}
                  onSave={() => handleSave("about_vision_heading")}
                  isUpdating={isUpdating}
                  placeholder="Setting new benchmarks in global travel."
                  isTextArea
                />
                <InputGroup 
                  label="Mission Column Subtitle" 
                  value={localSettings.about_mission_subtitle || ""} 
                  onChange={(v) => handleChange("about_mission_subtitle", v)}
                  onSave={() => handleSave("about_mission_subtitle")}
                  isUpdating={isUpdating}
                  placeholder="Our Mission"
                />
                <InputGroup 
                  label="Mission Column Heading" 
                  value={localSettings.about_mission_heading || ""} 
                  onChange={(v) => handleChange("about_mission_heading", v)}
                  onSave={() => handleSave("about_mission_heading")}
                  isUpdating={isUpdating}
                  placeholder="Exceptional services, seamless execution."
                  isTextArea
                />
                <InputGroup 
                  label="Vision Description Narrative" 
                  value={localSettings.about_vision_text || ""} 
                  onChange={(v) => handleChange("about_vision_text", v)}
                  onSave={() => handleSave("about_vision_text")}
                  isUpdating={isUpdating}
                  isTextArea
                />
                <InputGroup 
                  label="Mission Description Narrative" 
                  value={localSettings.about_mission_text || ""} 
                  onChange={(v) => handleChange("about_mission_text", v)}
                  onSave={() => handleSave("about_mission_text")}
                  isUpdating={isUpdating}
                  isTextArea
                />
                <InputGroup 
                  label="Bottom Quote" 
                  value={localSettings.about_bottom_quote || ""} 
                  onChange={(v) => handleChange("about_bottom_quote", v)}
                  onSave={() => handleSave("about_bottom_quote")}
                  isUpdating={isUpdating}
                  placeholder="We don't just sell trips. We craft transcendent experiences."
                  isTextArea
                />
                <InputGroup 
                  label="Bottom CTA Button Text" 
                  value={localSettings.about_bottom_button_text || ""} 
                  onChange={(v) => handleChange("about_bottom_button_text", v)}
                  onSave={() => handleSave("about_bottom_button_text")}
                  isUpdating={isUpdating}
                  placeholder="Explore Our World"
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
                      const current = safeParse(localSettings.about_stats, DEFAULT_ABOUT_STATS);
                      handleChange("about_stats", JSON.stringify([...current, { label: "", value: "" }]));
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    <Plus size={14} />
                    Add Stat
                  </button>
                </div>

                <div className="space-y-3">
                  {safeParse(localSettings.about_stats, DEFAULT_ABOUT_STATS).map((stat: any, i: number) => (
                    <div key={i} className="flex gap-4 items-center animate-in fade-in slide-in-from-left-4 duration-300">
                      <input 
                        placeholder="Label (e.g. Founded)"
                        value={stat.label}
                        onChange={(e) => {
                          const stats = safeParse(localSettings.about_stats, DEFAULT_ABOUT_STATS);
                          stats[i].label = e.target.value;
                          handleChange("about_stats", JSON.stringify(stats));
                        }}
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                      />
                      <input 
                        placeholder="Value (e.g. 2026)"
                        value={stat.value}
                        onChange={(e) => {
                          const stats = safeParse(localSettings.about_stats, DEFAULT_ABOUT_STATS);
                          stats[i].value = e.target.value;
                          handleChange("about_stats", JSON.stringify(stats));
                        }}
                        className="w-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                      />
                      <button 
                        onClick={() => {
                          const stats = safeParse(localSettings.about_stats, DEFAULT_ABOUT_STATS);
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

              <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white italic tracking-tight">Service Divisions</h3>
                  <p className="text-[10px] uppercase tracking-widest text-[#86868b] font-bold">
                    Edit title, tagline, description, cover image, and highlights for each specialized division.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleAddDivision}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10 hover:border-amber-400 transition-all shrink-0 active:scale-[0.98]"
                >
                  <Plus size={12} />
                  Add Category
                </button>
              </div>

              {/* Division Selectors */}
              <div className="flex flex-wrap items-center gap-2 p-2 bg-black/40 rounded-3xl border border-white/[0.05]">
                {currentServicesList.map((srv: any) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedServiceId === srv.id
                        ? "bg-white text-black shadow-lg scale-[1.02]"
                        : "text-[#86868b] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {srv.title || `Division ${srv.id}`}
                  </button>
                ))}
              </div>

              {/* Service Form */}
              {(() => {
                const srv = currentServicesList.find((s: any) => s.id === selectedServiceId) || currentServicesList[0];
                if (!srv) return null;
                return (
                  <div className="p-6 md:p-8 rounded-[32px] bg-[#1c1c1e] border border-white/[0.04] space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          Configure: {srv.title} (Division {srv.id})
                        </h4>
                        <span className="text-[9px] uppercase tracking-widest text-[#86868b] font-bold block">
                          Unsaved edits stay local until synced
                        </span>
                      </div>
                      
                      {currentServicesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            title: "Delete Service Category",
                            message: `Are you sure you want to delete "${srv.title}"? This action will remove the division locally. You will need to sync settings to persist the changes.`,
                            onConfirm: () => handleDeleteDivision(srv.id)
                          })}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          <Trash2 size={12} />
                          Delete Category
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block">Division Title</label>
                        <input
                          type="text"
                          value={srv.title || ""}
                          onChange={(e) => handleServiceFieldChange(srv.id, "title", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block">Division Tagline</label>
                        <input
                          type="text"
                          value={srv.tagline || ""}
                          onChange={(e) => handleServiceFieldChange(srv.id, "tagline", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block">Short Card Description</label>
                        <textarea
                          value={srv.desc || ""}
                          onChange={(e) => handleServiceFieldChange(srv.id, "desc", e.target.value)}
                          className="w-full h-20 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all resize-none"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block">Full Immersive Description (Modal)</label>
                        <textarea
                          value={srv.fullDesc || ""}
                          onChange={(e) => handleServiceFieldChange(srv.id, "fullDesc", e.target.value)}
                          className="w-full h-28 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block">Cover Image Path / URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={srv.image || ""}
                            onChange={(e) => handleServiceFieldChange(srv.id, "image", e.target.value)}
                            placeholder="/luxury_villa_secluded_1777655165196.webp"
                            className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`service-image-upload-${srv.id}`)?.click()}
                            className="px-5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0"
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>Upload</span>
                          </button>
                        </div>
                        <input
                          id={`service-image-upload-${srv.id}`}
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
                              const res = await fetch("/api/upload", { 
                                method: "POST", 
                                headers: { "x-admin-token": token }, 
                                body: formData 
                              });
                              if (res.ok) {
                                const { url } = await res.json();
                                handleServiceFieldChange(srv.id, "image", url);
                                if (addNotification) {
                                  addNotification("Image uploaded successfully. Save changes to sync.", "success");
                                }
                              } else {
                                if (addNotification) {
                                  addNotification("Upload failed.", "error");
                                }
                              }
                            } catch (err) { 
                              console.error("Service image upload error:", err); 
                              if (addNotification) {
                                addNotification("Upload error.", "error");
                              }
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                          className="hidden"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block">CTA Button Text</label>
                        <input
                          type="text"
                          value={srv.cta || ""}
                          onChange={(e) => handleServiceFieldChange(srv.id, "cta", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#48484a] block">
                          Division Highlights
                        </label>
                        <div className="space-y-3 mt-2">
                          {(srv.highlights || []).map((h: string, i: number) => (
                            <div key={i} className="flex gap-2">
                              <input
                                type="text"
                                value={h}
                                onChange={(e) => {
                                  const newHighlights = [...(srv.highlights || [])];
                                  newHighlights[i] = e.target.value;
                                  handleServiceFieldChange(srv.id, "highlights", newHighlights);
                                }}
                                className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                              />
                              {(srv.highlights || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newHighlights = (srv.highlights || []).filter((_: any, idx: number) => idx !== i);
                                    handleServiceFieldChange(srv.id, "highlights", newHighlights);
                                  }}
                                  className="p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500 rounded-2xl transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newHighlights = [...(srv.highlights || []), ""];
                              handleServiceFieldChange(srv.id, "highlights", newHighlights);
                            }}
                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                          >
                            <Plus size={14} /> Add Highlight
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleSave("services_data")}
                        disabled={isUpdating}
                        className="px-8 py-3.5 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-[0.98]"
                      >
                        {isUpdating ? "Saving Divisions..." : "Sync Division Settings"}
                      </button>
                    </div>
                  </div>
                );
              })()}
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
                <InputGroup 
                  label="WhatsApp Contact Number" 
                  value={localSettings.whatsapp_number || ""} 
                  onChange={(v) => handleChange("whatsapp_number", v)}
                  onSave={() => handleSave("whatsapp_number")}
                  isUpdating={isUpdating}
                  placeholder="+1 (555) TOURALUXE"
                  hint="For floating chat button & booking assistance."
                />
                <InputGroup 
                  label="Instagram Profile Link" 
                  value={localSettings.instagram_url || ""} 
                  onChange={(v) => handleChange("instagram_url", v)}
                  onSave={() => handleSave("instagram_url")}
                  isUpdating={isUpdating}
                  placeholder="https://instagram.com/touraluxe"
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
                  placeholder="Enter headquarters details..."
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
              <SectionHeader title="Track Your Booking" description="The visual backdrop of the authenticated traveler experience." />
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
                            onClick={() => setConfirmDialog({
                              isOpen: true,
                              title: "Delete Synonym Mapping",
                              message: `Are you sure you want to delete the synonym mapping for "${row.word}"?`,
                              onConfirm: async () => {
                                const { error } = await supabase.from("search_synonyms").delete().eq("id", row.id);
                                if (!error) fetchIntelligence();
                              }
                            })}
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
                                  onClick={() => {
                                    const updatedMessages = row.messages.filter((_: string, i: number) => i !== idx);
                                    if (updatedMessages.length === 0) {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: "Delete Intent Category",
                                        message: `This will delete the entire intent category "${row.intent_key}". Proceed?`,
                                        onConfirm: async () => {
                                          await supabase.from("intent_messages").delete().eq("id", row.id);
                                          fetchIntelligence();
                                        }
                                      });
                                    } else {
                                      const performUpdate = async () => {
                                        await supabase.from("intent_messages").update({ messages: updatedMessages }).eq("id", row.id);
                                        fetchIntelligence();
                                      };
                                      performUpdate();
                                    }
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
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-md p-8 rounded-[32px] bg-[#1c1c1e] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.8)] mx-4 transform animate-in zoom-in-95 duration-300 ease-out space-y-6">
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white tracking-tight">{confirmDialog.title}</h4>
                <p className="text-xs text-white/50 leading-relaxed">{confirmDialog.message}</p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-6 py-2.5 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
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
