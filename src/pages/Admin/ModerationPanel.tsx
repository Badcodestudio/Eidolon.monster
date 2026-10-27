import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Lock, Unlock, Search } from 'lucide-react';
import { invokeFunction } from '@/lib/api';

interface Account {
  id: string;
  email?: string;
  plan?: string;
  strikes?: number;
  locked?: boolean;
  lock_reason?: string | null;
  bonus_3d?: number;
  is_owner?: boolean;
}

interface BlockedItem {
  id: number;
  created_at: string;
  email?: string;
  kind: string;
  prompt: string | null;
  block_reason: string | null;
  matched?: string | null;
}


// Splits the prompt so the words that tripped the filter can be highlighted.
function Highlighted({ text, matched }: { text: string; matched?: string | null }) {
  const terms = (matched ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (!terms.length) return <>{text}</>;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  return (
    <>
      {text.split(re).map((part, i) =>
        terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="bg-red-500/40 text-red-100 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const card = 'bg-[#0E1015] border border-white/10 rounded-2xl p-5 space-y-3';
const btn = 'px-3 py-1.5 rounded-lg text-[11px] font-mono border transition';

export default function ModerationPanel() {
  const [flagged, setFlagged] = useState<Account[]>([]);
  const [blocked, setBlocked] = useState<BlockedItem[]>([]);
  const [found, setFound] = useState<Account | null>(null);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setMsg('');
    try {
      const a = await invokeFunction<{ accounts: Account[] }>('admin', { action: 'list_flagged' });
      const b = await invokeFunction<{ items: BlockedItem[] }>('admin', { action: 'list_blocked' });
      setFlagged(a.accounts);
      setBlocked(b.items);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not load.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (body: Record<string, unknown>, refreshFound?: string) => {
    setMsg('');
    try {
      await invokeFunction('admin', body);
      await load();
      if (refreshFound) await lookup(refreshFound);
      setMsg('Done.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Action failed.');
    }
  };

  const lookup = async (email: string) => {
    try {
      const r = await invokeFunction<{ account: Account }>('admin', { action: 'find_user', email });
      setFound(r.account);
    } catch (e) {
      setFound(null);
      setMsg(e instanceof Error ? e.message : 'Not found.');
    }
  };

  const AccountRow = ({ a }: { a: Account }) => (
    <div className="border border-white/10 rounded-xl p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-white font-mono break-all">{a.email ?? a.id}</div>
        <div className="text-[11px] font-mono text-gray-400">
          {a.plan ?? 'Free'} &bull; strikes {a.strikes ?? 0} &bull; 3D bonus {a.bonus_3d ?? 0}
          {a.is_owner ? ' • owner' : ''}
        </div>
      </div>
      {a.locked && (
        <div className="text-[11px] text-red-300 font-mono">Locked: {a.lock_reason ?? 'no reason recorded'}</div>
      )}
      <div className="flex flex-wrap gap-2">
        {a.locked ? (
          <button
            className={`${btn} border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10`}
            onClick={() => act({ action: 'unlock', user_id: a.id }, found?.id === a.id ? found.email : undefined)}
          >
            <Unlock className="inline w-3 h-3 mr-1" />
            Unlock
          </button>
        ) : (
          <button
            className={`${btn} border-red-500/40 text-red-300 hover:bg-red-500/10`}
            onClick={() => act({ action: 'lock', user_id: a.id, reason: 'manual' }, found?.id === a.id ? found.email : undefined)}
          >
            <Lock className="inline w-3 h-3 mr-1" />
            Lock
          </button>
        )}
        <button
          className={`${btn} border-white/15 text-gray-300 hover:bg-white/5`}
          onClick={() => act({ action: 'clear_strikes', user_id: a.id }, found?.id === a.id ? found.email : undefined)}
        >
          Clear strikes
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Moderation</h2>
        <button
          onClick={() => void load()}
          className={`${btn} border-white/15 text-gray-300 hover:bg-white/5`}
        >
          <RefreshCw className={`inline w-3 h-3 mr-1 ${busy ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      {msg && <div className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">{msg}</div>}

      <div className={card}>
        <p className="text-xs font-semibold text-white">Find an account</p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (search.trim()) void lookup(search.trim());
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="email address"
            className="flex-1 bg-[#141720] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
          />
          <button type="submit" className={`${btn} border-emerald-500/40 text-emerald-300`}>
            <Search className="inline w-3 h-3 mr-1" />
            Find
          </button>
        </form>
        {found && (
          <div className="space-y-3">
            <AccountRow a={found} />
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-gray-300">
              <span>Plan:</span>
              {['Free', 'Apprentice', 'Archetype Pro', 'Studio Guild'].map((p) => (
                <button
                  key={p}
                  className={`${btn} ${found.plan === p ? 'border-emerald-500 text-emerald-300' : 'border-white/15 text-gray-300'}`}
                  onClick={() => act({ action: 'set_plan', user_id: found.id, plan: p }, found.email)}
                >
                  {p}
                </button>
              ))}
              <span className="ml-3">3D bonus:</span>
              <button className={`${btn} border-white/15`} onClick={() => act({ action: 'add_bonus', user_id: found.id, amount: 1 }, found.email)}>+1</button>
              <button className={`${btn} border-white/15`} onClick={() => act({ action: 'add_bonus', user_id: found.id, amount: 5 }, found.email)}>+5</button>
              <button className={`${btn} border-white/15`} onClick={() => act({ action: 'add_bonus', user_id: found.id, amount: -1 }, found.email)}>-1</button>
            </div>
          </div>
        )}
      </div>

      <div className={card}>
        <p className="text-xs font-semibold text-white">Locked or flagged accounts ({flagged.length})</p>
        {flagged.length === 0 && <p className="text-xs text-gray-500">None right now.</p>}
        {flagged.map((a) => (
          <AccountRow key={a.id} a={a} />
        ))}
      </div>

      <div className={card}>
        <p className="text-xs font-semibold text-white">Recent blocked prompts ({blocked.length})</p>
        {blocked.length === 0 && <p className="text-xs text-gray-500">None yet.</p>}
        {blocked.map((b) => (
          <div key={b.id} className="border border-white/10 rounded-xl p-3 space-y-1">
            <div className="flex flex-wrap justify-between gap-2 text-[11px] font-mono text-gray-400">
              <span className="break-all">{b.email}</span>
              <span>
                {b.block_reason} &bull; {b.kind} &bull; {new Date(b.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-200 break-words">
              <Highlighted text={b.prompt ?? ''} matched={b.matched} />
            </p>
            {b.block_reason === 'engine_safety' && (
              <p className="text-[11px] text-amber-300 font-mono">Caught by the image engine's own safety check (no word to show).</p>
            )}
            {b.matched && (
              <p className="text-[11px] text-red-300 font-mono">Tripped on: {b.matched}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
