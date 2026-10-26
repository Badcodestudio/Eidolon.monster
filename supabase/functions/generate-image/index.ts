// Supabase Edge Function: generate-image
// Checks sign-in, account lock, daily limit and moderation, then calls fal.ai
// with the studio's own key (secret FAL_KEY). The browser never sees the key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DAILY_LIMIT = Number(Deno.env.get("DAILY_IMAGE_LIMIT") ?? "30");
const LOCK_AT = 2; // strikes at which an account is locked

// ---- Moderation (draft rules: review and edit these lists) ----------------
// Tier 1: anything involving minors -> immediate lock.
const MINOR_PATTERNS: RegExp[] = [
  /\b(child|children|kid|kids|minor|minors|underage|under-age|toddler|baby|infant|preteen|pre-teen|tween)\b/i,
  /\b(teen|teens|teenage|teenager|teenaged)\b/i,
  /\b(loli|lolita|shota|schoolgirl|schoolboy|school girl|school boy)\b/i,
  /\b(young girl|young boy|little girl|little boy)\b/i,
  /\b([0-9]|1[0-7])[\s-]*(year|yr)s?[\s-]*old\b/i,
  /\bage[d]?\s*([0-9]|1[0-7])\b/i,
];
// Tier 2: explicit sexual content / nudity -> immediate lock.
const EXPLICIT_PATTERNS: RegExp[] = [
  /\b(nude|naked|nsfw|porn|pornographic|explicit|topless|genitals|erotic|hentai|xxx|fetish)\b/i,
  /\b(sex|sexual|sexually|orgasm|masturbat\w*)\b/i,
];
// Tier 3: trademarked characters / brands -> half strike.
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

function moderate(prompt: string): Verdict {
  const cleaned = stripSafe(prompt);
  if (MINOR_PATTERNS.some((r) => r.test(cleaned))) {
    return {
      ok: false, reason: "minors", strikes: LOCK_AT, lock: true,
      message: "This request involves minors, which is not allowed. Your account has been locked and will be reviewed.",
    };
  }
  if (EXPLICIT_PATTERNS.some((r) => r.test(prompt))) {
    return {
      ok: false, reason: "explicit", strikes: LOCK_AT, lock: true,
      message: "Explicit content isn't allowed in Eidolon. Your account has been locked and will be reviewed.",
    };
  }
  if (HALF_PATTERNS.some((r) => r.test(prompt))) {
    return {
      ok: false, reason: "brands", strikes: 0.5, lock: false,
      message: "This request was blocked: trademarked characters and brands aren't supported. Please adjust your prompt.",
    };
  }
  return { ok: true };
}
// ---------------------------------------------------------------------------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const falKey = Deno.env.get("FAL_KEY");
  if (!falKey) return json({ error: "Studio is not configured yet (missing FAL_KEY)." }, 500);

  // 1. Who is calling? (Real, verified sign-in)
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(url, serviceKey);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Please sign in to generate images." }, 401);
  const user = userData.user;

  // 2. Input
  let body: { prompt?: string; image_size?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  const prompt = (body.prompt ?? "").toString().trim();
  if (!prompt) return json({ error: "Please enter a prompt." }, 400);
  if (prompt.length > 2000) return json({ error: "Prompt is too long." }, 400);
  const allowedSizes = ["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"];
  const imageSize = allowedSizes.includes(body.image_size ?? "") ? body.image_size! : "portrait_4_3";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // 3. Account state
  await admin.from("profiles").upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const isOwner = profile?.is_owner === true;
  if (profile?.locked && !isOwner) {
    return json({ error: "Your account is locked pending review. Please contact support." }, 403);
  }

  // 4. Moderation
  const verdict = isOwner ? ({ ok: true } as Verdict) : moderate(prompt);
  if (!verdict.ok) {
    const strikes = Math.max(Number(profile?.strikes ?? 0) + verdict.strikes, verdict.lock ? LOCK_AT : 0);
    const lock = verdict.lock || strikes >= LOCK_AT;
    await admin.from("profiles").update({
      strikes, locked: lock, lock_reason: lock ? verdict.reason : profile?.lock_reason ?? null,
    }).eq("id", user.id);
    await admin.from("generations").insert({
      user_id: user.id, prompt, blocked: true, block_reason: verdict.reason, ip,
    });
    const msg = lock && !verdict.lock
      ? "Your account has been locked after repeated violations and will be reviewed."
      : verdict.message;
    return json({ error: msg }, 403);
  }

  // 5. Daily limit
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin.from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id).eq("blocked", false).eq("kind", "image").gte("created_at", since);
  if (!isOwner && (count ?? 0) >= DAILY_LIMIT) {
    return json({ error: `Daily limit of ${DAILY_LIMIT} images reached. Please come back tomorrow.` }, 429);
  }

  // 6. Generate (fal.ai FLUX schnell, safety checker ON)
  const falRes = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt, image_size: imageSize, num_images: 1, enable_safety_checker: true,
    }),
  });
  const result = await falRes.json().catch(() => ({}));
  if (!falRes.ok) {
    console.error("fal.ai error", falRes.status, JSON.stringify(result).slice(0, 500));
    return json({ error: "The image engine had a problem. Please try again in a moment." }, 502);
  }
  const imageUrl: string | undefined = result?.images?.[0]?.url;
  if (!imageUrl || result?.has_nsfw_concepts?.[0] === true) {
    await admin.from("generations").insert({
      user_id: user.id, prompt, blocked: true, block_reason: "engine_safety", ip,
    });
    return json({ error: "The image engine declined this prompt. Please change it and try again." }, 422);
  }

  await admin.from("generations").insert({
    user_id: user.id, prompt, result_url: imageUrl, ip,
  });
  return json({ url: imageUrl });
});
