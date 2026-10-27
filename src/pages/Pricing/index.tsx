import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Check, Shield, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUsage } from '@/lib/usage';

interface Plan {
  name: string;
  sort: number;
  price_cents: number;
  images_per_month: number;
  images_high_per_month: number;
  models3d_per_month: number;
  description: string;
  stripe_buy_button_id?: string | null;
  stripe_publishable_key?: string | null;
}

function formatPrice(cents: number) {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { usage } = useUsage();
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);

  // Stripe's buy-button script is only loaded when a plan actually has a button.
  useEffect(() => {
    const has = plans.some((p) => p.stripe_buy_button_id && p.stripe_publishable_key);
    if (!has || document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]')) return;
    const s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/buy-button.js';
    s.async = true;
    document.head.appendChild(s);
  }, [plans]);

  useEffect(() => {
    const read = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      setMe(u ? { id: u.id, email: u.email ?? '' } : null);
    };
    void read();
    window.addEventListener('eidolon_user_updated', read);
    return () => window.removeEventListener('eidolon_user_updated', read);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('plans').select('*').eq('active', true).order('sort');
      setPlans((data as Plan[]) ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const popularName = plans.length >= 3 ? plans[2].name : '';

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6E8EC]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-36 pb-24">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" />
            Adults only (18+)
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-sans">
            Simple Pricing.<br />Clear Limits.
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            Every plan includes a set number of image generations and 3D models each month. Free accounts can browse the gallery.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-xs font-mono text-gray-500">Loading plans...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrent = usage?.plan === plan.name;
              const popular = plan.name === popularName;
              const free = plan.price_cents === 0;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-7 flex flex-col justify-between border ${
                    popular
                      ? 'bg-[#10131B] border-emerald-500/50 shadow-2xl shadow-emerald-500/10'
                      : 'bg-[#0E1015] border-white/10'
                  }`}
                >
                  {popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-black text-[11px] font-extrabold uppercase tracking-widest">
                      MOST POPULAR
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-200">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-4xl font-extrabold text-white tracking-tight">{formatPrice(plan.price_cents)}</span>
                      {!free && <span className="ml-2 text-xs text-gray-400">CAD / month</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{plan.description}</p>

                    <ul className="mt-6 pt-6 border-t border-white/10 space-y-3">
                      {free ? (
                        <li className="flex items-start text-xs text-gray-300 gap-2.5">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>Browse the gallery</span>
                        </li>
                      ) : (
                        <>
                          <li className="flex items-start text-xs text-gray-300 gap-2.5">
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{plan.images_per_month.toLocaleString()} Standard images / month</span>
                          </li>
                          {plan.images_high_per_month > 0 && (
                            <li className="flex items-start text-xs text-gray-300 gap-2.5">
                              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{plan.images_high_per_month.toLocaleString()} High-quality images / month</span>
                            </li>
                          )}
                          <li className="flex items-start text-xs text-gray-300 gap-2.5">
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{plan.models3d_per_month.toLocaleString()} 3D credits / month (Standard model = 1, High detail = 2)</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="pt-8">
                    {isCurrent ? (
                      <div className="w-full py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Your plan
                      </div>
                    ) : free ? null : plan.stripe_buy_button_id && plan.stripe_publishable_key ? (
                      me ? (
                        <stripe-buy-button
                          buy-button-id={plan.stripe_buy_button_id}
                          publishable-key={plan.stripe_publishable_key}
                          client-reference-id={me.id}
                          customer-email={me.email}
                        />
                      ) : (
                        <p className="w-full py-3 rounded-xl text-[11px] font-mono uppercase tracking-widest bg-white/5 text-gray-300 border border-white/10 text-center">
                          Sign in to subscribe
                        </p>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/10 text-gray-400 border border-white/10 cursor-not-allowed"
                      >
                        Payments opening soon
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 p-8 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Questions about plans?</h4>
              <p className="text-xs text-gray-400 mt-0.5">Prices are in Canadian dollars (CAD). Limits reset on the 1st of each month.</p>
            </div>
          </div>
          <a
            href="mailto:licensing@eidolon.monster"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider whitespace-nowrap"
          >
            Contact us →
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
