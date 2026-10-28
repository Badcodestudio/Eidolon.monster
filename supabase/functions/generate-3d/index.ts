// Supabase Edge Function: generate-3d
// Two actions in one function:
//   { action: "start",  mode: "image" | "prompt", image_url?, prompt?, topology?, polycount?, quality?: "standard" | "high" }
//   { action: "status", task_id }
// Checks sign-in, account lock, plan allowance and moderation, then talks to
// Tripo3D with the studio's own key (secret TRIPO_KEY). The browser never sees it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Tripo API v3 (international). v2 shuts down Nov 1 2026.
const TRIPO = "https://openapi.tripo3d.ai/v3";
// model_version is REQUIRED on v3. This is the v2 default, so results and pricing stay the same.
const MODEL_VERSION = "v2.5-20250123";
const LOCK_AT = 2;

// Monthly 3D allowance comes from the plans table. Extra purchased models live in profiles.bonus_3d.

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

// Tier 4: gore words are NOT blocked (dark fantasy needs them). A matching prompt is allowed through and
// quietly noted for the owner to review in Admin. fal's own checker still screens the picture.
const GORE_PATTERNS: RegExp[] = [
  /\b(gore|gory|mutilat\w*|dismember\w*|disembowel\w*|eviscerat\w*|decapitat\w*|torture[sd]?|torturing|entrails)\b/i,
];
// Tier 5: real people / deepfakes (fal's policy forbids likenesses of real people) -> half strike.
// Starter list: add more names in Admin notes and here as you see them.
const REAL_PERSON_PATTERNS: RegExp[] = [
  /\b(deepfake|celebrity|celebrities|real person|real people|likeness of|lookalike of|photo of a real)\b/i,
  /\b(donald trump|joe biden|kamala harris|barack obama|vladimir putin|elon musk|taylor swift|kim kardashian|beyonc[eé]|kanye west|emma watson|scarlett johansson|keanu reeves|tom cruise|zendaya|ariana grande|selena gomez)\b/i,
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

type Verdict = { ok: true } | { ok: false; reason: string; strikes: number; lock: boolean; message: string; matched: string[] };

function hits(patterns: RegExp[], text: string): string[] {
  const out: string[] = [];
  for (const r of patterns) {
    const m = text.match(r);
    if (m && m[0]) out.push(m[0].trim());
  }
  return [...new Set(out)];
}

function moderate(text: string): Verdict {
  const cleaned = stripSafe(text);
  const minorHits = hits(MINOR_PATTERNS, cleaned);
  if (minorHits.length) {
    return { matched: minorHits, ok: false, reason: "minors", strikes: LOCK_AT, lock: true,
      message: "This request involves minors, which is not allowed. Your account has been locked and will be reviewed." };
  }
  const explicitHits = hits(EXPLICIT_PATTERNS, text);
  if (explicitHits.length) {
    return { matched: explicitHits, ok: false, reason: "explicit", strikes: LOCK_AT, lock: true,
      message: "Explicit content isn't allowed in Eidolon. Your account has been locked and will be reviewed." };
  }
  const brandHits = hits(HALF_PATTERNS, text);
  if (brandHits.length) {
    return { matched: brandHits, ok: false, reason: "brands", strikes: 0.5, lock: false,
      message: "This request was blocked: trademarked characters and brands aren't supported. Please adjust your prompt." };
  }
  const personHits = hits(REAL_PERSON_PATTERNS, text);
  if (personHits.length) {
    return { matched: personHits, ok: false, reason: "real_person", strikes: 0.5, lock: false,
      message: "This request was blocked: images of real people and celebrities aren't allowed. Please describe an original character instead." };
  }
  return { ok: true };
}
// Allowed through, but noted for the owner (shown in Admin -> Moderation as "note: gore").
// deno-lint-ignore no-explicit-any
async function noteGore(admin: any, userId: string, text: string, kind: string, ip: string | null) {
  const found = hits(GORE_PATTERNS, text);
  if (!found.length) return;
  await admin.from("generations").insert({
    user_id: userId, kind, prompt: text, blocked: true, block_reason: "note: gore (allowed through)", matched: found.join(", "), ip,
  });
}
// -----------------------------------------------------------------------------

// Copy a file into our own storage so the link never expires. Returns the permanent URL, or null if the copy fails.
// deno-lint-ignore no-explicit-any
async function keepCopy(admin: any, from: string, path: string, contentType: string): Promise<string | null> {
  try {
    const r = await fetch(from);
    if (!r.ok) throw new Error(`download ${r.status}`);
    const bytes = new Uint8Array(await r.arrayBuffer());
    const up = await admin.storage.from("creations").upload(path, bytes, { contentType, upsert: true });
    if (up.error) throw up.error;
    return admin.storage.from("creations").getPublicUrl(path).data.publicUrl as string;
  } catch (e) {
    console.error("storage copy failed", path, String(e));
    return null;
  }
}

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

    // Already finished and stored: no need to ask Tripo again.
    if (row.status === "done" && row.result_url) {
      return json({ status: "success", progress: 100, model_url: row.result_url, preview_url: row.preview_url ?? null });
    }

    const r = await fetch(`${TRIPO}/tasks/${encodeURIComponent(taskId)}`, { headers: tripoHeaders });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.code) {
      console.error("tripo status error", r.status, JSON.stringify(j).slice(0, 400));
      return json({ error: "Could not check the 3D task. Please try again." }, 502);
    }
    const status = String(j?.data?.status ?? "unknown").toLowerCase();
    const progress = Number(j?.data?.progress ?? 0);

    if (status === "success") {
      const out = j?.data?.output ?? {};
      const tripoModel: string | undefined = out.model_url;
      const tripoPreview: string | undefined = out.rendered_image_url;
      if (!tripoModel) return json({ status: "running", progress: 99 });
      // Keep permanent copies (Tripo links expire). If a copy fails we fall back to Tripo's link.
      const modelUrl = (await keepCopy(admin, tripoModel, `${user.id}/${taskId}.glb`, "model/gltf-binary")) ?? tripoModel;
      let previewUrl: string | null = tripoPreview ?? null;
      if (tripoPreview) previewUrl = (await keepCopy(admin, tripoPreview, `${user.id}/${taskId}.webp`, "image/webp")) ?? tripoPreview;
      await admin.from("generations").update({ status: "done", result_url: modelUrl, preview_url: previewUrl }).eq("id", row.id);
      return json({ status: "success", progress: 100, model_url: modelUrl, preview_url: previewUrl });
    }
    // v3 statuses: queued | running | success | failed | cancelled. A refused picture (2008) or a queue timeout (2018) now arrive as "failed".
    if (["failed", "cancelled", "unknown"].includes(status)) {
      console.error("tripo task failed", taskId, j?.data?.error_code, j?.data?.error_message);
      if (row.status !== "failed") {
        await admin.from("generations").update({ status: "failed" }).eq("id", row.id);
        if (row.used_bonus) { // give back purchased models if the task failed
          const { data: p } = await admin.from("profiles").select("bonus_3d").eq("id", user.id).single();
          await admin.from("profiles").update({ bonus_3d: (p?.bonus_3d ?? 0) + Number(row.cost ?? 1) }).eq("id", user.id);
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
    await admin.from("generations").insert({ user_id: user.id, kind: "3d", prompt, blocked: true, block_reason: verdict.reason, matched: verdict.matched.join(", "), status: "blocked", ip });
    return json({ error: lock && !verdict.lock ? "Your account has been locked after repeated violations and will be reviewed." : verdict.message }, 403);
  }

  if (!isOwner && prompt) await noteGore(admin, user.id, prompt, "3d", ip);

  // Image mode only accepts pictures this user made in Eidolon, so every image has already passed moderation.
  let file: { type: string; url: string } | undefined;
  if (mode === "image") {
    if (!/^https:\/\//i.test(imageUrl)) return json({ error: "Please choose an image you made in Eidolon." }, 400);
    // Own picture = a recorded generation of this user, OR a file sitting in this user's own folder of our storage
    // (only the server ever writes there, after moderation), so a missed history row can't block a real picture.
    const { data: own } = await admin.from("generations").select("id")
      .eq("user_id", user.id).eq("kind", "image").eq("blocked", false).eq("result_url", imageUrl).limit(1);
    const ownFolder = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/creations/${user.id}/`;
    const inOwnFolder = imageUrl.startsWith(ownFolder) && !imageUrl.includes("..");
    if ((!own || own.length === 0) && !inOwnFolder) {
      return json({ error: "For 3D, use an image you generated in Eidolon (open it from your History, or generate a new one)." }, 400);
    }
    const ext = new URL(imageUrl).pathname.toLowerCase().split(".").pop();
    file = { type: ext === "png" ? "png" : ext === "webp" ? "webp" : "jpg", url: imageUrl };
  } else if (!prompt) {
    return json({ error: "Please enter a prompt." }, 400);
  }

  const quality: "standard" | "high" = body.quality === "high" ? "high" : "standard";
  const cost = quality === "high" ? 2 : 1; // a High-detail model uses 2 of the monthly 3D credits

  // Allowance: monthly plan credits first, then purchased bonus credits.
  const { data: planRow } = await admin.from("plans").select("models3d_per_month").eq("name", profile?.plan ?? "Free").maybeSingle();
  const allowance = Number(planRow?.models3d_per_month ?? 0);
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const { data: usedRows } = await admin.from("generations").select("cost")
    .eq("user_id", user.id).eq("kind", "3d").eq("blocked", false).eq("used_bonus", false)
    .neq("status", "failed").gte("created_at", monthStart.toISOString());
  const usedUnits = (usedRows ?? []).reduce((n: number, r: { cost: number | null }) => n + Number(r.cost ?? 1), 0);
  let usedBonus = false;
  if (!isOwner && usedUnits + cost > allowance) {
    if (Number(profile?.bonus_3d ?? 0) >= cost) usedBonus = true;
    else return json({ error: allowance > 0
      ? (quality === "high" && usedUnits < allowance
          ? "You don't have enough 3D credits left for a High-detail model (it uses 2). Try Standard detail."
          : `You've used your ${allowance} 3D credits for this month.`)
      : "Free accounts can browse the gallery. Choose a plan to create 3D models." }, 402);
  }

  const payload: Record<string, unknown> = file
    ? { file, model_version: MODEL_VERSION }
    : { prompt, model_version: MODEL_VERSION };
  const tier = parseInt(String(body.polycount ?? ""), 10); // "20k (Mobile)", "50k (Console)", "120k (Cinematic)"
  payload.face_limit = tier === 120 ? 120000 : tier === 50 ? 50000 : tier === 20 ? 20000 : 18000;
  if (body.topology === "quad") payload.quad = true;
  if (quality === "high") { payload.texture_quality = "detailed"; payload.geometry_quality = "detailed"; }

  // 1) Record the job FIRST, so a model is never started (and paid for) without a record of it.
  const { data: made, error: recErr } = await admin.from("generations").insert({
    user_id: user.id, kind: "3d", prompt: prompt || imageUrl, status: "pending",
    used_bonus: usedBonus, ip, quality, cost,
  }).select("id").single();
  if (recErr || !made) {
    console.error("could not record 3d job (nothing was started)", recErr?.message);
    return json({ error: "Something went wrong saving your request. Nothing was started and you have not been charged. Please try again." +
      (isOwner ? ` [DB: ${recErr?.message}]` : "") }, 500);
  }

  // 2) Start the Tripo job.
  const startUrl = `${TRIPO}/generation/${file ? "image-to-model" : "text-to-model"}`;
  const r = await fetch(startUrl, { method: "POST", headers: tripoHeaders, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  const taskId: string | undefined = j?.data?.task_id;
  if (!r.ok || j?.code || !taskId) {
    console.error("tripo start error", r.status, JSON.stringify(j).slice(0, 500));
    await admin.from("generations").delete().eq("id", made.id);
    // The owner sees Tripo's real answer so problems can be fixed fast; customers get the friendly message.
    const detail = isOwner ? ` [Tripo ${r.status}: ${JSON.stringify(j).slice(0, 300)}]` : "";
    return json({ error: "The 3D engine is unavailable right now. You have not been charged. Please try again soon." + detail }, 502);
  }

  // 3) Attach the Tripo task id (retry once; if it still fails, log it loudly).
  let upd = await admin.from("generations").update({ task_id: taskId, status: "running" }).eq("id", made.id);
  if (upd.error) upd = await admin.from("generations").update({ task_id: taskId, status: "running" }).eq("id", made.id);
  if (upd.error) {
    console.error("LOST TASK: tripo started but could not save task id", taskId, upd.error.message);
    return json({ error: "Your model started but we couldn't track it. Please contact support with this code: " + taskId }, 500);
  }

  if (usedBonus) await admin.from("profiles").update({ bonus_3d: Number(profile!.bonus_3d) - cost }).eq("id", user.id);
  return json({ task_id: taskId, quality, cost });
});
