import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/lib/api';
import {
  Box,
  Sparkles,
  Layers,
  Download,
  RotateCw,
  Eye,
  CheckCircle2,
  FileCode,
  Wand2,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';

export default function ThreeDStudioPage() {
  const [searchParams] = useSearchParams();
  const initialImage = searchParams.get('imageUrl') || 'https://cdn.wegic.ai/assets/onepage/agent/images/1792935413853_0.png?imageMogr2/format/webp';
  const initialPrompt = searchParams.get('prompt') || 'Gothic obsidian cyber-gargoyle with glowing cyan rune circuitry';
  const initialTitle = searchParams.get('title') || 'Gothic Obsidian Cyber-Gargoyle';

  // Primary Default: Image to 3D pipeline
  const [inputMode, setInputMode] = useState<'image' | 'prompt'>('image');
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [artStyle, setArtStyle] = useState('realistic');
  const [topology, setTopology] = useState('quad');
  const [targetPolycount, setTargetPolycount] = useState('50k');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tripoStatus, setTripoStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [generatedModel, setGeneratedModel] = useState<{
    title: string;
    format: string;
    polycount: string;
    textureMap: string;
    previewUrl: string;
    modelUrl?: string;
  } | null>({
    title: initialTitle,
    format: 'GLB / OBJ / FBX',
    polycount: '48,200 Quads',
    textureMap: '4K PBR (Albedo, Normal, Roughness, Emissive)',
    previewUrl: initialImage,
  });

  useEffect(() => {
    const qImg = searchParams.get('imageUrl');
    const qPrompt = searchParams.get('prompt');
    const qTitle = searchParams.get('title');

    if (qImg) {
      setImageUrl(qImg);
      setInputMode('image');
      if (qTitle) {
        setGeneratedModel((prev) => prev ? { ...prev, title: qTitle, previewUrl: qImg } : null);
      }
    }
    if (qPrompt) {
      setPrompt(qPrompt);
    }
  }, [searchParams]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSynthesize3D = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsGenerating(true);
    setTripoStatus('Contacting the 3D studio...');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Please sign in to create 3D models.');
      }

      // The server checks your plan, runs moderation and holds the Tripo key.
      const start = await invokeFunction<{ task_id?: string }>('generate-3d', {
        action: 'start',
        mode: inputMode,
        image_url: imageUrl,
        prompt,
        topology,
        polycount: targetPolycount,
      });
      const taskId = start.task_id;
      if (!taskId) throw new Error('The 3D studio did not accept the request.');

      setTripoStatus('Generating 3D geometry & PBR texture maps...');

      // Poll the server every 3 seconds for up to 4 minutes.
      for (let attempt = 0; attempt < 80; attempt += 1) {
        await sleep(3000);
        const check = await invokeFunction<{
          status: string;
          progress?: number;
          model_url?: string | null;
          preview_url?: string | null;
          error?: string;
        }>('generate-3d', { action: 'status', task_id: taskId });

        if (check.status === 'success') {
          setGeneratedModel({
            title: prompt.slice(0, 36) || 'Synthesized 3D Asset',
            format: 'GLB / USDZ / OBJ',
            polycount: targetPolycount === '50k' ? '~50,000 faces' : '~18,000 faces',
            textureMap: 'PBR Metallic-Roughness',
            previewUrl: check.preview_url || imageUrl,
            modelUrl: check.model_url || undefined,
          });
          return;
        }
        if (check.status === 'failed') {
          throw new Error(check.error || 'The 3D engine could not build a model from this input.');
        }
        setTripoStatus(`Synthesizing 3D mesh: ${check.progress ?? 0}%`);
      }
      throw new Error('This is taking longer than expected. Please try again in a few minutes.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong creating the 3D model.');
    } finally {
      setIsGenerating(false);
      setTripoStatus('');
    }
  };

  const sample3DModels = [
    {
      id: 'model-1',
      title: 'Colossal Wyrm Dragon Skull',
      format: 'GLB / FBX',
      triangles: '64k',
      img: 'https://cdn.wegic.ai/assets/onepage/agent/images/1792935238399_0.png?imageMogr2/format/webp',
    },
    {
      id: 'model-2',
      title: 'Celestial Astral Portal Ring',
      format: 'GLB / OBJ',
      triangles: '52k',
      img: 'https://cdn.wegic.ai/assets/onepage/agent/images/1792935325074_0.png?imageMogr2/format/webp',
    },
    {
      id: 'model-3',
      title: 'Titan Sovereign Obsidian Bastion',
      format: 'GLB / USDZ',
      triangles: '78k',
      img: 'https://cdn.wegic.ai/assets/onepage/agent/images/1792935413853_0.png?imageMogr2/format/webp',
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6E8EC]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-36 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10 mb-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase tracking-widest">
              <Box className="w-3.5 h-3.5" />
              3D Mesh & Spatial Asset Engine
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white uppercase font-sans">
              3D Models Studio
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
              Transform conceptual character prompts and sketches into production-ready 3D game meshes, quad topology, and 4K PBR textures with the Eidolon studio engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Live Pipeline
            </span>
          </div>
        </div>

        {/* Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-[#0E1015] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-blue-400" />
                Tripo3D Mesh Pipeline
              </h2>
              <span className="text-[10px] font-mono text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Tripo3D v2.0
              </span>
            </div>

            {/* Input Mode Selector */}
            <div className="flex items-center p-1 bg-[#141720] rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setInputMode('image')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                  inputMode === 'image'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image to 3D (Tripo)</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('prompt')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                  inputMode === 'prompt'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Text to 3D</span>
              </button>
            </div>

            <form onSubmit={handleSynthesize3D} className="space-y-5">
              {inputMode === 'image' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-gray-400">
                      Source Image for 3D Mesh
                    </label>
                    <span className="text-[10px] text-blue-400 font-mono">PNG / JPEG / WebP</span>
                  </div>

                  {imageUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-[#141720] border border-blue-500/40 rounded-xl">
                      <img
                        src={imageUrl}
                        alt="3D Mesh Source"
                        className="w-16 h-16 object-cover rounded-lg border border-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Image Locked
                        </span>
                        <p className="text-xs text-white truncate font-medium mt-0.5">{prompt.slice(0, 45) || 'Loaded character artwork'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Ready for Tripo3D topology & quad-remeshing</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-[11px] text-gray-400 hover:text-red-400 font-mono underline px-2 py-1"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-white/15 hover:border-blue-400/50 rounded-xl p-4 text-center transition bg-[#141720]/60">
                        <ImageIcon className="w-7 h-7 text-blue-400/80 mx-auto mb-1.5" />
                        <p className="text-xs text-white font-medium">Upload or Paste Source Image</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Tripo3D will turn this image into a textured 3D mesh</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (uploadEvent) => {
                                const result = uploadEvent.target?.result as string;
                                setImageUrl(result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="mt-2 block w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-mono file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Or paste an image URL..."
                        className="w-full bg-[#141720] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Character / Asset Prompt & Tweaks
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your 3D asset, character bust, helmet, weapon, or creature..."
                  className="w-full bg-[#141720] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                    Mesh Style
                  </label>
                  <select
                    value={artStyle}
                    onChange={(e) => setArtStyle(e.target.value)}
                    className="w-full bg-[#141720] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                  >
                    <option value="realistic">Realistic PBR</option>
                    <option value="stylized">Stylized Fantasy</option>
                    <option value="gothic">Gothic Dark Art</option>
                    <option value="cyber">Cyberpunk Hard-Surface</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                    Topology
                  </label>
                  <select
                    value={topology}
                    onChange={(e) => setTopology(e.target.value)}
                    className="w-full bg-[#141720] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                  >
                    <option value="quad">Quad Clean Mesh</option>
                    <option value="triangle">Triangulated Game Asset</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Target Polycount Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['20k (Mobile)', '50k (Console)', '120k (Cinematic)'].map((count) => (
                    <button
                      type="button"
                      key={count}
                      onClick={() => setTargetPolycount(count)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-mono transition text-center ${
                        targetPolycount === count
                          ? 'bg-blue-500 text-white font-bold'
                          : 'bg-[#141720] text-gray-400 border border-white/5 hover:text-white'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {tripoStatus && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-mono animate-pulse">
                  <RotateCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                  <span>{tripoStatus}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing 3D Geometry...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate 3D Asset</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 3D Viewport Column */}
          <div className="lg:col-span-7 bg-[#0E1015] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xl relative min-h-[480px]">
            {/* Top Viewport Overlay Controls */}
            <div className="p-4 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-mono text-white font-bold">
                  WebGL 3D Viewport
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">
                  Orbit: 360&deg;
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-blue-300">
                  PBR Shaded
                </span>
              </div>
            </div>

            {/* Viewport Display Area */}
            <div className="relative flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-black/80 via-[#0A0D14] to-black/90">
              {/* Subtle 3D Grid floor */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />

              {generatedModel && (
                <div className="relative z-10 text-center space-y-4 max-w-md">
                  <div className="relative mx-auto w-64 h-64 rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl group">
                    <img
                      src={generatedModel.previewUrl}
                      alt={generatedModel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-blue-500/10 group-hover:opacity-0 transition-opacity" />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-blue-300 border border-blue-500/30 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Inspect 3D</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-sans">
                      {generatedModel.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {generatedModel.polycount} &bull; {generatedModel.textureMap}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-white/10 bg-[#0B0D13] flex flex-wrap items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Export: .GLB, .FBX, .OBJ, .USDZ</span>
              </div>

              <div className="flex items-center gap-2">
                {generatedModel?.modelUrl ? (
                  <a
                    href={generatedModel.modelUrl}
                    download="model.glb"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .GLB Mesh</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (generatedModel?.previewUrl) {
                        const link = document.createElement('a');
                        link.href = generatedModel.previewUrl;
                        link.download = '3d-asset-preview.png';
                        link.click();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download 3D Asset</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Generated 3D Library */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white font-sans">
                Curated 3D Mesh Library
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Inspect and download pre-compiled creature and architectural meshes.
              </p>
            </div>
            <span className="text-xs font-mono text-blue-400">PBR Textured &bull; Rig-Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {sample3DModels.map((item) => (
              <div
                key={item.id}
                className="bg-[#0E1015] border border-white/10 rounded-2xl overflow-hidden hover:border-blue-400/40 transition group"
              >
                <div className="relative aspect-video overflow-hidden bg-black/60">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-blue-300 border border-blue-500/30">
                    {item.triangles} Tris
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                    <span className="text-[10px] font-mono text-gray-400">{item.format}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt(`3D Asset: ${item.title}`);
                      setGeneratedModel({
                        title: item.title,
                        format: item.format,
                        polycount: `${item.triangles} Triangles`,
                        textureMap: '4K PBR Textures',
                        previewUrl: item.img,
                      });
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-300 hover:text-blue-300 transition"
                    title="Load in 3D Viewport"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
