import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGoogleOAuthUrl,
  getCurrentUser,
  parseAuthSession,
  requestPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  updatePassword,
} from "./supabaseAuth.js";

test("updates the password using a recovery access token", async () => {
  const calls = [];
  const result = await updatePassword({
    config: {
      url: "https://skillbridge.supabase.co",
      publishableKey: "publishable-key",
    },
    accessToken: "recovery-access-token",
    password: "new-secret-password",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return { id: "user-123", email: "student@ums.edu.my" };
        },
      };
    },
  });

  assert.equal(calls[0].url, "https://skillbridge.supabase.co/auth/v1/user");
  assert.equal(calls[0].options.method, "PUT");
  assert.equal(calls[0].options.headers.Authorization, "Bearer recovery-access-token");
  assert.equal(calls[0].options.body, JSON.stringify({ password: "new-secret-password" }));
  assert.equal(result.ok, true);
  assert.equal(result.user.id, "user-123");
});

test("requests a password reset email through Supabase Auth REST", async () => {
  const calls = [];
  const result = await requestPasswordReset({
    config: {
      url: "https://skillbridge.supabase.co",
      publishableKey: "publishable-key",
    },
    email: "student@ums.edu.my",
    redirectTo: "https://skillbridge.vercel.app/reset-password",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 200, async json() { return {}; } };
    },
  });

  assert.equal(
    calls[0].url,
    "https://skillbridge.supabase.co/auth/v1/recover?redirect_to=https%3A%2F%2Fskillbridge.vercel.app%2Freset-password",
  );
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.apikey, "publishable-key");
  assert.equal(calls[0].options.body, JSON.stringify({ email: "student@ums.edu.my" }));
  assert.equal(result.ok, true);
});

test("signs in with email and password through Supabase Auth REST", async () => {
  const calls = [];
  const result = await signInWithPassword({
    config: {
      url: "https://skillbridge.supabase.co",
      publishableKey: "publishable-key",
    },
    email: "student@ums.edu.my",
    password: "secret-password",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            access_token: "access-token",
            refresh_token: "refresh-token",
            expires_in: 3600,
            token_type: "bearer",
            user: {
              id: "user-123",
              email: "student@ums.edu.my",
            },
          };
        },
      };
    },
  });

  assert.equal(calls[0].url, "https://skillbridge.supabase.co/auth/v1/token?grant_type=password");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.apikey, "publishable-key");
  assert.equal(calls[0].options.body, JSON.stringify({
    email: "student@ums.edu.my",
    password: "secret-password",
  }));
  assert.equal(result.ok, true);
  assert.equal(result.session.accessToken, "access-token");
  assert.equal(result.session.refreshToken, "refresh-token");
  assert.equal(result.session.user.id, "user-123");
});

test("signs up with email and password through Supabase Auth REST", async () => {
  const calls = [];
  const result = await signUpWithPassword({
    config: {
      url: "https://skillbridge.supabase.co",
      publishableKey: "publishable-key",
    },
    email: "student@ums.edu.my",
    password: "secret-password",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            id: "user-123",
            email: "student@ums.edu.my",
          };
        },
      };
    },
  });

  assert.equal(calls[0].url, "https://skillbridge.supabase.co/auth/v1/signup");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(result.ok, true);
  assert.equal(result.session, null);
  assert.equal(result.user.id, "user-123");
});

test("student signup sends role metadata to Supabase Auth", async () => {
  const calls = [];
  await signUpWithPassword({
    config: {
      url: "https://skillbridge.supabase.co",
      publishableKey: "publishable-key",
    },
    email: "student@ums.edu.my",
    password: "secret-password",
    metadata: { role: "student" },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return { id: "user-123", email: "student@ums.edu.my" };
        },
      };
    },
  });

  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.data.role, "student");
});

test("employer signup sends role and company_name metadata to Supabase Auth", async () => {
  const calls = [];
  await signUpWithPassword({
    config: {
      url: "https://skillbridge.supabase.co",
      publishableKey: "publishable-key",
    },
    email: "hr@company.com",
    password: "secret-password",
    metadata: { role: "employer", company_name: "Acme Corp" },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return { id: "user-456", email: "hr@company.com" };
        },
      };
    },
  });

  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.data.role, "employer");
  assert.equal(body.data.company_name, "Acme Corp");
});

test("builds a Google OAuth redirect URL for Supabase Auth", () => {
  const url = buildGoogleOAuthUrl({
    config: {
      url: "https://skillbridge.supabase.co",
      publishableKey: "publishable-key",
    },
    redirectTo: "https://skillbridge.vercel.app/home",
  });

  assert.equal(
    url,
    "https://skillbridge.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fskillbridge.vercel.app%2Fhome",
  );
});

test("parses an OAuth callback hash into a reusable auth session", () => {
  const session = parseAuthSession(
    "#access_token=access-token&refresh_token=refresh-token&expires_in=3600&token_type=bearer",
    1000,
  );

  assert.equal(session.accessToken, "access-token");
  assert.equal(session.refreshToken, "refresh-token");
  assert.equal(session.expiresAt, 4600);
});

test("loads the current Supabase Auth user with an access token", async () => {
  const calls = [];
  const result = await getCurrentUser({
    config: {
      url: "https://skillbridge.supabase.co",
      publishableKey: "publishable-key",
    },
    accessToken: "access-token",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            id: "user-123",
            email: "student@ums.edu.my",
          };
        },
      };
    },
  });

  assert.equal(calls[0].url, "https://skillbridge.supabase.co/auth/v1/user");
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.headers.Authorization, "Bearer access-token");
  assert.equal(result.ok, true);
  assert.equal(result.user.id, "user-123");
});
