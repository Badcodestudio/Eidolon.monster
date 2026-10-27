import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Usage {
  plan: string;
  isOwner: boolean;
  imagesUsed: number;
  imagesLimit: number;
  imagesHighUsed: number;
  imagesHighLimit: number;
  modelsUsed: number;
  modelsLimit: number;
  bonus3d: number;
}

/** Reads the signed-in person's plan and this month's counters (row-level security keeps it to their own rows). */
export async function loadUsage(): Promise<Usage | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan,bonus_3d,is_owner')
    .eq('id', user.id)
    .maybeSingle();
  const plan = profile?.plan ?? 'Free';

  const { data: planRow } = await supabase
    .from('plans')
    .select('images_per_month,images_high_per_month,models3d_per_month')
    .eq('name', plan)
    .maybeSingle();

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const since = monthStart.toISOString();

  const { count: imagesUsed } = await supabase
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('kind', 'image')
    .eq('quality', 'standard')
    .eq('blocked', false)
    .gte('created_at', since);

  const { count: imagesHighUsed } = await supabase
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('kind', 'image')
    .eq('quality', 'high')
    .eq('blocked', false)
    .gte('created_at', since);

  // 3D allowance is counted in credits: a Standard model uses 1, a High-detail model uses 2.
  const { data: modelRows } = await supabase
    .from('generations')
    .select('cost')
    .eq('user_id', user.id)
    .eq('kind', '3d')
    .eq('blocked', false)
    .eq('used_bonus', false)
    .neq('status', 'failed')
    .gte('created_at', since);
  const modelsUsed = (modelRows ?? []).reduce((n, r) => n + Number(r.cost ?? 1), 0);

  return {
    plan,
    isOwner: profile?.is_owner === true,
    imagesUsed: imagesUsed ?? 0,
    imagesLimit: planRow?.images_per_month ?? 0,
    imagesHighUsed: imagesHighUsed ?? 0,
    imagesHighLimit: planRow?.images_high_per_month ?? 0,
    modelsUsed,
    modelsLimit: planRow?.models3d_per_month ?? 0,
    bonus3d: profile?.bonus_3d ?? 0,
  };
}

export function notifyUsageChanged() {
  window.dispatchEvent(new Event('eidolon_usage_updated'));
}

/** React hook: current usage, refreshed on sign-in/out and after each generation. */
export function useUsage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const refresh = useCallback(async () => {
    try {
      setUsage(await loadUsage());
    } catch {
      setUsage(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener('eidolon_user_updated', refresh);
    window.addEventListener('eidolon_usage_updated', refresh);
    return () => {
      window.removeEventListener('eidolon_user_updated', refresh);
      window.removeEventListener('eidolon_usage_updated', refresh);
    };
  }, [refresh]);

  return { usage, refresh };
}
