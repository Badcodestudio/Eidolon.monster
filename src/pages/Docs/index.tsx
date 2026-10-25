import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Copy, Check } from 'lucide-react';

export default function DocsPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedGuidance, setCopiedGuidance] = useState(false);

  const masterGuidancePrompt = "Gothic/Alt art style, female figure, Cosplay representation of [COURT] mythos: [NAME] (Goddess - [TITLE]), Chaotic Neutral, Attire: Ornate Ceremonial Armor with Runic Gold Filigree + [1 ANIMAL TRAIT] + [1 SKIN/TRAIT], full body shot, [YOUR SETTING #4], Cinematic Chiaroscuro, wallpaper grade masterpiece";

  const samplePrompts = [
    {
      title: 'Nordic Skadi Hunter (Photorealistic)',
      code: `/synthesize --pantheon norse --style realism --seed 84920
"Shieldmaiden of Jotunheim, frost-bitten cheekbones, braided white fur cloak, bone-carved recurve bow, blizzard atmosphere, 85mm anamorphic portrait"`,
    },
    {
      title: 'Mesoamerican Kukulkan Demigod (Gothic Alt)',
      code: `/synthesize --pantheon mayan --style gothic-hybrid
"Quetzal feathered feathered-serpent priestess, jade inlaid ceremonial teeth, obsidian sacrificial blade, cenote reflection, volumetric emerald fog"`,
    },
    {
      title: 'Anthropomorphic Feline Ronin (Anime Key Art)',
      code: `/synthesize --pantheon japanese-neo --style anime-action
"Calico cat beastman samurai with damaged cybernetic eyepatch, dual plasma katanas, cherry blossom petals falling over neon rain puddles"`,
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6E8EC]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 sm:px-12 pt-36 pb-24 space-y-16">
        {/* Header */}
        <div className="space-y-4">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400">
            DEVELOPER & CREATOR DOCUMENTATION
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-sans">
            Prompt Engineering & API Guide
          </h1>
          <p className="text-base text-gray-400 max-w-2xl font-light">
            Master the syntax of the Eidolon neural engine to unlock complex mythological attributes, hybrid anatomy, and film-grade atmospheres.
          </p>
        </div>

        {/* Prompt Tweaking & Guidance Card */}
        <div className="rounded-2xl overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-[#0D121B] via-[#0C0E14] to-[#080A0E] shadow-xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                PROMPT TWEAKING & SYNTHESIS GUIDANCE
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white font-sans mt-2">
                Master Mythos Character Blueprint
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Use this exact parametric formulation to construct high-cohesion, wallpaper-grade dark fantasy characters.
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(masterGuidancePrompt);
                setCopiedGuidance(true);
                setTimeout(() => setCopiedGuidance(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-mono tracking-wider transition self-start sm:self-auto shrink-0 shadow-lg shadow-emerald-500/20"
            >
              {copiedGuidance ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>COPIED TEMPLATE</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>COPY TEMPLATE</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#07080B] border border-white/10 font-mono text-xs sm:text-sm text-emerald-300 leading-relaxed overflow-x-auto selection:bg-emerald-500/30 selection:text-white">
            <code>"{masterGuidancePrompt}"</code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-[11px] text-gray-400 font-mono">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-emerald-400 block font-bold">[COURT]</span>
              Infernal, Unseelie Fae, Greek, Norse, Slavic
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-emerald-400 block font-bold">[NAME & TITLE]</span>
              Deity, sovereign, or dark court title
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-emerald-400 block font-bold">[TRAITS]</span>
              1 Animal trait + 1 Skin/horror trait
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-emerald-400 block font-bold">[SETTING #4]</span>
              Throne of bones, cliff at storm, demon bazaar
            </div>
          </div>
        </div>

        {/* Quick Reference Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#0F1116] border border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Supported Pantheons</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Norse (Aesir/Vanir), Greco-Roman, Mayan, Aztec, Egyptian, Celtic, Slavic, Shinto, Yoruba, and Chimeric Pantheons.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-[#0F1116] border border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Visual Ratios</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Standard 1:1 square, 4:5 portrait (recommended for character cards), 16:9 landscape vista, and 9:16 mobile canvas.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-[#0F1116] border border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Prompt Parameters</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Use flags like <code className="text-emerald-400 bg-white/5 px-1 py-0.5 rounded">--pantheon</code>, <code className="text-emerald-400 bg-white/5 px-1 py-0.5 rounded">--style</code>, and <code className="text-emerald-400 bg-white/5 px-1 py-0.5 rounded">--chaos</code>.
            </p>
          </div>
        </div>

        {/* Prompt Blueprint Examples */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
            Reference Syntax Blueprints
          </h2>

          <div className="space-y-4">
            {samplePrompts.map((item, idx) => (
              <div key={item.title} className="rounded-xl overflow-hidden border border-white/10 bg-[#0C0E13]">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#12151D]">
                  <span className="text-xs font-semibold text-gray-300">{item.title}</span>
                  <button
                    onClick={() => handleCopy(item.code, idx)}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>COPY SYNTAX</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-5 font-mono text-xs text-gray-300 leading-relaxed overflow-x-auto">
                  <pre className="text-emerald-400/90 whitespace-pre-wrap">{item.code}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
