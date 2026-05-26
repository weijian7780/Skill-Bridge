import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { regionOptions } from "../services/career/regionOptions.js";
import { useAppState } from "../state/AppStateContext.jsx";

export function CareerTargetPage() {
  const { careerTarget, setCareerTarget, skillProfile } = useAppState();
  const [draft, setDraft] = useState(careerTarget);
  const navigate = useNavigate();
  const suggestedRole = suggestTargetRole({ careerTarget, skillProfile });

  useEffect(() => {
    setDraft(careerTarget);
  }, [careerTarget]);

  function saveTarget(event) {
    event.preventDefault();
    setCareerTarget({
      ...draft,
      role: draft.role.trim() || careerTarget.role,
    });
    navigate("/analysis");
  }

  function applySuggestion() {
    if (!suggestedRole) {
      return;
    }

    setDraft((current) => ({
      ...current,
      role: suggestedRole,
    }));
  }

  return (
    <PageShell>
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Step 1 of 4</span>
            <span className="font-label-md text-label-md text-primary">25% Completed</span>
          </div>
          <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="w-1/4 h-full bg-primary transition-all duration-700 ease-out" />
          </div>
        </div>

        <section className="mb-12">
          <h1 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl mb-4 text-on-surface">
            Set Your Career Target
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Define your professional aspirations. We'll use this data to tailor your skill roadmap and job recommendations.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <section className="md:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-md md:p-lg shadow-sm">
            <form className="space-y-8" onSubmit={saveTarget}>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-sm md:p-md">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-xs" htmlFor="target-role">Target Role</label>
                <div className="relative">
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-12 pr-4 py-4 font-headline-md text-headline-md text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" id="target-role" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} />
                  <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-md">
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="region">Region Preference</label>
                  <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" id="region" value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })}>
                    {regionOptions.map((region) => (
                      <option key={region.id} value={region.id}>{region.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-6">
                <button className="w-full md:w-auto bg-primary text-on-primary font-label-md text-label-md px-12 py-4 rounded-lg font-bold hover:bg-secondary transition-all active:scale-[0.98] shadow-lg shadow-primary/10">
                  Save Target
                </button>
              </div>
            </form>
          </section>

          <aside className="md:col-span-4 space-y-gutter">
            <div className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-primary text-on-primary p-2 rounded-lg">
                  <Icon name="auto_awesome" filled />
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary">Profile Suggestion</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Sourced from confirmed CV skills</p>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface mb-6 italic">
                {suggestedRole
                  ? <>Based on your confirmed CV skills, <span className="text-primary font-bold">{suggestedRole}</span> is also a possible target.</>
                  : "Confirm a latest CV before SkillBridge suggests another target role."}
              </p>
              <button
                className="w-full border border-primary text-primary font-label-md text-label-md py-3 rounded-lg hover:bg-primary/5 transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!suggestedRole}
                onClick={applySuggestion}
                type="button"
              >
                Apply Suggestion
              </button>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase mb-4">Why this matters?</h3>
              <ul className="space-y-4">
                {["Get curated learning paths for the target role.", "Receive relevant local job-market insights.", "Keep roadmap recommendations tied to your target role."].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Icon name="check_circle" className="text-primary text-[20px]" />
                    <span className="font-body-sm text-body-sm text-on-surface">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}

function suggestTargetRole({ careerTarget, skillProfile }) {
  if (!skillProfile || skillProfile.provider === "Not extracted yet") {
    return "";
  }

  const profileText = [
    ...(skillProfile.technicalSkills ?? []),
    ...(skillProfile.softSkills ?? []),
    ...(skillProfile.certifications ?? []),
    skillProfile.education ?? "",
  ].join(" ").toLowerCase();
  const currentRole = String(careerTarget?.role || "").toLowerCase();

  if (!profileText.trim()) {
    return "";
  }

  if (
    containsAny(profileText, ["figma", "adobe xd", "sketch", "invision", "user research", "ux design"]) &&
    !containsAny(currentRole, ["ui", "ux", "designer"])
  ) {
    return "UI/UX Designer";
  }

  if (
    containsAny(profileText, ["power bi", "business intelligence", "dashboard", "sql"]) &&
    !containsAny(currentRole, ["business intelligence", "bi analyst"])
  ) {
    return "Business Intelligence Analyst";
  }

  if (
    containsAny(profileText, ["react", "javascript", "typescript", "frontend"]) &&
    !containsAny(currentRole, ["frontend", "front end"])
  ) {
    return "Frontend Developer";
  }

  return "";
}

function containsAny(text, fragments) {
  return fragments.some((fragment) => text.includes(fragment));
}
