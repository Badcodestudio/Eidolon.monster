import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GeneratorModal } from '@/components/GeneratorModal';
import { ARTWORK_GALLERY, Artwork } from '@/data/artworks';
import { getCommunityArtworks } from '@/lib/communityGallery';
import {
  Sparkles,
  Heart,
  Check,
  Compass,
  Filter,
  Box,
  History,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GalleryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const [activeFilter, setActiveFilter] = useState<string>(initialTab);
  const [communityArtworks, setCommunityArtworks] = useState<Artwork[]>([]);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState<number>(15);

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activeGeneratorPrompt, setActiveGeneratorPrompt] = useState('');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveFilter(tab);
    }
  }, [searchParams]);

  // Load community creations & listen for real-time updates
  useEffect(() => {
    setCommunityArtworks(getCommunityArtworks());

    const handleUpdate = () => {
      setCommunityArtworks(getCommunityArtworks());
    };

    window.addEventListener('eidolon_gallery_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('eidolon_gallery_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    if (filterId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: filterId });
    }
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Combine static showcase with community submissions
  const allArtworks = [...communityArtworks, ...ARTWORK_GALLERY];

  const filteredArtworks =
    activeFilter === 'all'
      ? allArtworks
      : activeFilter === 'community'
      ? communityArtworks
      : allArtworks.filter((art) => art.category === activeFilter);

  const visibleArtworks = filteredArtworks.slice(0, displayedCount);

  const filters = [
    { id: 'all', label: 'ALL VISIONS' },
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

        {/* Masonry Artwork Grid */}
        {visibleArtworks.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">No creations found in this gallery view yet</h3>
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
                  onClick={() => handleOpenWithPrompt(art.prompt)}
                  className={`group relative rounded-2xl overflow-hidden border border-white/10 bg-[#0E1015] cursor-pointer hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 ${art.aspectRatio}`}
                >
                  {/* Badge */}
                  {art.id.startsWith('community-') && (
                    <div className="absolute top-3 left-3 z-10 bg-emerald-500/90 text-black text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Community</span>
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

      <GeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        initialPrompt={activeGeneratorPrompt}
      />
    </div>
  );
}
