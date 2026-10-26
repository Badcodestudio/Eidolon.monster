// Supabase Edge Function: generate-3d
// Two actions in one function:
//   { action: "start",  mode: "image" | "prompt", image_url?, prompt?, topology?, polycount? }
//   { action: "status", task_id }
// Checks sign-in, account lock, plan allowance and moderation, then talks to
// Tripo3D with the studio's own key (secret TRIPO_KEY). The browser never sees it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TRIPO = "https://api.tripo3d.ai/v2/openapi/task";
const LOCK_AT = 2;

// Monthly 3D models included in each plan. Extra purchased models live in profiles.bonus_3d.
const PLAN_ALLOWANCE: Record<string, number> = { Free: 0, Pro: 5 };

// ---- Moderation (same draft rules as generate-image: keep the two in sync) ----
const MINOR_PATTERNS: RegExp[] = [
  /\b(child|children|kid|kids|minor|minors|underage|under-age|toddler|baby|infant|preteen|pre-teen|tween)\b/i,
  /\b(teen|teens|teenage|teenager|teenaged)\b/i,
  /\b(loli|lolita|shota|schoolgirl|schoolboy|school girl|school boy)\b/i,
  /\b(young girl|young boy|little girl|little boy)\b/i,
  /\b([0-9]|1[0-7])[\s-]*(year|yr)s?[\s-]*old\b/i,
  /\bage[d]?\s*([0-9]|1[0-7])\b/i,
];
const EXPLICIT_PATTERNS: RegExp[] = [
  /\b(nude|naked|nsfw|porn|pornographic|explicit|topless|genitals|erotic|hentai|xxx|fetish)\b/i,
  /\b(sex|sexual|sexually|orgasm|masturbat\w*)\b/i,
];
const HALF_PATTERNS: RegExp[] = [
  /\b(marvel|disney|pixar|nintendo|pokemon|pok[eé]mon|dc comics|batman|superman|spider-?man|mickey mouse|star wars|harry potter)\b/i,
];

// Harmless phrases that contain trigger words (colours, young animals, idioms).
// They are removed before the minors check so they don't cause false alarms.
const SAFE_PHRASES: RegExp[] = [
  /\bbaby[\s-]*(blue|blues|pink|powder|yellow|green|purple|teal|bump)\b/gi,
  /\bbaby[\s-]*(dragon|wyrm|wolf|bat|raven|crow|snake|serpent|fox|cat|tiger|lion|bear|owl|griffin|gryphon|phoenix|spider|shark|whale|elephant|deer|goat|bird)s?\b/gi,
  /\bkid[\s-]*gloves?\b/gi,
  /\bchild[\s-]*of[\s-]*the[\s-]*(night|moon|stars|void|shadows?|dark|darkness|forest|sea|sun|storm)\b/gi,
];
function stripSafe(text: string): string {
  return SAFE_PHRASES.reduce((t, r) => t.replace(r, " "), text);
}

type Verdict = { ok: true } | { ok: false; reason: string; strikes: number; lock: boolean; message: string };

function moderate(text: string): Verdict {
  const cleaned = stripSafe(text);
  if (MINOR_PATTERNS.some((r) => r.test(cleaned))) {
    return { ok: false, reason: "minors", strikes: LOCK_AT, lock: true,
      message: "This request involves minors, which is not allowed. Your account has been locked and will be reviewed." };
  }
  if (EXPLICIT_PATTERNS.some((r) => r.test(text))) {
    return { ok: false, reason: "explicit", strikes: LOCK_AT, lock: true,
      message: "Explicit content isn't allowed in Eidolon. Your account has been locked and will be reviewed." };
  }
  if (HALF_PATTERNS.some((r) => r.test(text))) {
    return { ok: false, reason: "brands", strikes: 0.5, lock: false,
      message: "This request was blocked: trademarked characters and brands aren't supported. Please adjust your prompt." };
  }
  return { ok: true };
}
// -----------------------------------------------------------------------------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const tripoKey = Deno.env.get("TRIPO_KEY");
  if (!tripoKey) return json({ error: "3D studio is not configured yet (missing TRIPO_KEY)." }, 500);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(url, serviceKey);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Please sign in to create 3D models." }, 401);
  const user = userData.user;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  const tripoHeaders = { Authorization: `Bearer ${tripoKey}`, "Content-Type": "application/json" };

  // ---------------------------------------------------------------- status
  if (body.action === "status") {
    const taskId = String(body.task_id ?? "");
    if (!taskId) return json({ error: "Missing task id." }, 400);
    const { data: row } = await admin.from("generations").select("*")
      .eq("task_id", taskId).eq("user_id", user.id).eq("kind", "3d").maybeSingle();
    if (!row) return json({ error: "Task not found." }, 404);

    const r = await fetch(`${TRIPO}/${encodeURIComponent(taskId)}`, { headers: tripoHeaders });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.code) {
      console.error("tripo status error", r.status, JSON.stringify(j).slice(0, 400));
      return json({ error: "Could not check the 3D task. Please try again." }, 502);
    }
    const status = String(j?.data?.status ?? "unknown").toLowerCase();
    const progress = Number(j?.data?.progress ?? 0);

    if (status === "success") {
      const out = j?.data?.output ?? {};
      const modelUrl: string | undefined = out.pbr_model ?? out.model ?? out.base_model;
      if (row.status !== "done") {
        await admin.from("generations").update({ status: "done", result_url: modelUrl ?? null }).eq("id", row.id);
      }
      return json({ status: "success", progress: 100, model_url: modelUrl, preview_url: out.rendered_image ?? null });
    }
    if (["failed", "cancelled", "banned", "expired", "unknown"].includes(status)) {
      if (row.status !== "failed") {
        await admin.from("generations").update({ status: "failed" }).eq("id", row.id);
        if (row.used_bonus) { // give back a purchased model if the task failed
          const { data: p } = await admin.from("profiles").select("bonus_3d").eq("id", user.id).single();
          await admin.from("profiles").update({ bonus_3d: (p?.bonus_3d ?? 0) + 1 }).eq("id", user.id);
        }
      }
      return json({ status: "failed", progress, error: "The 3D engine could not build a model from this input. You have not been charged." });
    }
    return json({ status: "running", progress });
  }

  // ----------------------------------------------------------------- start
  if (body.action !== "start") return json({ error: "Unknown action." }, 400);

  await admin.from("profiles").upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const isOwner = profile?.is_owner === true;
  if (profile?.locked && !isOwner) return json({ error: "Your account is locked pending review. Please contact support." }, 403);

  const mode = body.mode === "prompt" ? "prompt" : "image";
  const prompt = String(body.prompt ?? "").trim().slice(0, 1000);
  const imageUrl = String(body.image_url ?? "").trim();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // Moderation on whatever text is involved (the image itself was already moderated when it was made).
  const verdict = isOwner ? ({ ok: true } as Verdict) : moderate(prompt);
  if (!verdict.ok) {
    const strikes = Math.max(Number(profile?.strikes ?? 0) + verdict.strikes, verdict.lock ? LOCK_AT : 0);
    const lock = verdict.lock || strikes >= LOCK_AT;
    await admin.from("profiles").update({ strikes, locked: lock, lock_reason: lock ? verdict.reason : profile?.lock_reason ?? null }).eq("id", user.id);
    await admin.from("generations").insert({ user_id: user.id, kind: "3d", prompt, blocked: true, block_reason: verdict.reason, status: "blocked", ip });
    return json({ error: lock && !verdict.lock ? "Your account has been locked after repeated violations and will be reviewed." : verdict.message }, 403);
  }

  // Image mode only accepts pictures this user made in Eidolon, so every image has already passed moderation.
  let file: { type: string; url: string } | undefined;
  if (mode === "image") {
    if (!/^https:\/\//i.test(imageUrl)) return json({ error: "Please choose an image you made in Eidolon." }, 400);
    const { data: own } = await admin.from("generations").select("id")
      .eq("user_id", user.id).eq("kind", "image").eq("blocked", false).eq("result_url", imageUrl).limit(1);
    if (!own || own.length === 0) {
      return json({ error: "For 3D, use an image you generated in Eidolon (open it from your History, or generate a new one)." }, 400);
    }
    const ext = new URL(imageUrl).pathname.toLowerCase().split(".").pop();
    file = { type: ext === "png" ? "png" : ext === "webp" ? "webp" : "jpg", url: imageUrl };
  } else if (!prompt) {
    return json({ error: "Please enter a prompt." }, 400);
  }

  // Allowance: monthly plan models first, then purchased bonus models.
  const allowance = PLAN_ALLOWANCE[String(profile?.plan ?? "Free")] ?? 0;
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const { count } = await admin.from("generations").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).eq("kind", "3d").eq("blocked", false).eq("used_bonus", false)
    .neq("status", "failed").gte("created_at", monthStart.toISOString());
  let usedBonus = false;
  if (!isOwner && (count ?? 0) >= allowance) {
    if ((profile?.bonus_3d ?? 0) > 0) usedBonus = true;
    else return json({ error: allowance > 0
      ? `You've used your ${allowance} 3D models for this month.`
      : "3D models are included with the Pro plan. Upgrade to create 3D models." }, 402);
  }

  const payload: Record<string, unknown> = file
    ? { type: "image_to_model", file }
    : { type: "text_to_model", prompt };
  payload.face_limit = body.polycount === "50k" ? 50000 : 18000;
  if (body.topology === "quad") payload.quad = true;

  const r = await fetch(TRIPO, { method: "POST", headers: tripoHeaders, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  const taskId: string | undefined = j?.data?.task_id;
  if (!r.ok || j?.code || !taskId) {
    console.error("tripo start error", r.status, JSON.stringify(j).slice(0, 500));
    return json({ error: "The 3D engine is unavailable right now. You have not been charged. Please try again soon." }, 502);
  }

  if (usedBonus) await admin.from("profiles").update({ bonus_3d: (profile!.bonus_3d as number) - 1 }).eq("id", user.id);
  await admin.from("generations").insert({
    user_id: user.id, kind: "3d", prompt: prompt || imageUrl, task_id: taskId, status: "running", used_bonus: usedBonus, ip,
  });
  return json({ task_id: taskId });
});
