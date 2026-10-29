// Supabase Edge Function: community
// Actions: list (public), share, unshare, like, remove (owner only).
// Only a person's own, unblocked image can be shared (it already passed our prompt check and fal's check).
// The owner reviews the Community tab and can remove anything; a removed piece can't be shared again.

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
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }

  // Optional sign-in (the list is public). A bare anon key is not a user, so getUser simply fails.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  let userId: string | null = null;
  let isOwner = false;
  if (token) {
    const { data } = await admin.auth.getUser(token);
    if (data?.user) {
      userId = data.user.id;
      const { data: p } = await admin.from("profiles").select("is_owner,locked").eq("id", userId).maybeSingle();
      isOwner = p?.is_owner === true;
      if (p?.locked && !isOwner) userId = null;
    }
  }
  const action = String(body.action ?? "");

  if (action === "list") {
    const { data: rows } = await admin.from("generations")
      .select("id,share_title,prompt,result_url,shared_at")
      .eq("shared", true).eq("blocked", false).eq("kind", "image")
      .order("shared_at", { ascending: false }).limit(60);
    const ids = (rows ?? []).map((r) => r.id);
    const counts: Record<string, number> = {};
    const mine = new Set<string>();
    if (ids.length) {
      const { data: likes } = await admin.from("community_likes").select("generation_id,user_id").in("generation_id", ids);
      for (const l of likes ?? []) {
        counts[l.generation_id] = (counts[l.generation_id] ?? 0) + 1;
        if (userId && l.user_id === userId) mine.add(l.generation_id);
      }
    }
    return json({
      is_owner: isOwner,
      items: (rows ?? []).map((r) => ({
        id: r.id, title: r.share_title || "Untitled", prompt: r.prompt ?? "", image_url: r.result_url,
        likes: counts[r.id] ?? 0, liked: mine.has(r.id),
      })),
    });
  }

  if (!userId) return json({ error: "Please sign in." }, 401);

  if (action === "share") {
    const originalUrl = String(body.original_url ?? "");
    const title = String(body.title ?? "").trim().slice(0, 80);
    if (!originalUrl) return json({ error: "Missing image." }, 400);
    const { data: row } = await admin.from("generations").select("id,removed_by_admin,shared")
      .eq("user_id", userId).eq("kind", "image").eq("blocked", false).eq("result_url", originalUrl)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!row) return json({ error: "Image not found. Only pictures you made here can be shared." }, 404);
    if (row.removed_by_admin) return json({ error: "This piece was removed from the community and can't be shared again." }, 403);
    if (row.shared) return json({ ok: true, id: row.id });
    const { error } = await admin.from("generations")
      .update({ shared: true, shared_at: new Date().toISOString(), share_title: title || null }).eq("id", row.id);
    if (error) return json({ error: "Could not share right now." }, 500);
    return json({ ok: true, id: row.id });
  }

  const id = String(body.id ?? "");
  if (!id) return json({ error: "Missing id." }, 400);

  if (action === "unshare") {
    let q = admin.from("generations").update({ shared: false }).eq("id", id);
    if (!isOwner) q = q.eq("user_id", userId);
    const { error } = await q;
    return error ? json({ error: "Could not update." }, 500) : json({ ok: true });
  }

  if (action === "remove") {
    if (!isOwner) return json({ error: "Owner access only." }, 403);
    const { error } = await admin.from("generations").update({ shared: false, removed_by_admin: true }).eq("id", id);
    return error ? json({ error: "Could not remove." }, 500) : json({ ok: true });
  }

  if (action === "like") {
    const { data: g } = await admin.from("generations").select("id").eq("id", id).eq("shared", true).maybeSingle();
    if (!g) return json({ error: "Not found." }, 404);
    const { data: ex } = await admin.from("community_likes").select("generation_id").eq("generation_id", id).eq("user_id", userId).maybeSingle();
    if (ex) await admin.from("community_likes").delete().eq("generation_id", id).eq("user_id", userId);
    else await admin.from("community_likes").insert({ generation_id: id, user_id: userId });
    const { count } = await admin.from("community_likes").select("generation_id", { count: "exact", head: true }).eq("generation_id", id);
    return json({ ok: true, liked: !ex, likes: count ?? 0 });
  }

  return json({ error: "Unknown action." }, 400);
});
