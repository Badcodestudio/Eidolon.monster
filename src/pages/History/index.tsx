import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Sparkles,
  Download,
  Copy,
  Check,
  Box,
  ArrowUpRight,
  Clock,
  Shirt,
  Compass,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// History comes from the database, so it belongs to the signed-in account on any device.
interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  prompt: string;
  title: string;
  style: string;
  clothing: string;
  pantheon?: string;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const updateHistory = async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) {
          setHistory([]);
          return;
        }
        const { data, error } = await supabase
          .from('generations')
          .select('id,prompt,result_url,share_title,quality,created_at')
          .eq('kind', 'image')
          .eq('blocked', false)
          .not('result_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        setHistory(
          (data ?? []).map((g) => ({
            id: String(g.id),
            timestamp: new Date(g.created_at as string).getTime(),
            imageUrl: g.result_url as string,
            prompt: String(g.prompt ?? ''),
            title: g.share_title || String(g.prompt ?? 'Creation').slice(0, 48),
            style: g.quality === 'high' ? 'High quality' : 'Standard',
            clothing: '',
          }))
        );
      } catch {
        setHistory([]);
      }
    };
    void updateHistory();

    window.addEventListener('eidolon_user_updated', updateHistory);
    return () => window.removeEventListener('eidolon_user_updated', updateHistory);
  }, []);

  const handleCopyPrompt = (id: string, promptText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-wider mb-2">
            <History className="w-3.5 h-3.5" />
            <span>SESSION & CREATION ARCHIVE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Generation History
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Every character, hybrid, and scene you synthesize is automatically preserved here. Never lose your prompt, attire picks, or high-res images if you navigate away.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/create')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black text-xs font-bold font-mono tracking-wider transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Studio</span>
          </button>
        </div>
      </div>

      {/* History Grid */}
      {history.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-gray-500">
            <Clock className="w-8 h-8 text-emerald-400/50" />
          </div>
          <h2 className="text-lg font-bold text-gray-200">No Generations Recorded Yet</h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            Whenever you click Synthesize in the studio or generate a character variant, it will be automatically cached here with full prompts, clothing presets, and direct 3D links.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition"
          >
            <span>Start Your First Synthesis</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {history.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleString();
            return (
              <div
                key={item.id}
                className="group relative bg-[#0D0F17] rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden flex flex-col shadow-xl"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F17] via-transparent to-black/30 pointer-events-none" />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-emerald-400 font-semibold">
                      {item.style}
                    </span>
                  </div>

                  {/* Quick Action Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/3d-models?imageUrl=${encodeURIComponent(item.imageUrl)}&prompt=${encodeURIComponent(item.prompt)}&title=${encodeURIComponent(item.title)}`);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white transition flex items-center gap-1 shadow-md shadow-blue-500/20"
                      title="Generate 3D mesh via Tripo3D"
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>Tripo 3D</span>
                    </button>

                    <a
                      href={item.imageUrl}
                      download={`${item.title.toLowerCase().replace(/\s+/g, '-')}.png`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-white/20 text-white transition"
                      title="Download image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-[#0D0F17]">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mb-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {dateStr}
                      </span>
                      {item.pantheon && <span className="text-gray-400">{item.pantheon}</span>}
                    </div>

                    <h2 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                      {item.title}
                    </h2>

                    {item.clothing && (
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 truncate">
                        <Shirt className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{item.clothing}</span>
                      </p>
                    )}
                  </div>

                  {/* Prompt Box & Copy */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="p-2 rounded-lg bg-[#07090E] border border-white/5 text-[11px] text-gray-300 font-mono line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => handleCopyPrompt(item.id, item.prompt, e)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1.5 transition"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Prompt Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          if (item.clothing) localStorage.setItem('eidolon_gen_clothing', item.clothing);
                          navigate('/create');
                        }}
                        className="text-[11px] text-gray-400 hover:text-white font-mono flex items-center gap-1 transition"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Re-load in Studio</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
