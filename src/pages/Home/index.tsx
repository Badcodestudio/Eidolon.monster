import { useState, useEffect } from 'react';
import { ArrowUpRight, Heart, Check, Sparkles, Box } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GeneratorModal } from '@/components/GeneratorModal';
import { SHOWCASE_CATEGORIES, Artwork } from '@/data/artworks';
import { getAllGalleryArtworks } from '@/lib/communityGallery';

export default function HomePage() {
  const navigate = useNavigate();
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allArtworks, setAllArtworks] = useState<Artwork[]>(() => getAllGalleryArtworks());

  // Listen for newly saved community artworks so the gallery updates dynamically
  useEffect(() => {
    const handleGalleryUpdate = () => {
      setAllArtworks(getAllGalleryArtworks());
    };
    window.addEventListener('eidolon_gallery_updated', handleGalleryUpdate);

    return () => window.removeEventListener('eidolon_gallery_updated', handleGalleryUpdate);
  }, []);

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
    setActivePrompt(promptText);
    setIsGeneratorOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6E8EC] selection:bg-emerald-500/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar onOpenGenerator={() => setIsGeneratorOpen(true)} />

      {/* ===================== HERO SECTION ===================== */}
      {/* Renders in full-bleed-background mode using reference asset per instructions */}
      <section
        className="relative min-h-[780px] lg:min-h-[920px] w-full flex items-center bg-cover bg-right sm:bg-center border-b border-white/5"
        style={{
          backgroundImage: `url('https://cdn.wegic.ai/assets/onepage/agent/reference-assets/hero-snake-woman-01M5RH296C6CMEQ316RRPPNZFX-enhanced.png')`,
          backgroundPosition: 'calc(50% + 140px) center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Cinematic atmospheric overlays to enhance contrast and typography legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090C] via-[#08090C]/85 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-transparent to-black/30 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 w-full pt-32 pb-24">
          <div className="max-w-2xl space-y-6">
            {/* Main Headline reproducing reference image */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-wider">
                <span>εἴδωλον</span>
                <span className="text-gray-500">•</span>
                <span className="italic text-gray-300">ei·do·lon /ˈaɪdələn/ : phantom spirit, phantom double, apparition</span>
              </div>
              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white leading-[1.08] font-sans">
                Boundless<br />Imagination.
              </h1>
            </div>

            {/* Sub-headline uppercase tracker */}
            <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-gray-300 uppercase">
              AI CHARACTERS. LIMITLESS WORLDS.
            </p>

            {/* Paragraph body matching reference */}
            <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed font-normal max-w-lg">
              Eidolon.monster is the high-fidelity AI character generation platform for mature creators, concept artists, and worldbuilders. Explore myth, fantasy, sci-fi, anime, and dark aesthetics in masterwork detail.
            </p>

            {/* CTA button matching reference */}
            <div className="pt-2">
              <button
                onClick={() => setIsGeneratorOpen(true)}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-white hover:bg-gray-100 text-[#0A0C10] font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-xl group hover:scale-[1.02]"
              >
                <span>START GENERATING</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            {/* Trust Laurel Badges reproducing reference badges */}
            <div className="pt-10 flex flex-wrap items-center gap-8 text-gray-400">
              {/* Badge 1 */}
              <div className="flex items-center space-x-2">
                <span className="text-lg opacity-70">🌿</span>
                <div className="text-[10px] font-bold tracking-widest uppercase leading-tight text-gray-300">
                  AI<br />RENDER<br />ENGINE
                </div>
                <span className="text-lg opacity-70 scale-x-[-1]">🌿</span>
              </div>

              {/* Badge 2 */}
              <div className="flex items-center space-x-2">
                <span className="text-lg opacity-70">🌿</span>
                <div className="text-[10px] font-bold tracking-widest uppercase leading-tight text-gray-300">
                  PARAMETRIC<br />CREATIVE<br />MASTERY
                </div>
                <span className="text-lg opacity-70 scale-x-[-1]">🌿</span>
              </div>

              {/* Badge 3 */}
              <div className="flex items-center space-x-2">
                <span className="text-lg opacity-70">🌿</span>
                <div className="text-[10px] font-bold tracking-widest uppercase leading-tight text-gray-300">
                  BUILT FOR<br />PROFESSIONAL<br />CREATORS
                </div>
                <span className="text-lg opacity-70 scale-x-[-1]">🌿</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 3-COLUMN SHOWCASE TILES ===================== */}
      {/* Reproducing the three distinct atmospheric cards in the reference */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHOWCASE_CATEGORIES.map((item) => (
            <Link
              key={item.id}
              to={`/gallery?tab=${item.id}`}
              className="group relative rounded-xl overflow-hidden aspect-[3/4] border border-white/10 bg-[#0F1116] cursor-pointer shadow-lg hover:border-emerald-400/50 transition-all duration-300 block"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95 group-hover:brightness-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
              
              {/* Card Label and Arrow */}
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
                <span className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </span>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================== EXPLORE GALLERY SPOTLIGHT ===================== */}
      <section id="gallery" className="max-w-7xl mx-auto px-6 sm:px-12 py-16 scroll-mt-24">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-white/5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Featured Showcases
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase font-sans">
              Curated Visions
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Top character concepts and world scenes crafted with the studio engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-gray-200 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-white/5"
            >
              <span>Explore Full Gallery ({allArtworks.length})</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Clean 4-card spotlight grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-10">
          {allArtworks.slice(0, 4).map((art) => {
            const currentLikes = art.likes + (likesMap[art.id] || 0);
            const isCopied = copiedId === art.id;

            return (
              <div
                key={art.id}
                onClick={() => handleOpenWithPrompt(art.prompt)}
                className="group relative rounded-2xl overflow-hidden border border-white/10 bg-[#0E1015] cursor-pointer hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 aspect-[4/5]"
              >
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

                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end text-left">
                  <span className="text-[10px] uppercase font-mono text-emerald-400 tracking-wider">
                    {art.pantheon} • {art.category}
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

        {/* Big clean banner leading to dedicated gallery */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-[#10131B] via-[#141722] to-[#0E1015] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white font-sans">
              Dive into the Full Creator Archives
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-lg">
              Explore thousands of community creations, fantasy classes, cosmic sci-fi worlds, and anime character presets.
            </p>
          </div>
          <Link
            to="/gallery"
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
          >
            <span>Open Dedicated Gallery</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ===================== BUILT FOR CREATORS (FEATURES) ===================== */}
      {/* Exact 4-column feature row from reference */}
      <section id="features" className="max-w-7xl mx-auto px-6 sm:px-12 py-20 border-t border-white/5 scroll-mt-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Header Column */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold uppercase tracking-wide text-white leading-tight font-sans">
              BUILT FOR<br />CREATORS
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Powerful tools. Total freedom.<br />Cinematic results.
            </p>
            <a
              href="#features"
              onClick={() => setIsGeneratorOpen(true)}
              className="inline-flex items-center text-xs font-semibold tracking-wider uppercase text-gray-300 hover:text-emerald-400 transition-colors pt-2"
            >
              <span>SEE ALL FEATURES</span>
              <span className="ml-1">→</span>
            </a>
          </div>

          {/* Feature 1 */}
          <div className="space-y-3">
            {/* Infinity symbol icon */}
            <div className="text-white text-2xl font-light">
              <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.178 8c5.096 0 5.096 8 0 8-2.695 0-4.757-2.673-6.178-5.333C10.578 8 8.517 8 5.822 8 0.726 8 0.726 16 5.822 16c2.695 0 4.757-2.673 6.178-5.333C13.422 16 15.483 16 18.178 16z" />
              </svg>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              ADVANCED CHARACTER SYNTHESIS
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Expansive mythological archetypes, rich aesthetics, and dark fantasy styles crafted for concept artists.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="space-y-3">
            {/* 3D Cube / Engine icon */}
            <div className="text-white text-2xl font-light">
              <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m9-5.25v9l-9-5.25" />
              </svg>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              CINEMATIC AI RENDER ENGINE
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Cutting-edge AI models delivering production-quality detail, lighting, and atmosphere.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="space-y-3">
            {/* Sliders / Control icon */}
            <div className="text-white text-2xl font-light">
              <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              TOTAL CREATIVE CONTROL
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Fine-tune every detail. Pose, mood, style, composition—perfect your vision.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== CTA BANNER SECTION ===================== */}
      {/* Exact match with reference bottom call-to-action banner */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-10 pb-20">
        <div
          className="relative rounded-2xl overflow-hidden border border-white/10 p-8 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-8 bg-cover bg-center shadow-2xl"
          style={{
            backgroundImage: `url('https://cdn.wegic.ai/assets/onepage/agent/reference-assets/cta-banner-background-01M5RH296GTTA14D9Z2T6XBM7X-enhanced.png')`,
          }}
        >
          {/* Dark gradient veil */}
          <div className="absolute inset-0 bg-[#08090C]/85 backdrop-blur-[1px] pointer-events-none" />

          <div className="relative z-10 max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans">
              Start Creating Today
            </h3>
            <p className="text-xs sm:text-sm text-gray-300">
              Join thousands of artists, storytellers, and worldbuilders pushing the boundaries of AI-generated art.
            </p>
          </div>

          <div className="relative z-10 flex-shrink-0">
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-white hover:bg-gray-100 text-[#0A0C10] font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-xl group hover:scale-[1.02]"
            >
              <span>LAUNCH APP NOW</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Generator Modal */}
      <GeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        initialPrompt={activePrompt}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
