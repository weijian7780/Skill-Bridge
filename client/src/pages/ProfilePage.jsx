import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { getRegionOption } from "../services/career/regionOptions.js";
import { useAppState } from "../state/AppStateContext.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export function ProfilePage() {
  const navigate = useNavigate();
  const { analysis, careerTarget, cvDocument, skillProfile, missingSkills, roadmap, syncStatus } = useAppState();
  const { config, logout, session } = useAuth();
  const displayName = session?.user?.email?.split("@")[0] ?? "Student";
  const gaps = missingSkills;
  const regionLabel = getRegionOption(careerTarget.region).label;
  const educationSummary = skillProfile.education || "No education saved yet";
  const readinessLabel = analysis.status === "ready" ? "Live Match" : "Pending";
  const completedRoadmapCount = roadmap.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    return status === "completed" || status === "done";
  }).length;
  const roadmapProgress = roadmap.length > 0
    ? Math.round((completedRoadmapCount / roadmap.length) * 100)
    : 0;
  const roadmapStatus = roadmap.length > 0 ? `${roadmap.length} Items` : "Pending";

  // Prepare radar chart data
  const radarData = [
    { subject: 'Technical', A: Math.min(100, analysis.readinessScore + 10), fullMark: 100 },
    { subject: 'Soft Skills', A: Math.min(100, analysis.readinessScore + 20), fullMark: 100 },
    { subject: 'Education', A: Math.min(100, analysis.readinessScore + 5), fullMark: 100 },
    { subject: 'Tools', A: Math.min(100, analysis.readinessScore - 5), fullMark: 100 },
    { subject: 'Market Match', A: analysis.readinessScore, fullMark: 100 },
  ];

  async function handleSignOut() {
    await logout();
    navigate("/");
  }

  return (
    <PageShell>
      <main className="pt-24 px-margin-mobile max-w-2xl mx-auto space-y-md">
        <section className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">{displayName}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{educationSummary}</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-sm">
          <article className="bg-surface-container p-md border border-outline-variant rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-md">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Readiness Snapshot</span>
              <Icon name="trending_up" className="text-primary" />
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Student" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-md text-center">
              <div className="flex items-center justify-center gap-xs">
                <span className="font-headline-xl-mobile text-headline-xl-mobile text-primary">{analysis.readinessScore}%</span>
                <span className="font-label-md text-label-md text-primary pb-1">{readinessLabel}</span>
              </div>
            </div>
          </article>

          <article className="bg-surface-container p-md border border-outline-variant rounded-xl flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Roadmap Status</span>
              <Icon name="map" className="text-secondary" />
            </div>
            <div className="mt-auto">
              <div className="flex items-end gap-xs">
                <span className="font-headline-xl-mobile text-headline-xl-mobile text-secondary">{roadmap.length}</span>
                <span className="font-label-md text-label-md text-on-secondary-container pb-1">{roadmapStatus}</span>
              </div>
              <div className="w-full bg-surface-variant h-1.5 rounded-full mt-sm overflow-hidden">
                <div className="bg-secondary h-full" style={{ width: `${roadmapProgress}%` }} />
              </div>
            </div>
          </article>
        </section>

        <article className="bg-surface-container p-md border border-outline-variant rounded-xl">
          <div className="flex items-center gap-sm mb-md">
            <Icon name="target" className="text-primary" />
            <h3 className="font-headline-md text-headline-md text-on-surface">Career Target</h3>
          </div>
          <div className="flex justify-between items-center bg-surface-container-low p-sm rounded-lg">
            <div>
              <p className="font-body-md text-body-md text-on-surface">{careerTarget.role}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{regionLabel}</p>
            </div>
            <Link className="text-primary hover:underline font-label-md text-label-md" to="/target">Edit</Link>
          </div>
        </article>

        <article className="bg-surface-container p-md border border-outline-variant rounded-xl">
          <div className="flex justify-between items-center mb-md">
            <div className="flex items-center gap-sm">
              <Icon name="warning" className="text-error" />
              <h3 className="font-headline-md text-headline-md text-on-surface">Skill Gap Summary</h3>
            </div>
            <span className="bg-error-container text-on-error-container font-label-sm text-label-sm px-2 py-0.5 rounded">{gaps.length} Missing</span>
          </div>
          <div className="flex flex-wrap gap-xs">
            {gaps.slice(0, 3).map((skill) => (
              <span key={skill} className="bg-surface-variant text-on-surface-variant px-sm py-xs rounded-full font-label-sm text-label-sm">{skill}</span>
            ))}
            {gaps.length > 3 && <span className="bg-surface-variant text-on-surface-variant px-sm py-xs rounded-full font-label-sm text-label-sm">+{gaps.length - 3} more</span>}
            {gaps.length === 0 && (
              <span className="bg-surface-variant text-on-surface-variant px-sm py-xs rounded-full font-label-sm text-label-sm">
                {analysis.status === "needs_market" ? "Job market pending" : "No gaps detected"}
              </span>
            )}
          </div>
        </article>

        <article className="bg-surface-container p-md border border-outline-variant rounded-xl">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Saved Documents</h3>
          <div className="flex items-center justify-between p-sm border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer group">
            <div className="flex items-center gap-sm">
              <Icon name="description" className="text-on-surface-variant group-hover:text-primary transition-colors" />
              <span className="font-body-md text-body-md text-on-surface">
                {cvDocument?.fileName || (skillProfile.provider === "Not extracted yet" ? "No CV uploaded yet" : "Latest CV saved")}
              </span>
            </div>
            <Icon name="download" className="text-on-surface-variant" />
          </div>
        </article>

        <article className="bg-surface-container p-md border border-outline-variant rounded-xl">
          <div className="flex items-center justify-between gap-sm">
            <div className="flex items-center gap-sm">
              <Icon
                name={config.configured ? "cloud_done" : "cloud_off"}
                className={config.configured ? "text-primary" : "text-on-surface-variant"}
              />
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Data Sync</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {config.configured ? syncStatus : config.reason}
                </p>
              </div>
            </div>
            <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded ${config.configured ? "bg-primary-container text-on-primary-container" : "bg-surface-variant text-on-surface-variant"}`}>
              {config.configured ? "Live" : "Local"}
            </span>
          </div>
        </article>

        <section className="pt-lg space-y-sm">
          <button className="w-full flex items-center gap-md p-md hover:bg-surface-container rounded-xl transition-colors text-on-surface border border-transparent hover:border-outline-variant">
            <Icon name="settings" />
            <span className="font-label-md text-label-md">Account Settings</span>
          </button>
          <button className="w-full flex items-center gap-md p-md hover:bg-error-container/20 rounded-xl transition-colors text-error border border-transparent hover:border-error/30" onClick={handleSignOut}>
            <Icon name="logout" />
            <span className="font-label-md text-label-md">Sign Out</span>
          </button>
        </section>
      </main>
    </PageShell>
  );
}
