function authUrl(baseUrl, path, searchParams = {}) {
  const url = new URL(`/auth/v1/${path}`, baseUrl);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function authHeaders(config, accessToken = "") {
  const headers = {
    apikey: config.publishableKey,
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function parseAuthResponse(response) {
  const body = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    return {
      ok: false,
      reason: body?.msg ?? body?.message ?? body?.error_description ?? "Supabase Auth request failed.",
      session: null,
      user: null,
    };
  }

  return {
    ok: true,
    reason: "",
    session: normalizeSession(body),
    user: body?.user ?? body ?? null,
  };
}

export function normalizeSession(body, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!body?.access_token) {
    return null;
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? "",
    expiresAt: nowSeconds + Number(body.expires_in ?? 0),
    tokenType: body.token_type ?? "bearer",
    user: body.user ?? null,
  };
}

export async function signInWithPassword({
  config,
  email,
  password,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(authUrl(config.url, "token", { grant_type: "password" }), {
    method: "POST",
    headers: authHeaders(config),
    body: JSON.stringify({ email, password }),
  });

  return parseAuthResponse(response);
}

export async function signUpWithPassword({
  config,
  email,
  password,
  metadata = {},
  fetchImpl = fetch,
}) {
  const body = { email, password };
  if (Object.keys(metadata).length > 0) {
    body.data = metadata;
  }

  const response = await fetchImpl(authUrl(config.url, "signup"), {
    method: "POST",
    headers: authHeaders(config),
    body: JSON.stringify(body),
  });

  return parseAuthResponse(response);
}

export async function refreshAuthSession({
  config,
  refreshToken,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(authUrl(config.url, "token", { grant_type: "refresh_token" }), {
    method: "POST",
    headers: authHeaders(config),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  return parseAuthResponse(response);
}

export async function signOut({ config, accessToken, fetchImpl = fetch }) {
  const response = await fetchImpl(authUrl(config.url, "logout"), {
    method: "POST",
    headers: authHeaders(config, accessToken),
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json();
    return {
      ok: false,
      reason: body?.msg ?? body?.message ?? "Supabase logout failed.",
    };
  }

  return {
    ok: true,
    reason: "",
  };
}

export async function getCurrentUser({ config, accessToken, fetchImpl = fetch }) {
  const response = await fetchImpl(authUrl(config.url, "user"), {
    method: "GET",
    headers: authHeaders(config, accessToken),
  });

  const body = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      reason: body?.msg ?? body?.message ?? "Could not load Supabase user.",
      user: null,
    };
  }

  return {
    ok: true,
    reason: "",
    user: body,
  };
}

export async function updateUserMetadata({ config, accessToken, data, fetchImpl = fetch }) {
  const response = await fetchImpl(authUrl(config.url, "user"), {
    method: "PUT",
    headers: authHeaders(config, accessToken),
    body: JSON.stringify({ data }),
  });

  const body = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      reason: body?.msg ?? body?.message ?? "Could not update user metadata.",
      user: null,
    };
  }

  return {
    ok: true,
    reason: "",
    user: body,
  };
}

export async function requestPasswordReset({ config, email, redirectTo, fetchImpl = fetch }) {
  const response = await fetchImpl(authUrl(config.url, "recover", { redirect_to: redirectTo }), {
    method: "POST",
    headers: authHeaders(config),
    body: JSON.stringify({ email }),
  });

  // Supabase returns 200 with an empty body on success and intentionally does
  // not reveal whether the email exists, so we only surface ok/reason.
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    return {
      ok: false,
      reason: body?.msg ?? body?.message ?? "Could not send the password reset email.",
    };
  }

  return { ok: true, reason: "" };
}

export async function updatePassword({ config, accessToken, password, fetchImpl = fetch }) {
  const response = await fetchImpl(authUrl(config.url, "user"), {
    method: "PUT",
    headers: authHeaders(config, accessToken),
    body: JSON.stringify({ password }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      reason: body?.msg ?? body?.message ?? "Could not update the password.",
      user: null,
    };
  }

  return {
    ok: true,
    reason: "",
    user: body,
  };
}

export function buildGoogleOAuthUrl({ config, redirectTo }) {
  return authUrl(config.url, "authorize", {
    provider: "google",
    redirect_to: redirectTo,
  });
}

export function parseAuthSession(hash, nowSeconds = Math.floor(Date.now() / 1000)) {
  const cleanHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(cleanHash);
  const accessToken = params.get("access_token");

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: params.get("refresh_token") ?? "",
    expiresAt: nowSeconds + Number(params.get("expires_in") ?? 0),
    tokenType: params.get("token_type") ?? "bearer",
    user: null,
  };
}
