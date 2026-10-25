import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShieldCheck, FileText, Lock, AlertCircle, Scale, CreditCard, CheckCircle2 } from 'lucide-react';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'refund' | 'content'>('terms');

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6E8EC]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 sm:px-12 pt-36 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest">
            <Scale className="w-3.5 h-3.5" />
            Compliance & Legal Architecture
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-sans">
            Terms, Privacy & Billing Policies
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Transparent legal terms for digital character creators, worldbuilders, and commercial licensing. Last updated: February 2026.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'terms'
                ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20'
                : 'bg-[#10131B] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <FileText className="w-4 h-4" />
            Terms of Service
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'privacy'
                ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20'
                : 'bg-[#10131B] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Lock className="w-4 h-4" />
            Privacy & Data Security
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'refund'
                ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20'
                : 'bg-[#10131B] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Billing & Refund Policy
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'content'
                ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20'
                : 'bg-[#10131B] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Content Policy & 18+ Verification
          </button>
        </div>

        {/* Tab Contents */}
        <div className="bg-[#0E1015] border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl">
          {/* 1. TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-8 text-sm leading-relaxed text-gray-300">
              <div className="border-b border-white/10 pb-6">
                <h2 className="text-2xl font-bold text-white mb-2">1. Terms of Service & Platform License</h2>
                <p className="text-gray-400 text-xs">
                  By accessing or subscribing to Eidolon.monster, you agree to enter into a legally binding agreement with Eidolon Monster Synthesis Systems.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Commercial Ownership & Intellectual Property
                </h3>
                <p>
                  All synthetic character artwork, conceptual blueprints, and visual assets generated through your active subscription tier remain <strong>100% owned by you</strong>. Eidolon.monster grants you perpetual, irrevocable worldwide commercial rights to sell, publish, reproduce, and redistribute your outputs across digital games, print media, tabletop RPG publications, and web properties.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Account Sovereignty & API Pipeline Access
                </h3>
                <p>
                  Subscribers are responsible for safeguarding their API credentials, fal.ai connection tokens, and account keys. You agree not to reverse-engineer, exploit rate limits, or engage in malicious GPU cluster denial of service.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Age Requirement & Identity Verification
                </h3>
                <p>
                  Eidolon.monster is strictly restricted to adults who are at least 18 years of age (or the legal age of majority in your jurisdiction). By opening an account or purchasing generation allocations, you warrant that you meet this requirement.
                </p>
              </div>
            </div>
          )}

          {/* 2. PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-8 text-sm leading-relaxed text-gray-300">
              <div className="border-b border-white/10 pb-6">
                <h2 className="text-2xl font-bold text-white mb-2">2. Privacy, Vault Encryption & Zero-Data Retention</h2>
                <p className="text-gray-400 text-xs">
                  We treat creative prompts and character concepts with supreme cryptographic confidentiality.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Client-Side Vault Architecture</h3>
                <p>
                  API tokens and prompt configuration keys stored in your browser session or local sandbox are kept encrypted in local browser storage. We never sell, rent, or distribute personal user information or proprietary prompt recipes to advertising brokers.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">AI Inference Logging & Data Sharing</h3>
                <p>
                  External inference runs through fal.ai endpoints operate under zero-retention enterprise agreements. Your generated character visuals are not harvested to retrain public baseline foundational models without your express authorization.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Payment Processor Tokenization</h3>
                <p>
                  Payment transactions are processed through tier-1 PCI-DSS compliant gateways (Stripe & Merchant of Record). Eidolon.monster never sees, stores, or logs raw credit card numbers or CVV codes.
                </p>
              </div>
            </div>
          )}

          {/* 3. BILLING & REFUND POLICY */}
          {activeTab === 'refund' && (
            <div className="space-y-8 text-sm leading-relaxed text-gray-300">
              <div className="border-b border-white/10 pb-6">
                <h2 className="text-2xl font-bold text-white mb-2">3. Billing Pipeline, Subscriptions & Refund Policy</h2>
                <p className="text-gray-400 text-xs">
                  Fair, clear billing terms with instant cancellation anytime.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Billing Cycle & Allocation Refresh</h3>
                <p>
                  Subscriptions are billed monthly on a recurring schedule based on the date of activation. Fast GPU generation allocations refresh automatically at the start of each billing cycle. Unused monthly allocations do not rollover past consecutive active cycles.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">14-Day Creator Guarantee & Refund Eligibility</h3>
                <p>
                  If you encounter persistent technical issues with GPU cluster generation or are dissatisfied within <strong>14 days of your initial purchase</strong> (and have utilized fewer than 50 fast generations), contact <a href="mailto:billing@eidolon.monster" className="text-emerald-400 underline">billing@eidolon.monster</a> for a full, prompt refund.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Immediate Self-Serve Cancellation</h3>
                <p>
                  You can pause or cancel your subscription at any time directly through your billing portal with one click. Upon cancellation, your account retains full generation privileges until the conclusion of your current prepaid billing month.
                </p>
              </div>
            </div>
          )}

          {/* 4. CONTENT & COMPLIANCE */}
          {activeTab === 'content' && (
            <div className="space-y-8 text-sm leading-relaxed text-gray-300">
              <div className="border-b border-white/10 pb-6">
                <h2 className="text-2xl font-bold text-white mb-2">4. Content Guidelines & Upstream Provider Safety</h2>
                <p className="text-gray-400 text-xs">
                  Operating with utmost integrity, creative freedom, and safety standard compliance.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Safety Alignment & Prohibited Subjects</h3>
                <p>
                  Eidolon.monster enforces a strict zero-tolerance policy against unlawful content. The following are strictly prohibited and result in immediate, non-refundable termination:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  <li>Any depiction, simulation, or exploitation involving minors or non-consensual imagery.</li>
                  <li>Real-world hate speech, direct violence inciting bodily harm, or non-consensual deepfakes of real individuals.</li>
                  <li>Attempts to intentionally circumvent foundational model guardrails.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Upstream API Compliance (fal.ai FLUX)</h3>
                <p>
                  Our cloud GPU pipelines utilize fal.ai diffusion endpoints. As stated, upstream API providers filter photorealistic explicit nudity. Eidolon.monster focuses on high-fidelity character concept design, gothic fantasy, armor styling, mythical chimera hybrid archetypes, and cinematic atmospheric art.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}