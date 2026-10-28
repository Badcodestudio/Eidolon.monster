import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/lib/api';
import { UsageBadge } from '@/components/UsageBadge';
import { loadUsage, notifyUsageChanged } from '@/lib/usage';
import {
  Box,
  Sparkles,
  Download,
  RotateCw,
  Eye,
  CheckCircle2,
  FileCode,
  Wand2,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';

const ModelViewer = lazy(() => import('@/components/ModelViewer'));

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
  const [detail, setDetail] = useState<'standard' | 'high'>('standard');
  const [targetPolycount, setTargetPolycount] = useState('50k');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tripoStatus, setTripoStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // The signed-in person's own finished 3D models (kept in the studio's storage).
  type MyModel = { id: string; created_at: string; prompt: string | null; result_url: string; preview_url: string | null };
  const [myModels, setMyModels] = useState<MyModel[]>([]);
  const [spinId, setSpinId] = useState<string | null>(null); // which saved model is spinning as a turntable
  const [myModelsState, setMyModelsState] = useState<'loading' | 'signedout' | 'ready'>('loading');
  const loadMyModels = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      setMyModels([]);
      setMyModelsState('signedout');
      return;
    }
    const { data } = await supabase
      .from('generations')
      .select('id,created_at,prompt,result_url,preview_url')
      .eq('kind', '3d')
      .eq('status', 'done')
      .not('result_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(24);
    setMyModels((data ?? []) as MyModel[]);
    setMyModelsState('ready');
  };
  useEffect(() => {
    void loadMyModels();
  }, []);

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
      const usageNow = await loadUsage();
      if (usageNow && !usageNow.isOwner && usageNow.modelsLimit <= 0 && usageNow.bonus3d <= 0) {
        throw new Error('Free accounts can browse the gallery. Choose a plan to create 3D models.');
      }
      const needed = detail === 'high' ? 2 : 1;
      if (usageNow && !usageNow.isOwner && usageNow.modelsLimit - usageNow.modelsUsed + usageNow.bonus3d < needed) {
        throw new Error(
          detail === 'high'
            ? "You don't have enough 3D credits left for a High-detail model (it uses 2). Try Standard detail."
            : 'You have used all of your 3D credits for this month.'
        );
      }

      // The server checks your plan, runs moderation and holds the Tripo key.
      const start = await invokeFunction<{ task_id?: string }>('generate-3d', {
        action: 'start',
        mode: inputMode,
        image_url: imageUrl,
        prompt,
        topology,
        polycount: targetPolycount,
        quality: detail,
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
            format: 'GLB',
            polycount: `Target ${targetPolycount.split(' ')[0]} faces`,
            textureMap: detail === 'high' ? 'High-detail PBR textures' : 'PBR textures',
            previewUrl: check.preview_url || imageUrl,
            modelUrl: check.model_url || undefined,
          });
          void loadMyModels();
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
      notifyUsageChanged();
    }
  };


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
            <UsageBadge kind="3d" />
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
                  Model detail
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['standard', 'Standard (1 credit)'],
                    ['high', 'High detail (2 credits)'],
                  ] as const).map(([id, label]) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => setDetail(id)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-mono transition text-center ${
                        detail === id
                          ? 'bg-blue-500 text-white font-bold'
                          : 'bg-[#141720] text-gray-400 border border-white/5 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
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
                  {generatedModel.modelUrl ? (
                    <div className="relative mx-auto w-72 h-72 sm:w-80 sm:h-80 rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl bg-[#0B0D13]">
                      <Suspense
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-blue-300">
                            Loading 3D viewer...
                          </div>
                        }
                      >
                        <ModelViewer
                          url={generatedModel.modelUrl}
                          fallback={
                            <img src={generatedModel.previewUrl} alt={generatedModel.title} className="w-full h-full object-cover" />
                          }
                        />
                      </Suspense>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-blue-300 border border-blue-500/30 flex items-center gap-1 pointer-events-none">
                        <Eye className="w-3 h-3" />
                        <span>Drag to rotate &bull; pinch to zoom</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative mx-auto w-64 h-64 rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl">
                      <img
                        src={generatedModel.previewUrl}
                        alt={generatedModel.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

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
                <span>Export: .GLB</span>
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

        {/* Your 3D models */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white font-sans">Your 3D Models</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Everything you've built here is kept. Open one in the viewer or download the .GLB file.
              </p>
            </div>
            <span className="text-xs font-mono text-blue-400">{myModels.length} saved</span>
          </div>

          {myModelsState === 'loading' ? (
            <p className="text-xs font-mono text-gray-400">Loading your models...</p>
          ) : myModelsState === 'signedout' ? (
            <p className="text-sm text-gray-400">Sign in to see the 3D models you've made.</p>
          ) : myModels.length === 0 ? (
            <p className="text-sm text-gray-400">No 3D models yet. Build your first one above and it will show up here.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {myModels.map((m) => {
                const title = (m.prompt ?? '').trim().slice(0, 40) || '3D model';
                const preview = m.preview_url || imageUrl;
                return (
                  <div
                    key={m.id}
                    className="bg-[#0E1015] border border-white/10 rounded-2xl overflow-hidden hover:border-blue-400/40 transition group"
                  >
                    <div className="relative aspect-video overflow-hidden bg-black/60">
                      {spinId === m.id ? (
                        <Suspense
                          fallback={
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-blue-300">
                              Loading turntable...
                            </div>
                          }
                        >
                          <ModelViewer
                            url={m.result_url}
                            fallback={
                              m.preview_url ? (
                                <img src={m.preview_url} alt={title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full" />
                              )
                            }
                          />
                        </Suspense>
                      ) : m.preview_url ? (
                        <img
                          src={m.preview_url}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-300">
                          <Box className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-mono text-blue-300 border border-blue-500/30">
                        GLB
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div>
                        <h4 className="text-xs font-bold text-white truncate">{title}</h4>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSpinId(spinId === m.id ? null : m.id)}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-200 hover:text-blue-300 text-[11px] font-semibold transition flex items-center justify-center gap-1"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>{spinId === m.id ? 'Stop' : 'Spin'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGeneratedModel({
                              title,
                              format: 'GLB',
                              polycount: 'Saved model',
                              textureMap: 'PBR textures',
                              previewUrl: preview,
                              modelUrl: m.result_url,
                            });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-200 hover:text-blue-300 text-[11px] font-semibold transition flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <a
                          href={m.result_url}
                          download="model.glb"
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-[11px] font-semibold transition flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>.GLB</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
