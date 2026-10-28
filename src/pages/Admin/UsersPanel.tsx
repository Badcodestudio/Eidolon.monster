import { useCallback, useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, UserX, Search, X, Lock, Unlock } from 'lucide-react';
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
  created_at?: string;
  email_confirmed_at?: string | null;
}

type RoleFilter = 'all' | 'admin' | 'user' | 'locked' | 'unconfirmed';

const btn = 'px-3 py-1.5 rounded-lg text-[11px] font-mono border transition';

export default function UsersPanel() {
  const [users, setUsers] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [planNames, setPlanNames] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const qRef = useRef('');

  const load = useCallback(async (query: string): Promise<Account[]> => {
    setLoading(true);
    try {
      const r = await invokeFunction<{ accounts: Account[]; total: number }>('admin', { action: 'list_users', q: query });
      setUsers(r.accounts);
      setTotal(r.total);
      return r.accounts;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not load users.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load('');
    invokeFunction<{ plans: { name: string }[] }>('admin', { action: 'list_plans' })
      .then((r) => setPlanNames(r.plans.map((p) => p.name)))
      .catch(() => setPlanNames([]));
  }, [load]);

  // Search as you type (short pause so it doesn't fire on every letter).
  useEffect(() => {
    qRef.current = q;
    const t = setTimeout(() => void load(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q, load]);

  const act = async (body: Record<string, unknown>) => {
    setMsg('');
    try {
      await invokeFunction('admin', body);
      await load(qRef.current.trim());
      setMsg('Done.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Action failed.');
    }
  };

  const makeResetLink = async (userId: string) => {
    setMsg('');
    try {
      const r = await invokeFunction<{ link: string | null }>('admin', { action: 'reset_link', user_id: userId });
      if (!r.link) throw new Error('No link was made.');
      try {
        await navigator.clipboard.writeText(r.link);
        setMsg('Reset link copied. Send it to the person; it works once.');
      } catch {
        setMsg(`Reset link: ${r.link}`);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not make the link.');
    }
  };

  const removeUser = (a: Account) => {
    setMenuId(null);
    if (window.confirm(`Permanently remove ${a.email ?? a.id}? This cannot be undone.`)) {
      void act({ action: 'delete_user', user_id: a.id });
    }
  };

  const shown = users.filter((u) => {
    if (role === 'admin') return u.is_owner;
    if (role === 'user') return !u.is_owner;
    if (role === 'locked') return u.locked;
    if (role === 'unconfirmed') return !u.email_confirmed_at;
    return true;
  });

  const editing = users.find((u) => u.id === editId) ?? null;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-[#0E1015] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Users</h2>
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by email"
              className="w-full bg-[#141720] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleFilter)}
            className="bg-[#141720] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
          >
            <option value="all">all roles</option>
            <option value="admin">admin</option>
            <option value="user">user</option>
            <option value="locked">locked</option>
            <option value="unconfirmed">unconfirmed email</option>
          </select>
        </div>

        {msg && (
          <div className="mx-4 mb-3 text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 break-all">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 bg-[#0B1030] text-[11px] font-mono uppercase tracking-wider text-gray-300">
          <span>Name</span>
          <span>Role</span>
          <span className="w-8" />
        </div>

        {loading && users.length === 0 && <p className="p-4 text-xs font-mono text-gray-400">Loading...</p>}
        {!loading && shown.length === 0 && <p className="p-4 text-xs text-gray-500">No users match.</p>}

        {shown.map((u) => (
          <div
            key={u.id}
            className="relative grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-4 py-3 border-t border-white/5"
          >
            <div className="min-w-0">
              <div className="text-xs text-white font-mono break-all">{u.email ?? u.id}</div>
              <div className="text-[11px] font-mono text-gray-400">
                {u.plan ?? 'Free'}
                {u.locked ? ' • LOCKED' : ''}
                {u.email_confirmed_at ? '' : ' • unconfirmed'}
                {(u.strikes ?? 0) > 0 ? ` • strikes ${u.strikes}` : ''}
              </div>
            </div>
            <span className="text-xs font-mono text-gray-200">{u.is_owner ? 'admin' : 'user'}</span>
            <div className="relative">
              <button
                aria-label="User actions"
                onClick={() => setMenuId(menuId === u.id ? null : u.id)}
                className="w-8 h-8 rounded-lg border border-white/15 text-gray-300 hover:bg-white/5 flex items-center justify-center"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuId === u.id && (
                <div className="absolute right-0 top-9 z-20 w-44 bg-[#1A1D26] border border-white/10 rounded-xl shadow-2xl p-1.5">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white hover:bg-white/5"
                    onClick={() => {
                      setMenuId(null);
                      setEditId(u.id);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit user
                  </button>
                  {!u.is_owner && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-300 hover:bg-red-500/10"
                      onClick={() => removeUser(u)}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Remove user
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="px-4 py-2 border-t border-white/5 text-[11px] font-mono text-gray-500">
          Showing {shown.length} of {total} accounts (newest first, up to 100).
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-3" onClick={() => setEditId(null)}>
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0E1015] border border-white/10 rounded-2xl p-5 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">Edit user</h3>
                <p className="text-xs font-mono text-gray-300 break-all">{editing.email ?? editing.id}</p>
              </div>
              <button aria-label="Close" onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {msg && <p className="text-xs font-mono text-emerald-300 break-all">{msg}</p>}

            <div className="space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400">Plan</p>
              <div className="flex flex-wrap gap-2">
                {planNames.length === 0 && <span className="text-xs text-amber-300">No plans found. Check Plans &amp; limits.</span>}
                {planNames.map((p) => (
                  <button
                    key={p}
                    className={`${btn} ${editing.plan === p ? 'border-emerald-500 text-emerald-300' : 'border-white/15 text-gray-300'}`}
                    onClick={() => act({ action: 'set_plan', user_id: editing.id, plan: p })}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                Extra 3D credits: {editing.bonus_3d ?? 0}
              </p>
              <div className="flex flex-wrap gap-2">
                <button className={`${btn} border-white/15 text-gray-200`} onClick={() => act({ action: 'add_bonus', user_id: editing.id, amount: -1 })}>-1</button>
                <button className={`${btn} border-white/15 text-gray-200`} onClick={() => act({ action: 'add_bonus', user_id: editing.id, amount: 1 })}>+1</button>
                <button className={`${btn} border-white/15 text-gray-200`} onClick={() => act({ action: 'add_bonus', user_id: editing.id, amount: 5 })}>+5</button>
                <button className={`${btn} border-white/15 text-gray-200`} onClick={() => act({ action: 'add_bonus', user_id: editing.id, amount: 10 })}>+10</button>
              </div>
            </div>

            {!editing.is_owner && (
              <div className="space-y-2">
                <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                  Status: {editing.locked ? `locked (${editing.lock_reason ?? 'no reason'})` : 'active'} &bull; strikes {editing.strikes ?? 0}
                </p>
                <div className="flex flex-wrap gap-2">
                  {editing.locked ? (
                    <button
                      className={`${btn} border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10`}
                      onClick={() => act({ action: 'unlock', user_id: editing.id })}
                    >
                      <Unlock className="inline w-3 h-3 mr-1" />
                      Pardon (unlock)
                    </button>
                  ) : (
                    <button
                      className={`${btn} border-red-500/40 text-red-300 hover:bg-red-500/10`}
                      onClick={() => act({ action: 'lock', user_id: editing.id, reason: 'manual' })}
                    >
                      <Lock className="inline w-3 h-3 mr-1" />
                      Lock account
                    </button>
                  )}
                  <button className={`${btn} border-white/15 text-gray-300`} onClick={() => act({ action: 'clear_strikes', user_id: editing.id })}>
                    Clear strikes
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                Email: {editing.email_confirmed_at ? 'confirmed' : 'NOT confirmed'}
              </p>
              <div className="flex flex-wrap gap-2">
                {!editing.email_confirmed_at && (
                  <button
                    className={`${btn} border-emerald-500/40 text-emerald-300`}
                    onClick={() => act({ action: 'confirm_email', user_id: editing.id })}
                  >
                    Confirm email
                  </button>
                )}
                <button
                  className={`${btn} border-white/15 text-gray-200`}
                  onClick={() => {
                    const next = window.prompt('New email address for this account:', editing.email ?? '');
                    if (next && next.trim()) void act({ action: 'set_email', user_id: editing.id, email: next.trim() });
                  }}
                >
                  Change email
                </button>
                <button className={`${btn} border-white/15 text-gray-200`} onClick={() => void makeResetLink(editing.id)}>
                  Password reset link
                </button>
              </div>
            </div>

            {!editing.is_owner && (
              <div className="pt-2 border-t border-white/10">
                <button
                  className={`${btn} border-red-500/40 text-red-300 hover:bg-red-500/10`}
                  onClick={() => {
                    const target = editing;
                    setEditId(null);
                    removeUser(target);
                  }}
                >
                  <UserX className="inline w-3 h-3 mr-1" />
                  Remove user
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
