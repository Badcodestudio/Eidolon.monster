// Supabase Edge Function: stripe-webhook
// Stripe calls this when someone pays, renews, fails or cancels. It sets the account's plan to match.
// IMPORTANT: deploy this one with "Verify JWT" turned OFF (Stripe does not send a sign-in token).
// It protects itself by checking Stripe's signature using the secret STRIPE_WEBHOOK_SECRET.
// Secrets needed: STRIPE_WEBHOOK_SECRET (starts whsec_), STRIPE_SECRET_KEY (a restricted key that can read Checkout Sessions).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const text = (body: string, status = 200) => new Response(body, { status });

// ---- Verify the signature Stripe puts in the "stripe-signature" header --------------
async function verify(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts["t"];
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // older than 5 minutes: refuse
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => s.length === expected.length && s.split("").reduce((d, c, i) => d | (c.charCodeAt(0) ^ expected.charCodeAt(i)), 0) === 0);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return text("Method not allowed", 405);

  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secret) return text("Webhook secret is not set", 500);

  const payload = await req.text();
  const header = req.headers.get("stripe-signature") ?? "";
  if (!(await verify(payload, header, secret))) return text("Bad signature", 400);

  // deno-lint-ignore no-explicit-any
  let event: any;
  try { event = JSON.parse(payload); } catch { return text("Bad body", 400); }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Already handled this event? Say OK and stop.
  const seen = await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  if (seen.error) {
    if (String(seen.error.code) === "23505") return text("Already handled");
    console.error("could not record event", seen.error.message);
    return text("Database problem", 500);
  }

  async function planForPrice(priceId: string | undefined): Promise<string | null> {
    if (!priceId) return null;
    const { data } = await admin.from("plans").select("name").eq("stripe_price_id", priceId).maybeSingle();
    return data?.name ?? null;
  }
  async function setPlan(where: { id?: string; customer?: string }, fields: Record<string, unknown>) {
    let q = admin.from("profiles").update(fields).eq("is_owner", false); // never change the owner's account
    if (where.id) q = q.eq("id", where.id); else if (where.customer) q = q.eq("stripe_customer_id", where.customer); else return;
    const { error } = await q;
    if (error) console.error("could not update profile", error.message);
  }

  try {
    const obj = event.data?.object ?? {};

    if (event.type === "checkout.session.completed") {
      if (obj.mode === "subscription" && obj.payment_status !== "unpaid") {
        const userId: string | undefined = obj.client_reference_id ?? undefined;
        if (!userId) { console.error("checkout without client_reference_id", obj.id); return text("ok"); }
        if (!stripeKey) { console.error("STRIPE_SECRET_KEY missing"); return text("Server not configured", 500); }
        const li = await fetch(`https://api.stripe.com/v1/checkout/sessions/${obj.id}/line_items`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        const items = await li.json();
        const plan = await planForPrice(items?.data?.[0]?.price?.id);
        if (!plan) { console.error("no plan matches this price", items?.data?.[0]?.price?.id); return text("ok"); }
        await setPlan({ id: userId }, { plan, stripe_customer_id: obj.customer ?? null, stripe_subscription_id: obj.subscription ?? null });
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const status: string = obj.status;
      if (["canceled", "unpaid", "incomplete_expired"].includes(status)) {
        await setPlan({ customer: obj.customer }, { plan: "Free" });
      } else if (["active", "trialing"].includes(status)) {
        const plan = await planForPrice(obj.items?.data?.[0]?.price?.id);
        if (plan) await setPlan({ customer: obj.customer }, { plan, stripe_subscription_id: obj.id });
      }
      // past_due: Stripe is still retrying the card; keep access for now.
    } else if (event.type === "customer.subscription.deleted") {
      await setPlan({ customer: obj.customer }, { plan: "Free", stripe_subscription_id: null });
    }
  } catch (e) {
    console.error("webhook handler error", event.type, String(e));
    await admin.from("stripe_events").delete().eq("id", event.id); // let Stripe retry
    return text("Handler error", 500);
  }
  return text("ok");
});
