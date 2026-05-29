import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearStoredSession, loadStoredSession, saveStoredSession } from "../services/supabase/authSessionStore.js";
import { createSupabaseConnection } from "../services/supabase/supabaseClient.js";
import { getSupabaseConfig } from "../services/supabase/supabaseConfig.js";
import {
  buildGoogleOAuthUrl,
  getCurrentUser,
  parseAuthSession,
  refreshAuthSession,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updateUserMetadata,
} from "../services/supabase/supabaseAuth.js";

const AuthContext = createContext(null);

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function callbackRedirectUrl() {
  return typeof window === "undefined" ? "" : `${window.location.origin}/home`;
}

export function AuthProvider({ children }) {
  const config = useMemo(() => getSupabaseConfig(), []);
  const storage = browserStorage();
  const [session, setSession] = useState(() => loadStoredSession(storage));
  const [authStatus, setAuthStatus] = useState(config.configured ? "" : config.reason);
  const [isLoading, setIsLoading] = useState(true);

  const supabaseConnection = useMemo(() => createSupabaseConnection({
    env: {
      VITE_SUPABASE_URL: config.url,
      VITE_SUPABASE_PUBLISHABLE_KEY: config.publishableKey,
    },
    accessToken: session?.accessToken ?? "",
  }), [config.publishableKey, config.url, session?.accessToken]);

  const completeSession = useCallback(async (nextSession) => {
    if (!nextSession?.accessToken) {
      return {
        ok: false,
        reason: "Supabase did not return an access token.",
      };
    }

    let resolvedSession = nextSession;
    if (!resolvedSession.user && config.configured) {
      const userResult = await getCurrentUser({
        config,
        accessToken: resolvedSession.accessToken,
      });

      if (userResult.ok) {
        resolvedSession = {
          ...resolvedSession,
          user: userResult.user,
        };
      }
    }

    setSession(resolvedSession);
    saveStoredSession(storage, resolvedSession);
    setAuthStatus("Signed in");

    return {
      ok: true,
      reason: "",
      session: resolvedSession,
    };
  }, [config, storage]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        const callbackSession = parseAuthSession(window.location.hash);
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

        if (callbackSession) {
          await completeSession(callbackSession);
        }
      } else if (session?.refreshToken && config.configured) {
        const secondsLeft = Number(session.expiresAt ?? 0) - Math.floor(Date.now() / 1000);
        if (secondsLeft < 120) {
          const result = await refreshAuthSession({
            config,
            refreshToken: session.refreshToken,
          });

          if (result.ok && result.session) {
            await completeSession(result.session);
          } else {
            clearStoredSession(storage);
            setSession(null);
            setAuthStatus("Session expired");
          }
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [completeSession, config, session?.expiresAt, session?.refreshToken, storage]);

  const login = useCallback(async ({ email, password }) => {
    if (!config.configured) {
      return {
        ok: false,
        reason: config.reason,
      };
    }

    setAuthStatus("Signing in...");
    const result = await signInWithPassword({ config, email, password });
    if (!result.ok || !result.session) {
      setAuthStatus(result.reason);
      return result;
    }

    return completeSession(result.session);
  }, [completeSession, config]);

  const register = useCallback(async ({ email, password, metadata }) => {
    if (!config.configured) {
      return {
        ok: false,
        reason: config.reason,
      };
    }

    setAuthStatus("Creating account...");
    const result = await signUpWithPassword({ config, email, password, metadata });
    
    if (!result.ok) {
      setAuthStatus(result.reason);
      return result;
    }

    // Detect fake user returned by Supabase to prevent email enumeration
    if (result.user && result.user.identities && result.user.identities.length === 0) {
      const reason = "An account with this email already exists.";
      setAuthStatus(reason);
      return { ok: false, reason };
    }

    if (result.session) {
      return completeSession(result.session);
    }

    setAuthStatus("Account created. Check email confirmation if Supabase requires it.");
    return result;
  }, [completeSession, config]);

  const updateMetadata = useCallback(async (data) => {
    if (!config.configured || !session?.accessToken) {
      return { ok: false, reason: "Not authenticated" };
    }
    const result = await updateUserMetadata({ config, accessToken: session.accessToken, data });
    if (result.ok && result.user) {
      setSession(current => {
        if (!current) return current;
        const newSession = { ...current, user: result.user };
        saveStoredSession(storage, newSession);
        return newSession;
      });
    }
    return result;
  }, [config, session?.accessToken, storage]);

  const loginWithGoogle = useCallback(() => {
    if (!config.configured || typeof window === "undefined") {
      setAuthStatus(config.reason);
      return;
    }

    window.location.assign(buildGoogleOAuthUrl({
      config,
      redirectTo: callbackRedirectUrl(),
    }));
  }, [config]);

  const expireSession = useCallback((reason = "Session expired") => {
    clearStoredSession(storage);
    setSession(null);
    setAuthStatus(reason);
  }, [storage]);

  const logout = useCallback(async () => {
    if (config.configured && session?.accessToken) {
      await signOut({ config, accessToken: session.accessToken });
    }

    clearStoredSession(storage);
    setSession(null);
    setAuthStatus("Signed out");
  }, [config, session?.accessToken, storage]);

  const value = {
    authStatus,
    config,
    expireSession,
    isAuthenticated: Boolean(session?.accessToken),
    isLoading,
    login,
    loginWithGoogle,
    logout,
    register,
    session,
    supabaseConnection,
    updateMetadata,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
