import { useCallback, useEffect, useState } from "react";
import {
  buildSavedRoadmap,
  deleteSavedRoadmap,
  listSavedRoadmaps,
  saveRoadmap,
} from "../services/supabase/savedRoadmapRepository.js";
import { useAuth } from "./AuthContext.jsx";

// Owns the saved-roadmap history list and the save/delete actions. Kept out of
// AppStateContext so the feature stays self-contained and easy to remove.
export function useSavedRoadmaps() {
  const { session, supabaseConnection } = useAuth();
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [savedRoadmapStatus, setSavedRoadmapStatus] = useState("");
  const userId = session?.user?.id;
  const client = supabaseConnection?.client;
  const configured = Boolean(supabaseConnection?.configured);

  const reloadSavedRoadmaps = useCallback(async () => {
    if (!userId || !configured) {
      setSavedRoadmaps([]);
      return;
    }

    const result = await listSavedRoadmaps({ supabaseClient: client, userId });
    if (result.ok) {
      setSavedRoadmaps(result.roadmaps);
    } else {
      setSavedRoadmapStatus(result.reason);
    }
  }, [userId, client, configured]);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) {
      reloadSavedRoadmaps();
    }
    return () => {
      cancelled = true;
    };
  }, [reloadSavedRoadmaps]);

  const saveCurrentRoadmap = useCallback(
    async ({ careerTarget, analysis, roadmapPlan, title }) => {
      if (!userId || !configured) {
        const reason = "Sign in to save roadmaps.";
        setSavedRoadmapStatus(reason);
        return { ok: false, reason };
      }

      const record = buildSavedRoadmap({ userId, careerTarget, analysis, roadmapPlan, title });
      const result = await saveRoadmap({ supabaseClient: client, record });
      if (result.ok && result.roadmap) {
        setSavedRoadmaps((current) => [result.roadmap, ...current]);
        setSavedRoadmapStatus("Roadmap saved to your history.");
      } else {
        setSavedRoadmapStatus(result.reason);
      }
      return result;
    },
    [userId, client, configured],
  );

  const removeSavedRoadmap = useCallback(
    async (id) => {
      const result = await deleteSavedRoadmap({ supabaseClient: client, id });
      if (result.ok) {
        setSavedRoadmaps((current) => current.filter((roadmap) => roadmap.id !== id));
        setSavedRoadmapStatus("Roadmap removed.");
      } else {
        setSavedRoadmapStatus(result.reason);
      }
      return result;
    },
    [client],
  );

  return {
    savedRoadmaps,
    savedRoadmapStatus,
    saveCurrentRoadmap,
    removeSavedRoadmap,
    reloadSavedRoadmaps,
  };
}
