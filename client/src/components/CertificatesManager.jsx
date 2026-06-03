import { useEffect, useState } from "react";
import { Icon } from "./Icon.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { useAppState } from "../state/AppStateContext.jsx";
import { matchCertSkillsToGaps } from "../services/analysis/certificateSkillMatch.js";
import {
  deleteCertificate,
  getCertificateUrl,
  listCertificates,
  uploadCertificate,
} from "../services/student/certificatesApi.js";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

export function CertificatesManager() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const { analysis, skillProfile, setSkillProfile } = useAppState();
  const missingSkills = analysis?.missingSkills ?? [];

  const [certificates, setCertificates] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  // { closesGaps:[], otherSkills:[], selected:Set, title } shown after an upload that detected skills.
  const [pendingMatch, setPendingMatch] = useState(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    listCertificates(token)
      .then((res) => active && setCertificates(res.certificates ?? []))
      .catch((error) => active && setStatus(error.message));
    return () => {
      active = false;
    };
  }, [token]);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0 || !token) return;

    setBusy(true);
    setPendingMatch(null);
    setStatus(`Uploading ${files.length} file(s)...`);
    try {
      let lastTags = [];
      let lastTitle = "";
      for (const file of files) {
        const res = await uploadCertificate(token, file, file.name);
        setCertificates((current) => [res.certificate, ...current]);
        lastTags = res.certificate?.skill_tags ?? [];
        lastTitle = res.certificate?.title ?? file.name;
      }

      // Offer to apply the detected skills (focus on ones that close a current gap).
      const match = matchCertSkillsToGaps({ certSkills: lastTags, missingSkills });
      if (match.closesGaps.length > 0 || match.otherSkills.length > 0) {
        setPendingMatch({
          ...match,
          title: lastTitle,
          selected: new Set(match.closesGaps), // gap-closers pre-selected
        });
        setOpen(true);
        setStatus("Uploaded. We detected skills on this certificate — review below.");
      } else {
        setStatus("Certificate(s) uploaded.");
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleSkill(skill) {
    setPendingMatch((current) => {
      if (!current) return current;
      const selected = new Set(current.selected);
      selected.has(skill) ? selected.delete(skill) : selected.add(skill);
      return { ...current, selected };
    });
  }

  function applySelectedSkills() {
    const chosen = [...(pendingMatch?.selected ?? [])];
    if (chosen.length > 0) {
      setSkillProfile((prev) => {
        const existing = prev?.certifications ?? [];
        const seen = new Set(existing.map((s) => String(s).toLowerCase()));
        const additions = chosen.filter((s) => !seen.has(String(s).toLowerCase()));
        return { ...prev, certifications: [...existing, ...additions] };
      });
    }
    setPendingMatch(null);
    setStatus(chosen.length > 0 ? "Skills added to your profile — your gaps will update." : "No skills added.");
  }

  async function handleView(id) {
    try {
      const res = await getCertificateUrl(token, id);
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCertificate(token, id);
      setCertificates((current) => current.filter((cert) => cert.id !== id));
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <section className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
      <details className="group" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary className="flex cursor-pointer items-center justify-between font-headline-md text-headline-md text-on-surface list-none outline-none">
          <div className="flex items-center gap-sm">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-container text-primary">
              <Icon name="verified" />
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Certificates</p>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                {certificates.length > 0 ? `${certificates.length} uploaded` : "None yet — optional"}
              </h2>
            </div>
          </div>
          <Icon name="expand_more" className="text-primary transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-sm border-t border-outline-variant/60 pt-sm">
          <div className="flex items-center justify-between mb-md">
            <p className="font-body-sm text-body-sm text-on-surface-variant pr-sm">
              Upload certificates (PDF or image) that prove your skills. We detect the skills they prove and can add them to your profile to close skill gaps.
            </p>
            <label className="flex shrink-0 items-center gap-xs rounded-lg bg-primary px-md py-sm font-label-md text-label-md text-on-primary cursor-pointer active:scale-[0.98]">
              <Icon name="upload_file" className="text-[18px]" />
              {busy ? "Uploading..." : "Add"}
              <input
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                disabled={busy}
                onChange={(event) => handleFiles(event.target.files)}
              />
            </label>
          </div>

      {pendingMatch && (
        <div className="mb-md rounded-lg border border-primary/40 bg-primary-container/20 p-sm space-y-sm">
          <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Skills detected on this certificate</p>
          {pendingMatch.closesGaps.length > 0 && (
            <p className="font-body-sm text-body-sm text-on-surface">
              <Icon name="check_circle" className="text-primary text-[16px] align-middle" /> Closes a current skill gap:
            </p>
          )}
          <div className="flex flex-wrap gap-xs">
            {[...pendingMatch.closesGaps, ...pendingMatch.otherSkills].map((skill) => {
              const checked = pendingMatch.selected.has(skill);
              const closesGap = pendingMatch.closesGaps.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`rounded-full px-sm py-xs font-label-sm text-label-sm border transition-colors ${
                    checked
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                  }`}
                >
                  {closesGap && "★ "}{skill}
                </button>
              );
            })}
          </div>
          <div className="flex gap-sm pt-xs">
            <button type="button" onClick={applySelectedSkills} className="rounded-lg bg-primary px-md py-sm font-label-md text-label-md text-on-primary active:scale-[0.98]">
              Add selected skills
            </button>
            <button type="button" onClick={() => setPendingMatch(null)} className="rounded-lg border border-outline-variant px-md py-sm font-label-md text-label-md text-on-surface-variant">
              Skip
            </button>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">★ = closes a gap. You decide what gets added — nothing is added automatically.</p>
        </div>
      )}

      {certificates.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant italic">No certificates uploaded yet.</p>
      ) : (
        <ul className="space-y-sm">
          {certificates.map((cert) => (
            <li
              key={cert.id}
              className="flex items-center justify-between p-sm border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <div className="flex items-center gap-sm min-w-0">
                <Icon name="verified" className="text-primary shrink-0" />
                <span className="font-body-md text-body-md text-on-surface truncate">{cert.title || cert.file_name}</span>
              </div>
              <div className="flex items-center gap-sm shrink-0">
                <button type="button" onClick={() => handleView(cert.id)} title="View" className="text-on-surface-variant hover:text-primary">
                  <Icon name="visibility" />
                </button>
                <button type="button" onClick={() => handleDelete(cert.id)} title="Delete" className="text-on-surface-variant hover:text-error">
                  <Icon name="delete" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

          {status && <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">{status}</p>}
        </div>
      </details>
    </section>
  );
}
