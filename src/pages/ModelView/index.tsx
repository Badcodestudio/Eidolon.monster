import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/lib/api';
import { ArrowLeft, Download, Pause, Play, AlertCircle } from 'lucide-react';

const ModelViewer = lazy(() => import('@/components/ModelViewer'));

type Row = { id: string; prompt: string | null; result_url: string | null; preview_url: string | null; task_id: string | null };

// A model is viewable once it is a GLB stored in our own storage.
const isGlb = (u: string | null) => !!u && /\/creations\/.*\.glb(\?|$)/i.test(u);

export default function ModelViewPage() {
  const { id } = useParams();
  const [row, setRow] = useState<Row | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'fixing' | 'missing' | 'old'>('loading');
  const [spin, setSpin] = useState(true);
  const [speed, setSpeed] = useState(1.5);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('generations')
        .select('id,prompt,result_url,preview_url,task_id')
        .eq('id', id ?? '')
        .eq('kind', '3d')
        .maybeSingle();
      if (cancelled) return;
      if (!data) return setState('missing');
      let r = data as Row;
      setRow(r);
      if (isGlb(r.result_url)) return setState('ready');
      // Older models were saved in a format the browser can't show. Ask the server to convert them once.
      if (!r.task_id) return setState('old');
      setState('fixing');
      try {
        const res = await invokeFunction<{ status: string; model_url?: string | null; preview_url?: string | null }>(
          'generate-3d',
          { action: 'status', task_id: r.task_id }
        );
        if (cancelled) return;
        if (res.status === 'success' && isGlb(res.model_url ?? null)) {
          r = { ...r, result_url: res.model_url ?? null, preview_url: res.preview_url ?? r.preview_url };
          setRow(r);
          setState('ready');
        } else setState('old');
      } catch {
        if (!cancelled) setState('old');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const title = (row?.prompt ?? '').trim().slice(0, 60) || '3D model';
  const poster = row?.preview_url ? <img src={row.preview_url} alt={title} className="w-full h-full object-contain" /> : <div />;

  return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-24 pb-10 space-y-4">
        <Link to="/3d-models" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to 3D Studio
        </Link>
        <h1 className="text-xl font-bold truncate">{title}</h1>

        <div className="relative w-full aspect-square sm:aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10">
          {state === 'ready' && row?.result_url ? (
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-xs font-mono text-blue-300">Loading model...</div>}>
              <ModelViewer url={row.result_url} fallback={poster} spin={spin} speed={speed} />
            </Suspense>
          ) : state === 'loading' || state === 'fixing' ? (
            <div className="w-full h-full flex items-center justify-center text-xs font-mono text-blue-300">
              {state === 'fixing' ? 'Preparing this older model for viewing...' : 'Loading...'}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-gray-300">
              {row?.preview_url && <img src={row.preview_url} alt={title} className="max-h-48 rounded-lg opacity-80" />}
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <p className="text-sm">
                {state === 'missing'
                  ? 'This model could not be found. Sign in with the account that made it.'
                  : 'This older model is no longer available to view. Please build it again in the 3D Studio.'}
              </p>
            </div>
          )}
        </div>

        {state === 'ready' && row?.result_url && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSpin((v) => !v)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-sm font-semibold flex items-center gap-2"
            >
              {spin ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {spin ? 'Pause turntable' : 'Start turntable'}
            </button>
            <label className="flex items-center gap-2 text-xs text-gray-400">
              Speed
              <input type="range" min={0.5} max={6} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            </label>
            <a
              href={row.result_url}
              download="model.glb"
              className="ml-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download .GLB
            </a>
          </div>
        )}
        <p className="text-xs text-gray-500">Drag to rotate, pinch or scroll to zoom.</p>
      </main>
      <Footer />
    </div>
  );
}
