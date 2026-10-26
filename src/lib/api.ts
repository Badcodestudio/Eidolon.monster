import { supabase } from '@/lib/supabase';

/**
 * Calls one of our Supabase Edge Functions and turns server errors into
 * plain Error messages the UI can show.
 */
export async function invokeFunction<T = Record<string, unknown>>(
  name: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let detail = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        const parsed = await ctx.json();
        if (parsed?.error) detail = parsed.error;
      }
    } catch {
      // keep default message
    }
    throw new Error(detail);
  }
  return data as T;
}
