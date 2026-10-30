import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GeneratorModal } from '@/components/GeneratorModal';
import { ARTWORK_GALLERY, Artwork } from '@/data/artworks';
import { getCommunityArtworks } from '@/lib/communityGallery';
import { invokeFunction } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import {
  Sparkles,
  Heart,
  Check,
  Compass,
  Filter,
  Box,
  History,
  Share2,
  Trash2,
  Flag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GalleryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const [activeFilter, setActiveFilter] = useState<string>(initialTab);
  const [communityArtworks, setCommunityArtworks] = useState<Artwork[]>([]);
  const [sharedArtworks, setSharedArtworks] = useState<Artwork[]>([]);
  const [myDbArtworks, setMyDbArtworks] = useState<Artwork[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [reportsMap, setReportsMap] = useState<Record<string, { n: number; reasons: string[] }>>({});
  const [notice, setNotice] = useState('');
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState<number>(15);

  const [viewerArt, setViewerArt] = useState<Artwork | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activeGeneratorPrompt, setActiveGeneratorPrompt] = useState('');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveFilter(tab);
      if (tab === 'community') void loadShared();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load community creations & listen for real-time updates
  useEffect(() => {
    setCommunityArtworks(getCommunityArtworks());

    const handleUpdate = () => {
      setCommunityArtworks(getCommunityArtworks());
    };

    window.addEventListener('eidolon_gallery_updated', handleUpdate);
    window.addEventListener('eidolon_user_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('eidolon_gallery_updated', handleUpdate);
      window.removeEventListener('eidolon_user_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Real community pieces: shared by signed-in people, already past our prompt check and fal's check.
  const loadShared = async () => {
    try {
      const res = await invokeFunction<{
        is_owner: boolean;
        items: { id: string; title: string; prompt: string; image_url: string; likes: number; reports?: number; report_reasons?: string[] }[];
      }>('community', { action: 'list' });
      setIsOwner(!!res.is_owner);
      const rm: Record<string, { n: number; reasons: string[] }> = {};
      for (const i of res.items ?? []) {
        if (i.reports) rm[`shared-${i.id}`] = { n: i.reports, reasons: i.report_reasons ?? [] };
      }
      setReportsMap(rm);
      setSharedArtworks(
        (res.items ?? []).map((i) => ({
          id: `shared-${i.id}`,
          title: i.title,
          category: 'fantasy' as const,
          imageUrl: i.image_url,
          prompt: i.prompt,
          aspectRatio: 'aspect-[4/5]',
          author: '',
          likes: i.likes,
        }))
      );
    } catch (err) {
      // Community list unavailable: the featured pieces still show, but say so instead of failing silently.
      flash(`Community list could not load: ${err instanceof Error ? err.message : 'try again.'}`);
    }
  };
  useEffect(() => {
    void loadShared();
  }, []);

  // My Creations come from the database, so they belong to the signed-in account on any device.
  const loadMine = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setMyDbArtworks([]);
        return;
      }
      const { data, error } = await supabase
        .from('generations')
        .select('id,prompt,result_url,share_title')
        .eq('kind', 'image')
        .eq('blocked', false)
        .not('result_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(120);
      if (error) throw error;
      setMyDbArtworks(
        (data ?? []).map((g) => ({
          id: `mine-${g.id}`,
          title: g.share_title || String(g.prompt ?? 'Creation').slice(0, 48),
          category: 'fantasy' as const,
          imageUrl: g.result_url as string,
          prompt: String(g.prompt ?? ''),
          aspectRatio: 'aspect-[4/5]',
          author: '',
          likes: 0,
        }))
      );
    } catch {
      setMyDbArtworks([]);
    }
  };
  useEffect(() => {
    void loadMine();
    const onUser = () => void loadMine();
    window.addEventListener('eidolon_user_updated', onUser);
    return () => window.removeEventListener('eidolon_user_updated', onUser);
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const handleShare = async (art: Artwork, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Share this image and its prompt in the public Community tab?')) return;
    try {
      await invokeFunction('community', { action: 'share', original_url: art.imageUrl, title: art.title });
      flash('Shared to Community.');
      void loadShared();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not share right now.');
    }
  };

  const handleRemove = async (art: Artwork, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Remove this piece from Community? It can not be shared again.')) return;
    try {
      await invokeFunction('community', { action: 'remove', id: art.id.replace('shared-', '') });
      setSharedArtworks((prev) => prev.filter((a) => a.id !== art.id));
      flash('Removed.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not remove.');
    }
  };

  const handleReport = async (art: Artwork, e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = window.prompt('Why are you reporting this piece? (optional)');
    if (reason === null) return;
    try {
      await invokeFunction('community', { action: 'report', id: art.id.replace('shared-', ''), reason });
      flash('Thanks, the report was sent for review.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Sign in to report.');
    }
  };

  const handleDismiss = async (art: Artwork, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invokeFunction('community', { action: 'dismiss', id: art.id.replace('shared-', '') });
      setReportsMap((prev) => {
        const next = { ...prev };
        delete next[art.id];
        return next;
      });
      flash('Report dismissed.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not dismiss.');
    }
  };

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    if (filterId === 'community') void loadShared();
    if (filterId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: filterId });
    }
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id.startsWith('shared-')) {
      invokeFunction<{ likes: number }>('community', { action: 'like', id: id.replace('shared-', '') })
        .then((r) => setSharedArtworks((prev) => prev.map((a) => (a.id === id ? { ...a, likes: r.likes } : a))))
        .catch((err) => flash(err instanceof Error ? err.message : 'Sign in to like.'));
      return;
    }
    setLikesMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleCopyPrompt = (id: string, promptText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenWithPrompt = (promptText: string) => {
    setActiveGeneratorPrompt(promptText);
    setIsGeneratorOpen(true);
  };

  // The saved list mixes the built-in showcase pieces (ids start "community-epic-") with the visitor's own
  // saves, which only live in this browser. Keep them apart so "mine" is never shown as "community".
  const isShowcase = (a: Artwork) => a.id.startsWith('community-epic-');
  const showcaseArtworks = communityArtworks.filter(isShowcase);
  const myArtworks = myDbArtworks;
  const allArtworks = [...sharedArtworks, ...showcaseArtworks, ...ARTWORK_GALLERY];

  const filteredArtworks =
    activeFilter === 'all'
      ? allArtworks
      : activeFilter === 'community'
      ? [...sharedArtworks, ...showcaseArtworks]
      : activeFilter === 'mine'
      ? myArtworks
      : allArtworks.filter((art) => art.category === activeFilter);

  const visibleArtworks = filteredArtworks.slice(0, displayedCount);

  const filters = [
    { id: 'all', label: 'ALL VISIONS' },
    { id: 'mine', label: 'MY CREATIONS' },
    { id: 'community', label: 'COMMUNITY CREATIONS' },
    { id: 'fae', label: 'FAE & UNSEELIE' },
    { id: 'fantasy', label: 'FANTASY & MYTH' },
    { id: 'scifi', label: 'CYBER & SCI-FI' },
    { id: 'anime', label: 'ANIME & MANGA' },
    { id: 'gothic', label: 'GOTHIC & OCCULT' },
  ];

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6E8EC]">
      <Navbar onOpenGenerator={() => setIsGeneratorOpen(true)} />

      <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-36 pb-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest">
              <Compass className="w-3.5 h-3.5" />
              Creator Archives & Curated Collections
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white uppercase font-sans">
              Masterwork Gallery
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
              Explore high-fidelity character concept renders, epic backdrops, and live creations shared by digital artists worldwide.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/history')}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#141722] hover:bg-[#1E2333] border border-white/10 text-white font-mono text-xs uppercase tracking-wider transition"
              title="View your saved creation history"
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>History</span>
            </button>

            <button
              onClick={() => {
                setActiveGeneratorPrompt('');
                setIsGeneratorOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-gray-200 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-white/5"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Synthesize New</span>
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex items-center justify-between gap-4 py-6 border-b border-white/5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
            {filters.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'bg-[#10131B] text-gray-400 hover:text-white border border-white/5 hover:border-white/15'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-400">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>{filteredArtworks.length} Artifacts</span>
          </div>
        </div>

        {notice && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono">
            {notice}
          </div>
        )}

        {/* Masonry Artwork Grid */}
        {visibleArtworks.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {activeFilter === 'mine' ? 'Nothing created on this account yet' : 'No creations found in this gallery view yet'}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Be the first creator to synthesize and publish an artwork to this feed!
            </p>
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider transition hover:bg-emerald-400"
            >
              Generate First Piece
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-10">
            {visibleArtworks.map((art) => {
              const currentLikes = art.likes + (likesMap[art.id] || 0);
              const isCopied = copiedId === art.id;

              return (
                <div
                  key={art.id}
                  onClick={() => setViewerArt(art)}
                  className={`group relative rounded-2xl overflow-hidden border border-white/10 bg-[#0E1015] cursor-pointer hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 ${art.aspectRatio}`}
                >
                  {/* Badge */}
                  {(art.id.startsWith('community-') || art.id.startsWith('shared-')) && (
                    <div className="absolute top-3 left-3 z-10 bg-emerald-500/90 text-black text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{art.id.startsWith('shared-') ? 'Community' : isShowcase(art) ? 'Featured' : 'Mine'}</span>
                    </div>
                  )}

                  {isOwner && reportsMap[art.id] && (
                    <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <Flag className="w-2.5 h-2.5" />
                      <span>Reported x{reportsMap[art.id].n}</span>
                    </div>
                  )}

                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-105"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end text-left">
                    <span className="text-[10px] uppercase font-mono text-emerald-400 tracking-wider">
                      {art.pantheon} &bull; {art.category}
                    </span>
                    <h4 className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-gray-300 line-clamp-2 mt-1 italic font-serif">
                      "{art.prompt}"
                    </p>
                    {isOwner && (reportsMap[art.id]?.reasons.length ?? 0) > 0 && (
                      <p className="text-[11px] text-red-300 line-clamp-2 mt-1">
                        Reports: {reportsMap[art.id].reasons.join(' | ')}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/15">
                      <button
                        onClick={(e) => handleLike(art.id, e)}
                        className="flex items-center space-x-1.5 text-xs text-gray-300 hover:text-red-400 transition"
                        aria-label="Like artwork"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current text-red-500/80" />
                        <span>{currentLikes}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/3d-models?imageUrl=${encodeURIComponent(art.imageUrl)}&prompt=${encodeURIComponent(art.prompt)}&title=${encodeURIComponent(art.title)}`);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white transition flex items-center gap-1 shadow-sm"
                          title="Generate 3D mesh via Tripo3D"
                        >
                          <Box className="w-3 h-3 text-blue-200" />
                          <span>Tripo 3D</span>
                        </button>

                        {activeFilter === 'mine' && !isShowcase(art) && (
                          <button
                            onClick={(e) => handleShare(art, e)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-black transition flex items-center gap-1 shadow-sm"
                            title="Share to Community"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Share</span>
                          </button>
                        )}

                        {!isOwner && art.id.startsWith('shared-') && (
                          <button
                            onClick={(e) => handleReport(art, e)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white/20 hover:bg-white/30 text-white transition flex items-center gap-1 shadow-sm"
                            title="Report this piece"
                          >
                            <Flag className="w-3 h-3" />
                            <span>Report</span>
                          </button>
                        )}

                        {isOwner && reportsMap[art.id] && (
                          <button
                            onClick={(e) => handleDismiss(art, e)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white/20 hover:bg-white/30 text-white transition shadow-sm"
                            title="Keep it up and clear the report"
                          >
                            Keep
                          </button>
                        )}

                        {isOwner && art.id.startsWith('shared-') && (
                          <button
                            onClick={(e) => handleRemove(art, e)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition flex items-center gap-1 shadow-sm"
                            title="Remove from Community"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => handleCopyPrompt(art.id, art.prompt, e)}
                          className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white transition flex items-center gap-1.5"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <span>Prompt</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {visibleArtworks.length < filteredArtworks.length && (
          <div className="pt-16 text-center">
            <button
              onClick={() => setDisplayedCount((prev) => prev + 8)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/10 hover:border-white/30 bg-[#0E1015] hover:bg-[#151821] text-xs font-bold tracking-widest uppercase text-gray-200 transition-all"
            >
              <span>LOAD MORE ARTWORK</span>
              <span className="text-emerald-400">&darr;</span>
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* Full-size viewer: tapping a picture opens this instead of the studio */}
      {viewerArt && (
        <div
          className="fixed inset-0 z-[90] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setViewerArt(null)}
        >
          <img
            src={viewerArt.imageUrl}
            alt={viewerArt.title}
            className="max-w-full max-h-[78vh] object-contain rounded-xl"
          />
          <p className="mt-3 text-base font-bold text-white text-center line-clamp-2 max-w-xl">{viewerArt.title}</p>
          <div className="mt-3 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                handleOpenWithPrompt(viewerArt.prompt);
                setViewerArt(null);
              }}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold"
            >
              Use prompt in studio
            </button>
            <button
              onClick={() => setViewerArt(null)}
              className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <GeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => {
          setIsGeneratorOpen(false);
          void loadShared();
          void loadMine();
        }}
        initialPrompt={activeGeneratorPrompt}
      />
    </div>
  );
}
