import { getSupabaseConfig } from "./supabaseConfig.js";

function buildHeaders({ publishableKey, accessToken, prefer }) {
  const headers = {
    apikey: publishableKey,
    "Content-Type": "application/json",
  };

  if (prefer) {
    headers.Prefer = prefer;
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (publishableKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${publishableKey}`;
  }

  return headers;
}

function tableUrl(baseUrl, table, searchParams = {}) {
  const url = new URL(`/rest/v1/${table}`, baseUrl);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

async function readResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function responseError(body, status) {
  const payload = body && typeof body === "object" && !Array.isArray(body)
    ? body
    : {};
  const message = payload.message
    ?? payload.msg
    ?? payload.error_description
    ?? (typeof body === "string" ? body : "")
    ?? "";

  return {
    ...payload,
    status,
    isAuthError: status === 401,
    message: message || `Supabase request failed with ${status}`,
  };
}

async function parseResponse(response) {
  const body = await readResponseBody(response);

  if (!response.ok) {
    return {
      data: null,
      error: responseError(body, response.status),
    };
  }

  return {
    data: Array.isArray(body) ? body[0] ?? null : body,
    error: null,
  };
}

export function createSupabaseRestClient({
  url,
  publishableKey,
  accessToken = "",
  fetchImpl = fetch,
}) {
  return {
    async upsert(table, record, { onConflict } = {}) {
      const response = await fetchImpl(tableUrl(url, table, { on_conflict: onConflict }), {
        method: "POST",
        headers: buildHeaders({
          publishableKey,
          accessToken,
          prefer: "resolution=merge-duplicates,return=representation",
        }),
        body: JSON.stringify(record),
      });

      return parseResponse(response);
    },

    async select(table, { eq = {} } = {}) {
      const filters = Object.fromEntries(
        Object.entries(eq).map(([key, value]) => [key, `eq.${value}`]),
      );

      const response = await fetchImpl(tableUrl(url, table, filters), {
        method: "GET",
        headers: buildHeaders({ publishableKey, accessToken }),
      });

      return parseResponse(response);
    },
  };
}

export function createSupabaseConnection({
  env = import.meta.env,
  accessToken = "",
  fetchImpl = fetch,
} = {}) {
  const config = getSupabaseConfig(env);

  if (!config.configured) {
    return {
      configured: false,
      client: null,
      reason: config.reason,
    };
  }

  return {
    configured: true,
    client: createSupabaseRestClient({
      url: config.url,
      publishableKey: config.publishableKey,
      accessToken,
      fetchImpl,
    }),
    reason: "",
  };
}
