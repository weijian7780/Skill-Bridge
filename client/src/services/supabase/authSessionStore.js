export const sessionStorageKey = "skillbridge.supabase.session";

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

export function saveStoredSession(storage, session) {
  if (!storage || !session?.accessToken) {
    return;
  }

  storage.setItem(sessionStorageKey, JSON.stringify(session));
}

export function loadStoredSession(storage, currentSeconds = nowSeconds()) {
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(sessionStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw);

    if (!session?.accessToken || Number(session.expiresAt ?? 0) <= currentSeconds) {
      clearStoredSession(storage);
      return null;
    }

    return session;
  } catch {
    clearStoredSession(storage);
    return null;
  }
}

export function clearStoredSession(storage) {
  storage?.removeItem(sessionStorageKey);
}
