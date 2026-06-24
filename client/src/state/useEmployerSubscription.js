import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  activateEmployerSubscription,
  buyEmployerJobPostCredit,
  cancelEmployerSubscription,
  getEmployerSubscription,
} from "../services/employer/employerSubscriptionApi.js";

// Tracks the current employer's subscription so the UI can gate premium
// features (post jobs, candidate search, verified profiles).
export function useEmployerSubscription() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [subscription, setSubscription] = useState(null);
  const [active, setActive] = useState(false);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const reload = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getEmployerSubscription(token);
      setSubscription(result.subscription ?? null);
      setActive(Boolean(result.active));
      setAvailableCredits(result.availableCredits ?? 0);
    } catch (error) {
      setStatus(error.message || "Could not load subscription.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const subscribe = useCallback(async (plan = "professional") => {
    if (!token) return { ok: false };
    try {
      const result = await activateEmployerSubscription(token, plan);
      setSubscription(result.subscription ?? null);
      setActive(true);
      setStatus("Subscription activated.");
      return { ok: true };
    } catch (error) {
      setStatus(error.message || "Could not activate subscription.");
      return { ok: false, reason: error.message };
    }
  }, [token]);

  const buyCredit = useCallback(async () => {
    if (!token) return { ok: false };
    try {
      await buyEmployerJobPostCredit(token);
      setAvailableCredits((count) => count + 1);
      setStatus("Job-post credit purchased.");
      return { ok: true };
    } catch (error) {
      setStatus(error.message || "Could not purchase credit.");
      return { ok: false, reason: error.message };
    }
  }, [token]);

  const cancel = useCallback(async () => {
    if (!token) return { ok: false };
    try {
      await cancelEmployerSubscription(token);
      setActive(false);
      setStatus("Subscription cancelled.");
      return { ok: true };
    } catch (error) {
      setStatus(error.message || "Could not cancel subscription.");
      return { ok: false };
    }
  }, [token]);

  return { subscription, active, availableCredits, loading, status, reload, subscribe, buyCredit, cancel };
}
