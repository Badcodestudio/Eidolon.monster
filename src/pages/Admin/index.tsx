import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import ModerationPanel from './ModerationPanel';
import PlansPanel from './PlansPanel';
import UsersPanel from './UsersPanel';
import { invokeFunction } from '@/lib/api';
import { getCommunityArtworks } from '@/lib/communityGallery';
import { Artwork } from '@/data/artworks';
import {
  ShieldAlert,
  Key,
  CreditCard,
  Layers,
  Trash2,
  Lock,
  TrendingUp,
  Cpu,
  Eye,
  RefreshCw,
  Sliders,
  Users,
} from 'lucide-react';

interface Stats {
  accounts: number;
  locked: number;
  imgStd: number;
  imgHigh: number;
  credits3d: number;
  blocked: number;
  notes: number;
  plans: { name: string; price_cents: number; subscribers: number }[];
}

export default function AdminPage() {
  // Access is decided by the server: only signed-in owner accounts get in.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      setChecking(true);
      try {
        await invokeFunction('admin', { action: 'whoami' });
        if (!cancelled) {
          setIsAuthenticated(true);
          setAuthError('');
        }
      } catch (e) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setAuthError(e instanceof Error ? e.message : 'Access denied.');
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    void check();
    window.addEventListener('eidolon_user_updated', check);
    return () => {
      cancelled = true;
      window.removeEventListener('eidolon_user_updated', check);
    };
  }, []);

  // Active tab inside admin dashboard
  const [activeTab, setActiveTab] = useState<'moderation' | 'users' | 'plans' | 'overview' | 'gallery' | 'telemetry' | 'api-keys'>('moderation');

  // Gallery state
  const [communityArtworks, setCommunityArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    setCommunityArtworks(getCommunityArtworks());
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleDeleteCommunityItem = (id: string) => {
    const updated = communityArtworks.filter((item) => item.id !== id);
    setCommunityArtworks(updated);
    localStorage.setItem('eidolon_community_creations', JSON.stringify(updated));
    window.dispatchEvent(new Event('eidolon_gallery_updated'));
  };

  // Real numbers from the database (owner-only server call).
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState('');
  const loadStats = async () => {
    try {
      setStats(await invokeFunction<Stats>('admin', { action: 'stats' }));
      setStatsError('');
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : 'Could not load the numbers.');
    }
  };
  useEffect(() => {
    if (isAuthenticated) void loadStats();
  }, [isAuthenticated]);

  const paying = stats ? stats.plans.filter((p) => p.price_cents > 0).reduce((n, p) => n + p.subscribers, 0) : 0;
  const mrr = stats ? stats.plans.reduce((n, p) => n + p.price_cents * p.subscribers, 0) / 100 : 0;
  // Rough cost estimate using what we know so far: ~0.3 cents per Standard image, ~0.5 cents per High image, 35 cents per 3D credit.
  const estCost = stats ? stats.imgStd * 0.003 + stats.imgHigh * 0.005 + stats.credits3d * 0.35 : 0;
  const money = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6E8EC]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-36 pb-24">
        {/* Authentication Gate */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto bg-[#0E1015] border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl">
            <div className="text-center space-y-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
                Admin Sovereignty Vault
              </h1>
              <p className="text-xs text-gray-400">
                Owner access only. Moderation, accounts and platform tools.
              </p>
            </div>

            <div className="space-y-4 text-center">
              {checking ? (
                <p className="text-xs text-gray-400 font-mono">Checking access...</p>
              ) : (
                <>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    This area is for the studio owner. Sign in with your owner account (top menu), then this page opens by itself.
                  </p>
                  {authError && (
                    <div className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                      {authError}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          /* Admin Dashboard Console */
          <div className="space-y-8">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Operator Console &bull; badcode.studio
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
                  Owner Console
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setCommunityArtworks(getCommunityArtworks()); void loadStats(); }}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-gray-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-mono text-red-300 transition"
                >
                  Lock Console
                </button>
              </div>
            </div>

            {/* Quick Metrics Cards (real numbers) */}
            {statsError && (
              <div className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">{statsError}</div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0E1015] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
                  <span>Monthly Recurring (est., CAD)</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">{stats ? money(mrr) : '...'}</div>
                <div className="text-[11px] text-gray-400 mt-1">Plan price x accounts on that plan</div>
              </div>

              <div className="bg-[#0E1015] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
                  <span>Paying accounts</span>
                  <CreditCard className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">{stats ? paying : '...'}</div>
                <div className="text-[11px] text-gray-400 mt-1">{stats ? `${stats.accounts} accounts in total` : ''}</div>
              </div>

              <div className="bg-[#0E1015] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
                  <span>Est. provider cost (month)</span>
                  <Cpu className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">{stats ? money(estCost) : '...'}</div>
                <div className="text-[11px] text-gray-400 mt-1">fal + Tripo, rough estimate</div>
              </div>

              <div className="bg-[#0E1015] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
                  <span>Blocked / locked</span>
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">{stats ? `${stats.blocked} / ${stats.locked}` : '...'}</div>
                <div className="text-[11px] text-gray-400 mt-1">Blocked prompts this month / locked accounts</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveTab('moderation')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
                  activeTab === 'moderation'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-[#12141D] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Moderation
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
                  activeTab === 'users'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-[#12141D] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Users
              </button>

              <button
                onClick={() => setActiveTab('plans')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
                  activeTab === 'plans'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-[#12141D] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Plans &amp; limits
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
                  activeTab === 'overview'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-[#12141D] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Overview
              </button>

              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
                  activeTab === 'gallery'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-[#12141D] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Community Artwork Moderation
              </button>

              <button
                onClick={() => setActiveTab('api-keys')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
                  activeTab === 'api-keys'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-[#12141D] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                API & GPU Pipeline Keys
              </button>
            </div>

            {activeTab === 'moderation' && <ModerationPanel />}
            {activeTab === 'users' && <UsersPanel />}
            {activeTab === 'plans' && <PlansPanel />}

            {/* Tab: OVERVIEW (real numbers) */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0E1015] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    This month
                  </h3>
                  <div className="space-y-2.5 text-xs text-gray-300 font-mono">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-400">Standard images</span>
                      <span className="text-white">{stats ? stats.imgStd : '...'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-400">High-quality images</span>
                      <span className="text-white">{stats ? stats.imgHigh : '...'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-400">3D credits used</span>
                      <span className="text-white">{stats ? stats.credits3d : '...'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-400">Gore notes (allowed, for review)</span>
                      <span className="text-white">{stats ? stats.notes : '...'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-400">Image engines</span>
                      <span className="text-emerald-400">Standard: FLUX schnell &bull; High: Z Image Turbo</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0E1015] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    Accounts per plan
                  </h3>
                  <div className="space-y-2.5 text-xs text-gray-300 font-mono">
                    {stats?.plans.map((p) => (
                      <div key={p.name} className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">
                          {p.name} ({p.price_cents > 0 ? `$${(p.price_cents / 100).toFixed(2)}/mo` : 'free'})
                        </span>
                        <span className="text-white">{p.subscribers}</span>
                      </div>
                    ))}
                    <p className="text-[11px] text-gray-500 pt-1">
                      Payments are not connected yet, so paying accounts are the ones you set to a plan by hand. Owner accounts are not counted.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: GALLERY MODERATION */}
            {activeTab === 'gallery' && (
              <div className="bg-[#0E1015] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Community Artworks & Moderation</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Review, inspect, or remove images published by creators to the persistent community feed.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">
                    {communityArtworks.length} Community Items
                  </span>
                </div>

                {communityArtworks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    No community artworks saved yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {communityArtworks.map((art) => (
                      <div
                        key={art.id}
                        className="bg-[#141720] border border-white/10 rounded-xl overflow-hidden group hover:border-white/20 transition"
                      >
                        <div className="relative aspect-video overflow-hidden bg-black/40">
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{art.title}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                              {art.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed font-mono">
                            {art.prompt}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[10px] text-gray-500">By {art.author || 'Creator'}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCommunityItem(art.id)}
                              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: API & PIPELINE KEYS (now server-side) */}
            {activeTab === 'api-keys' && (
              <div className="space-y-4 max-w-2xl">
                <div className="bg-[#0E1015] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
                  <p className="font-semibold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    Pipeline keys live on the server
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your fal.ai and Tripo3D keys are no longer stored in this browser. They are kept as
                    secrets in Supabase (Edge Functions &rarr; Secrets) and only the server uses them.
                  </p>
                  <ul className="text-xs text-gray-300 font-mono space-y-1.5">
                    <li>FAL_KEY &mdash; image generation</li>
                    <li>TRIPO_KEY &mdash; 3D generation</li>
                    <li>DAILY_IMAGE_LIMIT &mdash; optional, default 30</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
