import { useCallback, useEffect, useState } from 'react';
import { invokeFunction } from '@/lib/api';

interface Plan {
  name: string;
  sort: number;
  price_cents: number;
  images_per_month: number;
  images_high_per_month: number;
  models3d_per_month: number;
  description: string;
  active: boolean;
}

const input =
  'w-full bg-[#141720] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400';

export default function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await invokeFunction<{ plans: Plan[] }>('admin', { action: 'list_plans' });
      setPlans(r.plans);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not load plans.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const edit = (name: string, patch: Partial<Plan>) =>
    setPlans((prev) => prev.map((p) => (p.name === name ? { ...p, ...patch } : p)));

  const save = async (p: Plan) => {
    setMsg('');
    try {
      await invokeFunction('admin', { action: 'save_plan', ...p });
      setMsg(`${p.name} saved.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save.');
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Plans & limits</h2>
      <p className="text-xs text-gray-400">
        Change prices and monthly limits here. Changes apply straight away. This page only <em>shows</em> the price;
        the amount customers are actually charged is set in Stripe.
      </p>
      {msg && (
        <div className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">{msg}</div>
      )}
      {plans.map((p) => (
        <div key={p.name} className="bg-[#0E1015] border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">{p.name}</span>
            <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={p.active}
                onChange={(e) => edit(p.name, { active: e.target.checked })}
                className="accent-emerald-500"
              />
              Shown on Pricing page
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-[11px] font-mono text-gray-400 space-y-1">
              <span>Price (dollars)</span>
              <input
                className={input}
                type="number"
                min={0}
                step="0.01"
                value={(p.price_cents / 100).toString()}
                onChange={(e) => edit(p.name, { price_cents: Math.round(Number(e.target.value || 0) * 100) })}
              />
            </label>
            <label className="text-[11px] font-mono text-gray-400 space-y-1">
              <span>Standard images / month</span>
              <input
                className={input}
                type="number"
                min={0}
                value={p.images_per_month}
                onChange={(e) => edit(p.name, { images_per_month: Number(e.target.value || 0) })}
              />
            </label>
            <label className="text-[11px] font-mono text-gray-400 space-y-1">
              <span>High-quality images / month</span>
              <input
                className={input}
                type="number"
                min={0}
                value={p.images_high_per_month ?? 0}
                onChange={(e) => edit(p.name, { images_high_per_month: Number(e.target.value || 0) })}
              />
            </label>
            <label className="text-[11px] font-mono text-gray-400 space-y-1">
              <span>3D credits / month (High detail = 2)</span>
              <input
                className={input}
                type="number"
                min={0}
                value={p.models3d_per_month}
                onChange={(e) => edit(p.name, { models3d_per_month: Number(e.target.value || 0) })}
              />
            </label>
          </div>
          <label className="text-[11px] font-mono text-gray-400 space-y-1 block">
            <span>Short description</span>
            <input className={input} value={p.description} onChange={(e) => edit(p.name, { description: e.target.value })} />
          </label>
          <button
            onClick={() => void save(p)}
            className="px-4 py-1.5 rounded-lg text-[11px] font-mono border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition"
          >
            Save {p.name}
          </button>
        </div>
      ))}
    </div>
  );
}
