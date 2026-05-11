"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface EditorialManagerProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<void>;
  isUpdating: boolean;
}

export function EditorialManager({ settings, onUpdate, isUpdating }: EditorialManagerProps) {
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<"hero" | "about" | "quotes" | "services" | "cta" | "contact">("hero");

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string, customValue?: string) => {
    await onUpdate(key, customValue ?? (localSettings[key] || ""));
  };

  const categories = [
    { id: "hero", label: "Hero Narrative" },
    { id: "about", label: "Brand Story" },
    { id: "quotes", label: "Editorial Quotes" },
    { id: "services", label: "Services Header" },
    { id: "cta", label: "Final CTA" },
    { id: "contact", label: "Contact & Footer" },
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
                  placeholder="Begin Your Journey"
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
              </div>
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
