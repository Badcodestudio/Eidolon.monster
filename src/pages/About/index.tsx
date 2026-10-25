import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShieldCheck, Compass, EyeOff } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6E8EC]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 sm:px-12 pt-36 pb-24 space-y-20">
        {/* Header */}
        <div className="space-y-4">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400">
            PHILOSOPHY & ETHOS
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-sans">
            Character Synthesis for Unbounded Worlds
          </h1>
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-light pt-2">
            Eidolon was born from a fundamental frustration: digital storytellers, dark fantasy authors, and indie game developers being constrained by sanitized, overly cautious AI platforms.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-[#0F1116] border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Global Pantheon Fidelity
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              We reject the Western-centric baseline of typical generative models. Eidolon was specifically trained on Mayan, Aztec, Yoruba, Celtic, Norse, Slavic, and ancient Shinto archetypes to ensure cultural nuance and authentic iconography.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#0F1116] border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              No Artistic Infantilization
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Mature art deals with danger, mortality, seduction, chimerism, and grim-dark grit. As long as creation adheres to strict legal compliance, we never restrict visceral fantasy, gothic horror, or alternative aesthetics.
            </p>
          </div>
        </div>

        {/* Compliance statement */}
        <div className="p-8 rounded-2xl bg-[#12151D] border border-emerald-500/30 flex items-start space-x-5">
          <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Legal Boundary & Ethical Architecture
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              We empower mature creative expression within lawful boundaries. fal.ai and our synthesis pipelines enforce standard content policies, while maintaining zero-tolerance guardrails against non-consensual imagery and unlawful material. Every generated seed is logged under sovereign user copyright.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
