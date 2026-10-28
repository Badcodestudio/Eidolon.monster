// Supabase Edge Function: save-crop
// Close Up / Half Body images are cropped in the browser. This stores that cropped copy and points the
// person's own generation record at it. The original render is kept in storage (never deleted).
// Full Body and Epic never call this function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BYTES = 6 * 1024 * 1024;

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
  const admin = createClient(url, serviceKey);

  // Who is calling?
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Please sign in." }, 401);
  const user = userData.user;

  let body: { original_url?: string; image_base64?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  const originalUrl = (body.original_url ?? "").toString();
  const b64 = (body.image_base64 ?? "").toString();
  if (!originalUrl || !b64) return json({ error: "Missing image." }, 400);

  // The original must be one of this person's own generations.
  const { data: row } = await admin.from("generations")
    .select("id")
    .eq("user_id", user.id).eq("result_url", originalUrl).eq("blocked", false)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!row) return json({ error: "Image not found." }, 404);

  let bytes: Uint8Array;
  try {
    const bin = atob(b64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch { return json({ error: "Bad image data." }, 400); }
  if (bytes.length < 1000 || bytes.length > MAX_BYTES) return json({ error: "Image size not accepted." }, 400);
  // JPEG files start with FF D8 FF.
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) return json({ error: "Only JPEG is accepted." }, 400);

  const path = `${user.id}/${crypto.randomUUID()}-crop.jpg`;
  const up = await admin.storage.from("creations").upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  if (up.error) {
    console.error("crop upload failed", up.error.message);
    return json({ error: "Could not save the cropped image." }, 500);
  }
  const newUrl = admin.storage.from("creations").getPublicUrl(path).data.publicUrl;

  const { error: updErr } = await admin.from("generations").update({ result_url: newUrl }).eq("id", row.id);
  if (updErr) {
    console.error("crop record update failed", updErr.message);
    return json({ error: "Could not update the record." }, 500);
  }
  return json({ url: newUrl });
});
