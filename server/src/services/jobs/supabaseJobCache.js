const DEFAULT_CACHE_TTL_MINUTES = 360;

export function buildJobCacheKey({ provider = "auto", role = "", location = "" }) {
  return [
    normalizeCachePart(provider),
    normalizeCachePart(role),
    normalizeCachePart(location),
  ].join("|");
}

export function createSupabaseJobCache({
  env = process.env,
  now = () => new Date(),
  fetchImpl = fetch,
} = {}) {
  const config = readJobCacheConfig(env);

  async function get(searchContext) {
    const cacheKey = buildJobCacheKey({
      provider: config.provider,
      role: searchContext.role,
      location: searchContext.location,
    });

    if (!config.configured) {
      return {
        hit: false,
        cacheKey,
        reason: config.reason,
      };
    }

    try {
      const url = tableUrl(config.url, {
        cache_key: `eq.${cacheKey}`,
        expires_at: `gt.${now().toISOString()}`,
        select: "cache_key,expires_at,payload",
        limit: "1",
      });
      const response = await fetchImpl(url, {
        method: "GET",
        headers: buildHeaders(config.serviceRoleKey),
      });
      const body = await parseJsonResponse(response);

      if (!response.ok) {
        return {
          hit: false,
          cacheKey,
          reason: body?.message || `Supabase cache read failed with ${response.status}.`,
        };
      }

      const row = Array.isArray(body) ? body[0] : null;
      if (!row?.payload) {
        return {
          hit: false,
          cacheKey,
        };
      }

      return {
        hit: true,
        cacheKey: row.cache_key || cacheKey,
        expiresAt: row.expires_at || "",
        result: row.payload,
      };
    } catch (error) {
      return {
        hit: false,
        cacheKey,
        reason: error.message,
      };
    }
  }

  async function set(searchContext, providerResult) {
    const cacheKey = buildJobCacheKey({
      provider: config.provider,
      role: searchContext.role,
      location: searchContext.location,
    });

    if (!config.configured) {
      return {
        ok: false,
        cacheKey,
        reason: config.reason,
      };
    }

    const expiresAt = new Date(now().getTime() + config.ttlMinutes * 60 * 1000).toISOString();
    const record = {
      cache_key: cacheKey,
      provider: config.provider,
      role: searchContext.role,
      location: searchContext.location,
      payload: providerResult,
      expires_at: expiresAt,
    };

    try {
      const response = await fetchImpl(tableUrl(config.url, { on_conflict: "cache_key" }), {
        method: "POST",
        headers: buildHeaders(config.serviceRoleKey, {
          Prefer: "resolution=merge-duplicates,return=representation",
        }),
        body: JSON.stringify(record),
      });
      const body = await parseJsonResponse(response);

      if (!response.ok) {
        return {
          ok: false,
          cacheKey,
          reason: body?.message || `Supabase cache write failed with ${response.status}.`,
        };
      }

      const row = Array.isArray(body) ? body[0] : body;
      return {
        ok: true,
        cacheKey: row?.cache_key || cacheKey,
        expiresAt: row?.expires_at || expiresAt,
      };
    } catch (error) {
      return {
        ok: false,
        cacheKey,
        reason: error.message,
      };
    }
  }

  return {
    configured: config.configured,
    reason: config.reason,
    get,
    set,
  };
}

function readJobCacheConfig(env) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || "";
  const provider = env.JOB_PROVIDER || "auto";
  const ttlMinutes = Number.parseInt(env.JOB_CACHE_TTL_MINUTES || "", 10) || DEFAULT_CACHE_TTL_MINUTES;
  const enabled = String(env.JOB_CACHE_ENABLED ?? "true").toLowerCase() !== "false";

  if (!enabled) {
    return {
      configured: false,
      reason: "Supabase job cache is disabled.",
      provider,
      ttlMinutes,
    };
  }

  if (!url || !serviceRoleKey) {
    return {
      configured: false,
      reason: "Supabase job cache is not configured.",
      provider,
      ttlMinutes,
    };
  }

  return {
    configured: true,
    reason: "",
    url,
    serviceRoleKey,
    provider,
    ttlMinutes,
  };
}

function tableUrl(baseUrl, params = {}) {
  const url = new URL("/rest/v1/job_search_cache", baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function buildHeaders(serviceRoleKey, extraHeaders = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
}

async function parseJsonResponse(response) {
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function normalizeCachePart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
