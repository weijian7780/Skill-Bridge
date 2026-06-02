import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getStudentApplications } from "../services/student/applicationApi.js";

// Returns the set of job_post ids the current student has already applied to,
// so the UI can show an "Applied" state instead of letting them re-apply
// (mirrors JobStreet — one application per job, enforced by a unique constraint).
export function useAppliedJobIds() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [appliedJobIds, setAppliedJobIds] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      try {
        const result = await getStudentApplications(token);
        if (!cancelled && Array.isArray(result.applications)) {
          setAppliedJobIds(new Set(result.applications.map((application) => application.job_id)));
        }
      } catch {
        // Non-blocking: if this fails the apply button still works (and the
        // server's 409 remains the safety net against duplicates).
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return appliedJobIds;
}
