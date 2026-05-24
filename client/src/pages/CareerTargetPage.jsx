import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { regionOptions } from "../services/career/regionOptions.js";
import { useAppState } from "../state/AppStateContext.jsx";

const companyOptions = ["MNC", "Startup", "GLC", "SME"];

export function CareerTargetPage() {
  const { careerTarget, setCareerTarget } = useAppState();
  const [draft, setDraft] = useState(careerTarget);

  function toggleCompany(type) {
    setDraft((current) => {
      const hasType = current.companyTypes.includes(type);
      return {
        ...current,
        companyTypes: hasType
          ? current.companyTypes.filter((item) => item !== type)
          : [...current.companyTypes, type],
      };
    });
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
          <section className="md:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-md md:p-lg">
            <form className="space-y-8" onSubmit={(event) => { event.preventDefault(); setCareerTarget(draft); }}>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="target-role">Target Role</label>
                <div className="relative">
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-all" id="target-role" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} />
                  <Icon name="search" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="industry">Industry</label>
                  <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-all" id="industry" value={draft.industry} onChange={(event) => setDraft({ ...draft, industry: event.target.value })}>
                    <option>Data / IT</option>
                    <option>Finance</option>
                    <option>Marketing</option>
                    <option>Engineering</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="region">Region Preference</label>
                  <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-all" id="region" value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })}>
                    {regionOptions.map((region) => (
                      <option key={region.id} value={region.id}>{region.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <span className="block font-label-md text-label-md text-on-surface-variant">Company Type Preference</span>
                <div className="flex flex-wrap gap-3">
                  {companyOptions.map((type) => {
                    const selected = draft.companyTypes.includes(type);
                    return (
                      <button key={type} className={`flex items-center gap-2 px-6 py-3 rounded-full border bg-surface-container-lowest font-label-md text-label-md hover:border-primary transition-all active:scale-95 ${selected ? "border-primary text-primary" : "border-outline-variant text-on-surface"}`} onClick={() => toggleCompany(type)} type="button">
                        <Icon name={type === "MNC" ? "corporate_fare" : type === "Startup" ? "rocket_launch" : type === "GLC" ? "account_balance" : "store"} className="text-[18px]" />
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-6">
                <button className="w-full md:w-auto bg-primary text-on-primary font-label-md text-label-md px-12 py-4 rounded-lg font-bold hover:bg-primary-container transition-all active:scale-[0.98] shadow-lg shadow-primary/10">
                  Save Target
                </button>
              </div>
            </form>
          </section>

          <aside className="md:col-span-4 space-y-gutter">
            <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-md">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-primary text-on-primary p-2 rounded-lg">
                  <Icon name="auto_awesome" filled />
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary">AI Suggestion</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Sourced from your current profile</p>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface mb-6 italic">
                "Based on your profile, <span className="text-primary font-bold">Business Intelligence Intern</span> is also a good match."
              </p>
              <button className="w-full border border-primary text-primary font-label-md text-label-md py-3 rounded-lg hover:bg-primary/5 transition-colors active:scale-95">
                Add to Targets
              </button>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-xl p-md">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase mb-4">Why this matters?</h3>
              <ul className="space-y-4">
                {["Get curated learning paths for specific industries.", "Receive relevant local job-market insights.", "Keep roadmap recommendations tied to your target role."].map((item) => (
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
