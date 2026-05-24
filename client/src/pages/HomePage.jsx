import { Link } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { getRegionAnalysisCopy, getRegionOption } from "../services/career/regionOptions.js";
import { useAppState } from "../state/AppStateContext.jsx";

export function HomePage() {
  const { analysis, careerTarget, missingSkills } = useAppState();
  const regionCopy = getRegionAnalysisCopy(careerTarget.region);
  const regionLabel = getRegionOption(careerTarget.region).label;
  const priorityTitle = analysis.status === "ready"
    ? `Review your ${missingSkills.length} market skill gaps`
    : analysis.status === "needs_market"
      ? "Load job-market analysis"
      : "Upload your latest CV";
  const priorityCopy = analysis.status === "ready"
    ? `Your CV is being compared with live job listings for ${careerTarget.role} ${regionCopy}.`
    : analysis.status === "needs_market"
      ? "Job API results are required before SkillBridge can calculate real market gaps."
      : "Confirm your latest CV before the app compares your resume with market jobs.";
  const readinessCircumference = 251.2;
  const readinessOffset = readinessCircumference - (analysis.readinessScore / 100) * readinessCircumference;

  return (
    <PageShell>
      <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop pt-24 py-8 space-y-gutter">
        <section className="mt-4">
          <h1 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl">
            Hello, Alex
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Your journey to becoming a <span className="text-primary font-semibold">{careerTarget.role}</span> in{" "}
            <span className="text-primary font-semibold">{regionLabel}</span>.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <section className="md:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col justify-between relative overflow-hidden group">
            <div className="z-10">
              <span className="bg-primary text-on-primary font-label-sm text-label-sm px-2 py-1 rounded mb-4 inline-block">
                Priority Action
              </span>
              <h2 className="font-headline-lg text-headline-lg mb-2">{priorityTitle}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">
                {priorityCopy}
              </p>
              <Link className="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all inline-flex" to="/analysis">
                View Analysis
              </Link>
            </div>
            <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
              <svg className="h-full w-full fill-primary" viewBox="0 0 100 100">
                <path d="M0,0 L100,0 L100,100 Z" />
              </svg>
            </div>
          </section>

          <section className="md:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col items-center justify-center text-center">
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-6 uppercase tracking-wider">Readiness Score</h3>
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-surface-container-highest stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="10" />
                <circle className="text-primary stroke-current progress-ring__circle" cx="50" cy="50" fill="transparent" r="40" strokeDasharray={readinessCircumference} strokeDashoffset={readinessOffset} strokeLinecap="round" strokeWidth="10" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline-xl text-headline-xl text-primary leading-none">{analysis.readinessScore}%</span>
              </div>
            </div>
            <p className="mt-6 font-label-sm text-label-sm text-secondary">
              {analysis.status === "ready" ? "Live market match" : "Waiting for required data"}
            </p>
          </section>

          <section className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["check_circle", "12", "Matched", "text-primary", "bg-primary/10"],
              ["warning", missingSkills.length, "Missing", "text-error", "bg-error-container/20"],
              ["school", "4", "Courses", "text-secondary", "bg-secondary-container/30"],
              ["trending_up", "High", "Demand", "text-primary", "bg-primary-container/20"],
            ].map(([icon, value, label, iconClass, bgClass]) => (
              <div key={label} className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center gap-4">
                <div className={`p-2 rounded-lg ${iconClass} ${bgClass}`}>
                  <Icon name={icon} />
                </div>
                <div>
                  <div className="font-headline-md text-headline-md">{value}</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">{label}</div>
                </div>
              </div>
            ))}
          </section>

          <section className="md:col-span-12">
            <h3 className="font-headline-md text-headline-md mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {[
                ["/cv", "upload_file", "Upload CV"],
                ["/analysis", "analytics", "Analyze Skill Gap"],
                ["/roadmap", "map", "View Roadmap"],
                ["/target", "search", "Explore Market"],
              ].map(([to, icon, label]) => (
                <Link key={label} to={to} className="bg-surface-container-high border border-outline-variant p-6 rounded-xl hover:border-primary transition-colors flex flex-col items-center gap-3 text-center active:scale-95">
                  <Icon name={icon} className="text-primary text-3xl" />
                  <span className="font-label-md text-label-md">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-md overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/3 aspect-video rounded-lg overflow-hidden bg-surface-variant">
              <div className="w-full h-full bg-[linear-gradient(135deg,#0d1c2d,#2dd4bf33),radial-gradient(circle_at_70%_30%,#57f1db55,transparent_35%)]" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="location_on" />
                <span className="font-label-md text-label-md uppercase tracking-widest">Market Insights: Sabah</span>
              </div>
              <h4 className="font-headline-lg text-headline-lg">Tech Talent Demand is Rising</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Data Analyst roles in Sabah are used here as the initial target market. Live job API data will replace this insight when a provider key is configured.
              </p>
              <div className="flex gap-2">
                {["SQL", "PowerBI", "Python"].map((skill) => (
                  <span key={skill} className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-xs font-label-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
