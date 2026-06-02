/**
 * Gates employer premium features behind an active subscription.
 * Reads request.supabase (service-role context) + request.user, set by the
 * auth middleware chain in app.js. Returns 402 when no active subscription.
 */
export async function requireActiveSubscription(request, response, next) {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const userId = request.user.id;

  try {
    const fetchUrl = new URL("/rest/v1/employer_subscriptions", url);
    fetchUrl.searchParams.set("user_id", `eq.${userId}`);
    fetchUrl.searchParams.set("select", "status,expires_at");

    const res = await fetchImpl(fetchUrl.toString(), {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });

    if (!res.ok) {
      throw new Error(`Supabase error: ${res.status}`);
    }

    const rows = await res.json();
    const subscription = Array.isArray(rows) ? rows[0] : rows;
    const active = isActiveSubscription(subscription);

    if (!active) {
      return response.status(402).json({
        error: "An active employer subscription is required to use this feature.",
        code: "subscription_required",
      });
    }

    request.subscription = subscription;
    next();
  } catch (error) {
    console.error("Subscription check failed:", error);
    return response.status(502).json({ error: "Failed to verify subscription" });
  }
}

export function isActiveSubscription(subscription) {
  if (!subscription || subscription.status !== "active") {
    return false;
  }
  if (!subscription.expires_at) {
    return true;
  }
  return new Date(subscription.expires_at).getTime() > Date.now();
}
