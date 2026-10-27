
// Supabase Edge Function: generate-image
// Checks sign-in, account lock, daily limit and moderation, then calls fal.ai
// with the studio's own key (secret FAL_KEY). The browser never sees the key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Safety net against abuse, on top of the monthly plan limit.
const DAILY_LIMIT = Number(Deno.env.get("DAILY_IMAGE_LIMIT") ?? "150");
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

// Tier 4: gore words are NOT blocked (dark fantasy needs them). A matching prompt is allowed through and
// quietly noted for the owner to review in Admin. fal's own checker still screens the picture.
const GORE_PATTERNS: RegExp[] = [
  /\b(gore|gory|mutilat\w*|dismember\w*|disembowel\w*|eviscerat\w*|decapitat\w*|torture[sd]?|torturing|entrails)\b/i,
];
// Tier 5: real people / deepfakes (fal's policy forbids likenesses of real people) -> half strike.
// Starter list: add more names in Admin notes and here as you see them.
const REAL_PERSON_PATTERNS: RegExp[] = [
  /\b(deepfake|celebrity|celebrities|real person|real people|likeness of|lookalike of|photo of a real)\b/i,
  /\b(donald trump|joe biden|kamala harris|barack obama|vladimir putin|elon musk|taylor swift|kim kardashian|beyonc[e\u00e9]|kanye west|emma watson|scarlett johansson|keanu reeves|tom cruise|zendaya|ariana grande|selena gomez)\b/i,
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
    return {
      matched: minorHits,
      ok: false, reason: "minors", strikes: LOCK_AT, lock: true,
      message: "This request involves minors, which is not allowed. Your account has been locked and will be reviewed.",
    };
  }
  const explicitHits = hits(EXPLICIT_PATTERNS, text);
  if (explicitHits.length) {
    return {
      matched: explicitHits,
      ok: false, reason: "explicit", strikes: LOCK_AT, lock: true,
      message: "Explicit content isn't allowed in Eidolon. Your account has been locked and will be reviewed.",
    };
  }
  const brandHits = hits(HALF_PATTERNS, text);
  if (brandHits.length) {
    return {
      matched: brandHits,
      ok: false, reason: "brands", strikes: 0.5, lock: false,
      message: "This request was blocked: trademarked characters and brands aren't supported. Please adjust your prompt.",
    };
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
  let body: { prompt?: string; image_size?: string; quality?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  const prompt = (body.prompt ?? "").toString().trim();
  if (!prompt) return json({ error: "Please enter a prompt." }, 400);
  if (prompt.length > 2000) return json({ error: "Prompt is too long." }, 400);
  const allowedSizes = ["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"];
  const imageSize = allowedSizes.includes(body.image_size ?? "") ? body.image_size! : "portrait_4_3";
  const quality: "standard" | "high" = body.quality === "high" ? "high" : "standard";
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
      user_id: user.id, prompt, blocked: true, block_reason: verdict.reason, matched: verdict.matched.join(", "), ip,
    });
    const msg = lock && !verdict.lock
      ? "Your account has been locked after repeated violations and will be reviewed."
      : verdict.message;
    return json({ error: msg }, 403);
  }

  if (!isOwner) await noteGore(admin, user.id, prompt, "image", ip);

  // 5. Plan limits (from the plans table) and abuse guard.
  //    Standard and High-quality images each have their own monthly allowance.
  const { data: planRow } = await admin.from("plans").select("*").eq("name", profile?.plan ?? "Free").maybeSingle();
  const standardLimit = Number(planRow?.images_per_month ?? 0);
  const highLimit = Number(planRow?.images_high_per_month ?? 0);
  const monthlyLimit = quality === "high" ? highLimit : standardLimit;
  if (!isOwner && standardLimit <= 0 && highLimit <= 0) {
    return json({ error: "Free accounts can browse the gallery. Choose a plan to generate images." }, 402);
  }
  if (!isOwner && monthlyLimit <= 0) {
    return json({ error: quality === "high"
      ? "High quality isn't included in your plan. Choose Standard, or upgrade your plan."
      : "Standard images aren't included in your plan." }, 402);
  }
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const { count: monthCount } = await admin.from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id).eq("blocked", false).eq("kind", "image").eq("quality", quality)
    .gte("created_at", monthStart.toISOString());
  if (!isOwner && (monthCount ?? 0) >= monthlyLimit) {
    return json({ error: `You've used all ${monthlyLimit} ${quality === "high" ? "High-quality" : "Standard"} images in your plan this month.` }, 429);
  }
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin.from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id).eq("blocked", false).eq("kind", "image").gte("created_at", since);
  if (!isOwner && (count ?? 0) >= DAILY_LIMIT) {
    return json({ error: "You're generating very quickly. Please try again later." }, 429);
  }

  // 6. Generate with fal.ai (safety checker always ON). The server quietly adds "adult, original character design"
  //    to every prompt: it keeps people adult and nudges the model away from copying famous characters.
  //    Standard = FLUX schnell, High = Z Image Turbo.
  const endpoint = quality === "high" ? "fal-ai/z-image/turbo" : "fal-ai/flux/schnell";
  const falRes = await fetch(`https://fal.run/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `adult, original character design, ${prompt}`, image_size: imageSize, num_images: 1, enable_safety_checker: true, output_format: "jpeg",
    }),
  });
  const result = await falRes.json().catch(() => ({}));
  if (!falRes.ok) {
    console.error("fal.ai error", endpoint, falRes.status, JSON.stringify(result).slice(0, 500));
    return json({ error: "The image engine had a problem. Please try again in a moment." }, 502);
  }
  const falUrl: string | undefined = result?.images?.[0]?.url;
  if (!falUrl || result?.has_nsfw_concepts?.[0] === true) {
    await admin.from("generations").insert({
      user_id: user.id, prompt, blocked: true, block_reason: "engine_safety", ip,
    });
    // A small strike: one false alarm never matters, but repeatedly pushing at the engine's checker does.
    if (!isOwner) {
      const strikes = Number(profile?.strikes ?? 0) + 0.25;
      await admin.from("profiles").update({
        strikes, locked: strikes >= LOCK_AT, lock_reason: strikes >= LOCK_AT ? "engine_safety" : profile?.lock_reason ?? null,
      }).eq("id", user.id);
    }
    return json({ error: "The image engine declined this prompt. Please change it and try again." }, 422);
  }

  // 7. Keep a permanent copy in our own storage (fal links can expire). Falls back to the fal link if the copy fails.
  let imageUrl = falUrl;
  try {
    const img = await fetch(falUrl);
    if (!img.ok) throw new Error(`download ${img.status}`);
    const bytes = new Uint8Array(await img.arrayBuffer());
    const type = img.headers.get("content-type") ?? "image/jpeg";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const up = await admin.storage.from("creations").upload(path, bytes, { contentType: type, upsert: false });
    if (up.error) throw up.error;
    imageUrl = admin.storage.from("creations").getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.error("storage copy failed (using fal link)", String(e));
  }

  const { error: saveErr } = await admin.from("generations").insert({
    user_id: user.id, prompt, result_url: imageUrl, ip, quality,
  });
  if (saveErr) console.error("could not record generation", saveErr.message);
  return json({ url: imageUrl, quality });
});
