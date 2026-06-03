import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon.jsx";
import { regionOptions, getRegionOption } from "../../services/career/regionOptions.js";
import { useAuth } from "../../state/AuthContext.jsx";
import { useEmployerSubscription } from "../../state/useEmployerSubscription.js";
import { searchCandidates, getCandidate } from "../../services/employer/employerCandidatesApi.js";

function LockedState() {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg flex flex-col items-start gap-sm">
      <div className="flex items-center gap-sm text-primary">
        <Icon name="lock" />
        <h2 className="font-headline-md text-headline-md">Candidate search is a premium feature</h2>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Subscribe to search candidates by skill and location and view their AI-verified skill profiles.
      </p>
      <Link to="/employer/subscription" className="mt-sm inline-flex items-center gap-xs rounded-lg bg-primary px-lg py-sm font-label-md text-label-md text-on-primary active:scale-[0.98]">
        View subscription <Icon name="arrow_forward" />
      </Link>
    </div>
  );
}

export function CandidateSearchPage() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const { active, loading } = useEmployerSubscription();
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("all-malaysia");
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event) {
    event.preventDefault();
    setSearching(true);
    setError("");
    try {
      const result = await searchCandidates(token, { skill, location });
      setCandidates(result.candidates || []);
      setSelected(null);
    } catch (err) {
      setError(err.message || "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function openCandidate(id) {
    try {
      const result = await getCandidate(token, id);
      setSelected(result.candidate);
    } catch (err) {
      setError(err.message || "Could not load candidate.");
    }
  }

  if (loading) {
    return <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>;
  }

  if (!active) {
    return <LockedState />;
  }

  return (
    <div className="max-w-5xl">
      <h1 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mb-sm">
        Find Candidates
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
        Search candidates who applied to your jobs by skill and location.
      </p>

      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-sm mb-lg">
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="Skill (e.g. SQL, Figma, Python)"
          className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary"
        />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary"
        >
          {regionOptions.map((region) => (
            <option key={region.id} value={region.id}>{region.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={searching}
          className="px-lg py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg active:scale-[0.98] disabled:opacity-60"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="font-body-sm text-body-sm text-error mb-md">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <div className="space-y-sm">
          {candidates.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No candidates yet — run a search.</p>
          ) : (
            candidates.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => openCandidate(candidate.id)}
                className={`w-full text-left bg-surface-container border rounded-xl p-md hover:border-primary transition-colors ${selected?.id === candidate.id ? "border-primary" : "border-outline-variant"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-label-md text-label-md text-on-surface">{candidate.name}</p>
                  {candidate.verified && (
                    <span className="inline-flex items-center gap-xs rounded-full bg-tertiary-container text-on-tertiary-container px-sm py-xs font-label-sm text-label-sm">
                      <Icon name="verified" className="text-[14px]" /> AI-verified
                    </span>
                  )}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {candidate.program} · {getRegionOption(candidate.location).label} · {candidate.readiness}% ready
                </p>
                <div className="flex flex-wrap gap-xs mt-sm">
                  {candidate.skills.slice(0, 6).map((s) => (
                    <span key={s} className="rounded-full bg-surface-container-high px-sm py-xs font-label-sm text-label-sm text-on-surface-variant">{s}</span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>

        <div>
          {selected ? (
            <div className="bg-surface-container border border-outline-variant rounded-xl p-lg sticky top-4">
              <div className="flex items-center justify-between mb-sm">
                <h2 className="font-headline-md text-headline-md text-on-surface">{selected.name}</h2>
                {selected.verified && (
                  <span className="inline-flex items-center gap-xs rounded-full bg-tertiary-container text-on-tertiary-container px-sm py-xs font-label-sm text-label-sm">
                    <Icon name="verified" className="text-[14px]" /> AI-verified
                  </span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
                {selected.program} · {selected.university} · {getRegionOption(selected.location).label}
                {selected.targetRole ? ` · Targeting ${selected.targetRole}` : ""}
              </p>

              <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-xs">Technical skills</p>
              <div className="flex flex-wrap gap-xs mb-md">
                {(selected.skillProfile.technicalSkills || []).map((s) => (
                  <span key={s} className="rounded-lg bg-surface-container-high px-sm py-xs font-label-sm text-label-sm text-on-surface">{s}</span>
                ))}
              </div>

              {(selected.skillProfile.softSkills || []).length > 0 && (
                <>
                  <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-xs">Soft skills</p>
                  <div className="flex flex-wrap gap-xs mb-md">
                    {selected.skillProfile.softSkills.map((s) => (
                      <span key={s} className="rounded-lg bg-surface-container-high px-sm py-xs font-label-sm text-label-sm text-on-surface-variant">{s}</span>
                    ))}
                  </div>
                </>
              )}

              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Extractor: {selected.skillProfile.provider || "—"} · Confidence {Math.round((selected.skillProfile.confidence || 0) * 100)}% · Readiness {selected.readiness}%
              </p>
            </div>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Select a candidate to view their verified profile.</p>
          )}
        </div>
      </div>
    </div>
  );
}
