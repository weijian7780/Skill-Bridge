import { Router } from "express";
import { isActiveSubscription } from "../../middleware/subscription.js";

export const subscriptionRouter = Router();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function serviceHeaders(serviceRoleKey, extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

subscriptionRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const userId = request.user.id;

  try {
    const fetchUrl = new URL("/rest/v1/employer_subscriptions", url);
    fetchUrl.searchParams.set("user_id", `eq.${userId}`);
    fetchUrl.searchParams.set("select", "*");

    const res = await fetchImpl(fetchUrl.toString(), { headers: serviceHeaders(serviceRoleKey) });
    if (!res.ok) {
      throw new Error(`Supabase error: ${res.status}`);
    }

    const rows = await res.json();
    const subscription = Array.isArray(rows) ? rows[0] ?? null : rows;
    response.json({ ok: true, subscription, active: isActiveSubscription(subscription) });
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    response.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// Mock checkout. A real implementation would create the subscription only after
// a successful payment via Stripe/Billplz; here we activate it directly.
subscriptionRouter.post("/activate", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const userId = request.user.id;
  const plan = request.body?.plan || "professional";
  const now = new Date();

  const payload = {
    user_id: userId,
    plan,
    status: "active",
    started_at: now.toISOString(),
    expires_at: new Date(now.getTime() + THIRTY_DAYS_MS).toISOString(),
  };

  try {
    const fetchUrl = new URL("/rest/v1/employer_subscriptions", url);
    fetchUrl.searchParams.set("on_conflict", "user_id");

    const res = await fetchImpl(fetchUrl.toString(), {
      method: "POST",
      headers: serviceHeaders(serviceRoleKey, { Prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Supabase error: ${res.status} ${errorBody}`);
    }

    const data = await res.json();
    const subscription = Array.isArray(data) ? data[0] : data;
    response.status(201).json({ ok: true, subscription, active: true });
  } catch (error) {
    console.error("Failed to activate subscription:", error);
    response.status(500).json({ error: "Failed to activate subscription" });
  }
});

subscriptionRouter.post("/cancel", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const userId = request.user.id;

  try {
    const fetchUrl = new URL("/rest/v1/employer_subscriptions", url);
    fetchUrl.searchParams.set("user_id", `eq.${userId}`);

    const res = await fetchImpl(fetchUrl.toString(), {
      method: "PATCH",
      headers: serviceHeaders(serviceRoleKey, { Prefer: "return=representation" }),
      body: JSON.stringify({ status: "cancelled" }),
    });

    if (!res.ok) {
      throw new Error(`Supabase error: ${res.status}`);
    }

    response.json({ ok: true, active: false });
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    response.status(500).json({ error: "Failed to cancel subscription" });
  }
});
