import test from "node:test";
import assert from "node:assert/strict";

import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from "./authSessionStore.js";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("saves and loads a valid Supabase auth session", () => {
  const storage = createMemoryStorage();
  const session = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: 2000,
    tokenType: "bearer",
    user: { id: "user-123", email: "student@ums.edu.my" },
  };

  saveStoredSession(storage, session);

  assert.deepEqual(loadStoredSession(storage, 1000), session);
});

test("clears expired Supabase auth sessions", () => {
  const storage = createMemoryStorage();
  saveStoredSession(storage, {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: 999,
    tokenType: "bearer",
    user: { id: "user-123" },
  });

  assert.equal(loadStoredSession(storage, 1000), null);
  assert.equal(storage.getItem("skillbridge.supabase.session"), null);
});

test("clears stored Supabase auth session on sign out", () => {
  const storage = createMemoryStorage();
  saveStoredSession(storage, {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: 2000,
    tokenType: "bearer",
    user: { id: "user-123" },
  });

  clearStoredSession(storage);

  assert.equal(loadStoredSession(storage, 1000), null);
});
