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

/**
 * Gates job posting, which is reachable two ways: an active 'professional'
 * subscription (unlimited posts) OR a single pay-per-post credit (RM50).
 * Attaches request.entitlement so the route can consume a credit after the
 * post is created. Returns 402 when the employer has neither.
 */
export async function requireJobPostEntitlement(request, response, next) {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const userId = request.user.id;
  const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };

  try {
    // 1. Unlimited posting via an active subscription.
    const subUrl = new URL("/rest/v1/employer_subscriptions", url);
    subUrl.searchParams.set("user_id", `eq.${userId}`);
    subUrl.searchParams.set("select", "status,expires_at");
    const subRes = await fetchImpl(subUrl.toString(), { headers });
    if (!subRes.ok) {
      throw new Error(`Supabase error: ${subRes.status}`);
    }
    const subRows = await subRes.json();
    const subscription = Array.isArray(subRows) ? subRows[0] : subRows;
    if (isActiveSubscription(subscription)) {
      request.entitlement = { type: "subscription" };
      return next();
    }

    // 2. A single available pay-per-post credit.
    const creditUrl = new URL("/rest/v1/employer_job_post_credits", url);
    creditUrl.searchParams.set("user_id", `eq.${userId}`);
    creditUrl.searchParams.set("status", "eq.available");
    creditUrl.searchParams.set("select", "id");
    creditUrl.searchParams.set("order", "created_at.asc");
    creditUrl.searchParams.set("limit", "1");
    const creditRes = await fetchImpl(creditUrl.toString(), { headers });
    if (!creditRes.ok) {
      throw new Error(`Supabase error: ${creditRes.status}`);
    }
    const creditRows = await creditRes.json();
    const credit = Array.isArray(creditRows) ? creditRows[0] : creditRows;
    if (credit?.id) {
      request.entitlement = { type: "credit", creditId: credit.id };
      return next();
    }

    return response.status(402).json({
      error: "Posting a job requires an active subscription or a job-post credit.",
      code: "job_post_entitlement_required",
    });
  } catch (error) {
    console.error("Job post entitlement check failed:", error);
    return response.status(502).json({ error: "Failed to verify job-post entitlement" });
  }
}

/**
 * Marks a pay-per-post credit as consumed and links it to the created job.
 * Best-effort: a failure here is logged but does not fail the request, since
 * the job has already been created.
 */
export async function consumeJobPostCredit(request, creditId, jobPostId) {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  try {
    const fetchUrl = new URL("/rest/v1/employer_job_post_credits", url);
    fetchUrl.searchParams.set("id", `eq.${creditId}`);
    fetchUrl.searchParams.set("status", "eq.available");

    await fetchImpl(fetchUrl.toString(), {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "consumed",
        job_post_id: jobPostId,
        consumed_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Failed to consume job-post credit:", error);
  }
}
