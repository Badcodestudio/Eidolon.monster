// Supabase Edge Function: admin
// Owner-only moderation and account tools. Every call is verified on the server:
// the caller must be signed in AND have profiles.is_owner = true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};


function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !u.user) return json({ error: "Not signed in." }, 401);
  const { data: me } = await admin.from("profiles").select("is_owner").eq("id", u.user.id).maybeSingle();
  if (!me?.is_owner) return json({ error: "Owner access only." }, 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  const action = String(body.action ?? "");

  // Map user ids to emails for display.
  async function emails(ids: string[]) {
    const out: Record<string, string> = {};
    await Promise.all([...new Set(ids)].map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      out[id] = data?.user?.email ?? id;
    }));
    return out;
  }
  async function findUserId(email: string): Promise<string | null> {
    const target = email.trim().toLowerCase();
    for (let page = 1; page <= 10; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      const hit = data?.users?.find((x) => (x.email ?? "").toLowerCase() === target);
      if (hit) return hit.id;
      if (!data?.users || data.users.length < 200) break;
    }
    return null;
  }

  if (action === "list_plans") {
    const { data } = await admin.from("plans").select("*").order("sort");
    return json({ plans: data ?? [] });
  }
  if (action === "save_plan") {
    const name = String(body.name ?? "");
    const num = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.trunc(Number(v ?? 0))));
    const { error } = await admin.from("plans").update({
      price_cents: num(body.price_cents, 1_000_000),
      images_per_month: num(body.images_per_month, 1_000_000),
      images_high_per_month: num(body.images_high_per_month, 1_000_000),
      models3d_per_month: num(body.models3d_per_month, 100_000),
      description: String(body.description ?? "").slice(0, 300),
      active: body.active !== false,
    }).eq("name", name);
    if (error) return json({ error: "Could not save." }, 400);
    return json({ ok: true });
  }

  if (action === "stats") {
    const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
    const since = monthStart.toISOString();
    const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
    const [accounts, locked, imgStd, imgHigh, blocked, notes] = await Promise.all([
      count(admin.from("profiles").select("id", { count: "exact", head: true })),
      count(admin.from("profiles").select("id", { count: "exact", head: true }).eq("locked", true)),
      count(admin.from("generations").select("id", { count: "exact", head: true }).eq("kind", "image").eq("blocked", false).eq("quality", "standard").gte("created_at", since)),
      count(admin.from("generations").select("id", { count: "exact", head: true }).eq("kind", "image").eq("blocked", false).eq("quality", "high").gte("created_at", since)),
      count(admin.from("generations").select("id", { count: "exact", head: true }).eq("blocked", true).not("block_reason", "like", "note:%").gte("created_at", since)),
      count(admin.from("generations").select("id", { count: "exact", head: true }).like("block_reason", "note:%").gte("created_at", since)),
    ]);
    const { data: rows3d } = await admin.from("generations").select("cost")
      .eq("kind", "3d").eq("blocked", false).neq("status", "failed").gte("created_at", since);
    const credits3d = (rows3d ?? []).reduce((n: number, r: { cost: number | null }) => n + Number(r.cost ?? 1), 0);
    const { data: planRows } = await admin.from("plans").select("name,price_cents").order("sort");
    const { data: profs } = await admin.from("profiles").select("plan,is_owner");
    const byPlan: Record<string, number> = {};
    for (const p of profs ?? []) if (!p.is_owner) byPlan[p.plan ?? "Free"] = (byPlan[p.plan ?? "Free"] ?? 0) + 1;
    const plans = (planRows ?? []).map((p: { name: string; price_cents: number }) => ({
      name: p.name, price_cents: p.price_cents, subscribers: byPlan[p.name] ?? 0,
    }));
    return json({ accounts, locked, imgStd, imgHigh, credits3d, blocked, notes, plans });
  }

  if (action === "whoami") return json({ ok: true, email: u.user.email });

  if (action === "list_flagged") {
    const { data } = await admin.from("profiles").select("*")
      .or("locked.eq.true,strikes.gt.0").order("created_at", { ascending: false }).limit(100);
    const rows = data ?? [];
    const map = await emails(rows.map((r) => r.id));
    return json({ accounts: rows.map((r) => ({ ...r, email: map[r.id] })) });
  }

  if (action === "list_blocked") {
    const { data } = await admin.from("generations")
      .select("id,created_at,user_id,kind,prompt,block_reason,matched")
      .eq("blocked", true).order("created_at", { ascending: false }).limit(100);
    const rows = data ?? [];
    const map = await emails(rows.map((r) => r.user_id));
    return json({ items: rows.map((r) => ({ ...r, email: map[r.user_id] })) });
  }

  if (action === "find_user") {
    const id = await findUserId(String(body.email ?? ""));
    if (!id) return json({ error: "No account with that email." }, 404);
    const { data: p } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
    return json({ account: { ...(p ?? { id }), email: String(body.email).trim() } });
  }

  // Everything below changes an account.
  const userId = String(body.user_id ?? "");
  if (!userId) return json({ error: "Missing user." }, 400);

  if (action === "unlock") {
    await admin.from("profiles").update({ locked: false, strikes: 0, lock_reason: null }).eq("id", userId);
    return json({ ok: true });
  }
  if (action === "lock") {
    await admin.from("profiles").update({ locked: true, lock_reason: String(body.reason ?? "manual") }).eq("id", userId);
    return json({ ok: true });
  }
  if (action === "clear_strikes") {
    await admin.from("profiles").update({ strikes: 0 }).eq("id", userId);
    return json({ ok: true });
  }
  if (action === "set_plan") {
    const plan = String(body.plan ?? "");
    const { data: exists } = await admin.from("plans").select("name").eq("name", plan).maybeSingle();
    if (!exists) return json({ error: "Unknown plan." }, 400);
    await admin.from("profiles").update({ plan }).eq("id", userId);
    return json({ ok: true });
  }
  if (action === "add_bonus") {
    const n = Math.max(-100, Math.min(100, Math.trunc(Number(body.amount ?? 0))));
    const { data: p } = await admin.from("profiles").select("bonus_3d").eq("id", userId).single();
    await admin.from("profiles").update({ bonus_3d: Math.max(0, (p?.bonus_3d ?? 0) + n) }).eq("id", userId);
    return json({ ok: true });
  }
  return json({ error: "Unknown action." }, 400);
});
