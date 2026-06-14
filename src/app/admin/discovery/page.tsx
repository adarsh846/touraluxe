"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface SynonymRow {
  id: number;
  word: string;
  synonyms: string[];
}

interface IntentMessageRow {
  id: number;
  intent_key: string;
  messages: string[];
}

export default function DiscoveryAdmin() {
  const [synonyms, setSynonyms] = useState<SynonymRow[]>([]);
  const [messages, setMessages] = useState<IntentMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  // New Synonym Form State
  const [newWord, setNewWord] = useState("");
  const [newSynonyms, setNewSynonyms] = useState("");

  // New Message Form State
  const [newIntentKey, setNewIntentKey] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const getToken = useCallback(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
      return null;
    }
    return token;
  }, [router]);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
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
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchData();
    
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchData]);

  // --- Handlers for Synonyms ---
  const handleAddSynonym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newSynonyms.trim()) return;

    const synonymArray = newSynonyms.split(",").map(s => s.trim()).filter(s => s.length > 0);
    
    const { error } = await supabase
      .from("search_synonyms")
      .insert([{ word: newWord.toLowerCase().trim(), synonyms: synonymArray }]);

    if (!error) {
      setNewWord("");
      setNewSynonyms("");
      fetchData();
    } else {
      alert(error.message);
    }
  };

  const handleDeleteSynonym = async (id: number) => {
    if (!confirm("Delete this synonym mapping?")) return;
    const { error } = await supabase.from("search_synonyms").delete().eq("id", id);
    if (!error) fetchData();
  };

  // --- Handlers for Intent Messages ---
  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntentKey.trim() || !newMessage.trim()) return;

    // Check if intent already exists
    const existing = messages.find(m => m.intent_key === newIntentKey.trim().toLowerCase());

    if (existing) {
      // Append to existing
      const { error } = await supabase
        .from("intent_messages")
        .update({ messages: [...existing.messages, newMessage.trim()] })
        .eq("id", existing.id);

      if (!error) {
        setNewMessage("");
        fetchData();
      }
    } else {
      // Create new
      const { error } = await supabase
        .from("intent_messages")
        .insert([{ intent_key: newIntentKey.trim().toLowerCase(), messages: [newMessage.trim()] }]);

      if (!error) {
        setNewIntentKey("");
        setNewMessage("");
        fetchData();
      }
    }
  };

  const handleDeleteMessage = async (id: number, messageIndex: number) => {
    const row = messages.find(m => m.id === id);
    if (!row) return;

    const updatedMessages = row.messages.filter((_, i) => i !== messageIndex);

    if (updatedMessages.length === 0) {
      if (!confirm("This will delete the entire intent category. Proceed?")) return;
      await supabase.from("intent_messages").delete().eq("id", id);
    } else {
      await supabase.from("intent_messages").update({ messages: updatedMessages }).eq("id", id);
    }
    fetchData();
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] px-4 md:px-8 ${
          isScrolled ? "py-3" : "py-4 md:py-6"
        }`}
      >
        <div 
          className="pointer-events-none absolute inset-0 transition-all duration-1000 backdrop-blur-[5px]" 
          style={{ 
            opacity: isScrolled ? 0.95 : 0.85,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.05) 85%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 90%, transparent 100%)",
          }}
        />
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center bg-[#f5f5f7] rounded-full overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] w-28 h-10 cursor-pointer" onClick={() => router.push("/admin/dashboard")}>
              <div className="relative w-28 h-10 flex items-center justify-center">
                <Image src="/assets/logo-transparent.webp" alt="TouraLuxe" fill priority className="object-contain scale-[2.1] translate-y-[4px] brightness-[0.05]" />
              </div>
            </div>
            <span className="hidden lg:inline-block text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
              Discovery Engine
            </span>
          </div>
          
          <button 
            onClick={() => router.push("/admin/dashboard")} 
            className="px-5 py-2 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#f5f5f7] transition-all active:scale-95"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight italic uppercase mb-10">Discovery Intelligence</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          
          {/* Section 1: Synonyms */}
          <div className="p-6 md:p-8 rounded-[32px] bg-[#1c1c1e] border border-white/[0.04]">
            <h2 className="text-xl font-bold text-white mb-2 italic">Synonym Mapping</h2>
            <p className="text-[10px] uppercase tracking-widest text-[#86868b] font-bold mb-6">Expand search vocabulary</p>

            {/* Form */}
            <form onSubmit={handleAddSynonym} className="space-y-4 mb-8">
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
              <button type="submit" className="w-full py-4 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#f5f5f7] transition-all">Add Mapping</button>
            </form>

            {/* List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {synonyms.map(row => (
                <div key={row.id} className="p-4 rounded-xl bg-black/20 border border-white/[0.03] flex justify-between items-center group hover:border-white/10 transition-all">
                  <div>
                    <p className="text-sm font-bold text-white">{row.word}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {row.synonyms.map(s => (
                        <span key={s} className="text-[9px] uppercase font-bold tracking-wider text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteSynonym(row.id)} className="p-2 text-[#48484a] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
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
            <form onSubmit={handleAddMessage} className="space-y-4 mb-8">
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
              <button type="submit" className="w-full py-4 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#f5f5f7] transition-all">Add Template</button>
            </form>

            {/* List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {messages.map(row => (
                <div key={row.id} className="p-4 rounded-xl bg-black/20 border border-white/[0.03] hover:border-white/10 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{row.intent_key}</span>
                  </div>
                  <div className="space-y-2">
                    {row.messages.map((msg, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2 text-[12px] text-white/70 bg-white/5 p-2 rounded-lg group">
                        <p className="leading-relaxed flex-1">"{msg}"</p>
                        <button onClick={() => handleDeleteMessage(row.id, idx)} className="text-[#48484a] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
