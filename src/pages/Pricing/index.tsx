import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Check, Shield, Lock, CreditCard, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<{
    name: string;
    price: string;
    credits: string;
    stripeBuyButtonId?: string;
    stripePublishableKey?: string;
  } | null>(null);

  const [paymentStep, setPaymentStep] = useState<'details' | 'success'>('details');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const plans = [
    {
      name: 'APPRENTICE',
      price: '$19',
      period: '/month',
      description: 'Ideal for independent digital artists and concept explorers.',
      credits: '800 Fast Generations / mo',
      stripeBuyButtonId: 'buy_btn_1UUTYiHqofjXeuB9uFYlE91y',
      stripePublishableKey: 'pk_test_51UFZI4HqofjXeuB9ijJmYiIGeiOaf8tuHgJIYJ2IQD6NeHAc2PoCvWChLXVFUNTPAFeABGntfFGggCuUmMOzQ4eh005I4SkGrw',
      features: [
        'Standard & High-Res Upscaling (4K)',
        'Access to Greek, Norse & Celtic Pantheons',
        'Standard Anime & Stylized Models',
        'Commercial Usage Rights',
        'Direct Discord Community Access',
      ],
      popular: false,
      cta: 'SELECT APPRENTICE',
    },
    {
      name: 'ARCHETYPE PRO',
      price: '$49',
      period: '/month',
      description: 'Built for professional worldbuilders and studio character artists.',
      credits: '2,500 Ultra-Fast Generations / mo',
      stripeBuyButtonId: 'buy_btn_1UUTYiHqofjXeuB9uFYlE91y',
      stripePublishableKey: 'pk_test_51UFZI4HqofjXeuB9ijJmYiIGeiOaf8tuHgJIYJ2IQD6NeHAc2PoCvWChLXVFUNTPAFeABGntfFGggCuUmMOzQ4eh005I4SkGrw',
      features: [
        'Masterwork 8K Ultra-Res Output',
        'All Pantheons (Greek, Norse, Mayan, Chinese, Celtic, Occult)',
        'Full Anthropomorphic & Gothic Pipelines',
        'Parallel Batch Generation (4x)',
        'Custom Runic Fine-Tuning Seeds',
        'Priority GPU Cluster Access',
      ],
      popular: true,
      cta: 'GET ARCHETYPE PRO',
    },
    {
      name: 'STUDIO GUILD',
      price: '$129',
      period: '/month',
      description: 'Full creative sovereignty for indie game studios & creative guilds.',
      credits: 'Unlimited Standard / 8,000 Turbo',
      stripeBuyButtonId: 'buy_btn_1UUTYiHqofjXeuB9uFYlE91y',
      stripePublishableKey: 'pk_test_51UFZI4HqofjXeuB9ijJmYiIGeiOaf8tuHgJIYJ2IQD6NeHAc2PoCvWChLXVFUNTPAFeABGntfFGggCuUmMOzQ4eh005I4SkGrw',
      features: [
        'Dedicated GPU Cluster node',
        'Full API & Automated Pipeline Access',
        'Multi-Seat Team Workspace (5 Seats)',
        'Private Custom Fine-Tuning Weights',
        'Dedicated 24/7 Technical Liaison',
      ],
      popular: false,
      cta: 'DEPLOY GUILD NODE',
    },
  ];

  const handleOpenCheckout = (plan: typeof plans[0]) => {
    setSelectedCheckoutPlan(plan);
    setPaymentStep('details');
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStep('success');
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6E8EC]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-36 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" />
            Active Role: Studio Administrator & Owner
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-sans">
            Transparent Pricing.<br />Creative Freedom.
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            Choose the synthesis allocation tailored for your production pipeline. Built for dark fantasy, anime, and character artists.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 border ${
                plan.popular
                  ? 'bg-[#10131B] border-emerald-500/50 shadow-2xl shadow-emerald-500/10'
                  : 'bg-[#0E1015] border-white/10 hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-black text-[11px] font-extrabold uppercase tracking-widest">
                  MOST POPULAR
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-200">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{plan.period}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">{plan.description}</p>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-4">
                    {plan.credits}
                  </span>
                  <ul className="space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start text-xs text-gray-300 gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                {plan.name === 'STUDIO GUILD' ? (
                  <div className="space-y-2">
                    <div className="w-full py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      YOUR CURRENT TIER: OWNER / ADMIN
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(plan)}
                      className="w-full py-2.5 rounded-xl text-[11px] font-mono text-gray-400 hover:text-white hover:bg-white/5 transition border border-white/5"
                    >
                      Test Checkout Gateway
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenCheckout(plan)}
                    className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                      plan.popular
                        ? 'bg-white hover:bg-gray-200 text-black shadow-lg shadow-white/5'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Modal Pipeline */}
        {selectedCheckoutPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-[#0E1015] border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <button
                type="button"
                onClick={() => setSelectedCheckoutPlan(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {paymentStep === 'details' ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                      badcode.studio Stripe Gateway
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white font-sans">
                    Subscribe to {selectedCheckoutPlan.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1 mb-6 text-sm text-gray-400">
                    <span className="text-2xl font-bold text-white">{selectedCheckoutPlan.price}</span>
                    <span>/ month &bull; {selectedCheckoutPlan.credits}</span>
                  </div>

                  {selectedCheckoutPlan.stripeBuyButtonId && selectedCheckoutPlan.stripePublishableKey ? (
                    <div className="space-y-6">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                        Official Stripe payment session configured for <strong>badcode.studio</strong>. Click below to complete checkout:
                      </div>

                      <div className="flex justify-center py-2 bg-[#141720] border border-white/10 rounded-xl p-4">
                        {React.createElement('stripe-buy-button', {
                          'buy-button-id': selectedCheckoutPlan.stripeBuyButtonId,
                          'publishable-key': selectedCheckoutPlan.stripePublishableKey,
                        })}
                      </div>

                      <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5 pt-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Direct 256-bit SSL encrypted Stripe checkout. Cancel anytime.</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSimulatePayment} className="space-y-4">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-mono">
                        Merchant: <strong>badcode.studio</strong> (Stripe Connected)
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                          Billing Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={checkoutEmail}
                          onChange={(e) => setCheckoutEmail(e.target.value)}
                          placeholder="creator@badcode.studio"
                          className="w-full bg-[#141720] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242"
                          className="w-full bg-[#141720] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                        />
                        <Lock className="w-3.5 h-3.5 text-gray-500 absolute right-3.5 top-3.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                          Exp Date
                        </label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM / YY"
                          className="w-full bg-[#141720] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                          CVC / CVV
                        </label>
                        <input
                          type="text"
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="123"
                          className="w-full bg-[#141720] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>256-bit SSL encrypted. Cancel anytime in 1 click. View our <Link to="/legal" className="text-gray-400 underline hover:text-white">Refund & Privacy Policy</Link>.</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      Authorize {selectedCheckoutPlan.price} Payment
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-sans">
                    Subscription Activated!
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Your account has been provisioned with <strong>{selectedCheckoutPlan.credits}</strong>. GPU cluster nodes are now primed for high-speed generation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedCheckoutPlan(null)}
                    className="mt-4 px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition"
                  >
                    Start Synthesizing
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Guarantee Banner */}
        <div className="mt-16 p-8 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Full Commercial Rights & Ownership</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                All outputs generated belong strictly to you. Use across published books, indie titles, and concept decks.
              </p>
            </div>
          </div>
          <a
            href="mailto:licensing@eidolon.monster"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider whitespace-nowrap"
          >
            Custom Enterprise Inquiries →
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
