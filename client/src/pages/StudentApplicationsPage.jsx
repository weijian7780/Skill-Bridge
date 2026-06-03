import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { getStudentApplications } from "../services/student/studentApplicationsApi.js";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6b6b'];

export function StudentApplicationsPage() {
  const { session } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function fetchApps() {
      if (!session?.accessToken) return;
      try {
        const response = await getStudentApplications(session.accessToken);
        if (response.applications) {
          setApplications(response.applications);
        }
      } catch (err) {
        console.error("Failed to load applications", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchApps();
  }, [session]);

  const STATUS_MESSAGES = {
    pending: "Your application has been submitted and is awaiting review.",
    reviewed: "The employer has reviewed your application.",
    shortlisted: "Good news — you've been shortlisted for this role.",
    interview: "You've been invited to an interview. See the details below.",
    hired: "🎉 Congratulations! You've been selected for this role.",
    rejected: "Unfortunately, you were not selected for this role this time.",
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-orange-500/20 text-orange-700 border-orange-500/30";
      case "reviewed": return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "shortlisted": return "bg-purple-500/20 text-purple-700 border-purple-500/30";
      case "interview": return "bg-teal-500/20 text-teal-700 border-teal-500/30";
      case "hired": return "bg-green-500/20 text-green-700 border-green-500/30";
      case "rejected": return "bg-red-500/20 text-red-700 border-red-500/30";
      default: return "bg-surface-variant text-on-surface-variant border-outline-variant";
    }
  };

  // Prepare stats
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});
  const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();
  const appsOverTime = last7Days.map(date => ({
    date: date.substring(5), // MM-DD
    applications: applications.filter(a => a.applied_at.startsWith(date)).length
  }));

  if (isLoading) {
    return (
      <PageShell>
        <main className="pt-20 pb-32 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto min-h-screen flex items-center justify-center">
          <p className="font-label-md text-on-surface-variant">Loading your applications...</p>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="pt-20 pb-32 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto">
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            My Applications
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Track your job applications and application status.
          </p>
        </div>

        {applications.length > 0 ? (
          <>
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-lg">
              {/* Applications Over Time */}
              <div className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm h-80 flex flex-col">
                <h3 className="font-headline-sm text-on-surface mb-md">Application Activity (Last 7 Days)</h3>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
                    <BarChart data={appsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                      <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm h-80 flex flex-col">
                <h3 className="font-headline-sm text-on-surface mb-md">Application Statuses</h3>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Application List */}
            <h2 className="font-headline-md text-on-surface mb-md">Recent Applications</h2>
            <div className="space-y-sm">
              {applications.map(app => (
                <div key={app.id} className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                    <div>
                      <h3 className="font-headline-sm text-on-surface">{app.job_posts?.title || "Unknown Job"}</h3>
                      <p className="font-body-sm text-on-surface-variant flex items-center space-x-sm mt-1">
                        <span>Applied on {new Date(app.applied_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-md">
                      <span className={`px-3 py-1 rounded-full border font-label-sm uppercase tracking-wide flex items-center space-x-xs ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                        aria-label="View application details"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-primary/20 text-primary transition-colors"
                      >
                        <Icon name={expandedId === app.id ? "expand_less" : "visibility"} />
                      </button>
                    </div>
                  </div>

                  {expandedId === app.id && (
                    <div className="mt-md pt-md border-t border-outline-variant space-y-md">
                      <div className={`rounded-lg border px-sm py-sm ${getStatusColor(app.status)}`}>
                        <p className="font-body-sm text-body-sm">
                          {STATUS_MESSAGES[app.status] || "Your application status has been updated."}
                        </p>
                      </div>

                      <div>
                        <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-xs">Cover letter</p>
                        {app.cover_letter ? (
                          <p className="font-body-sm text-body-sm text-on-surface whitespace-pre-wrap">{app.cover_letter}</p>
                        ) : (
                          <p className="font-body-sm text-body-sm text-on-surface-variant italic">No cover letter submitted.</p>
                        )}
                      </div>

                      {Array.isArray(app.interviews) && app.interviews.length > 0 && (
                        <div>
                          <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-xs">Interview</p>
                          {app.interviews
                            .slice()
                            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                            .map((interview) => (
                              <div key={interview.id} className="rounded-lg border border-primary/20 bg-primary/5 p-sm mb-xs">
                                <div className="flex items-center justify-between gap-sm">
                                  <p className="font-label-md text-label-md text-on-surface flex items-center gap-xs">
                                    <Icon name="event" className="text-primary text-[18px]" />
                                    {new Date(interview.scheduled_at).toLocaleString()} ({interview.duration_minutes} mins)
                                  </p>
                                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 font-label-sm uppercase tracking-wide text-[11px]">
                                    {interview.status}
                                  </span>
                                </div>
                                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                                  <Icon name="location_on" className="text-[15px] align-middle" /> {interview.location || "No location set"}
                                </p>
                                {interview.meeting_link && (
                                  <a href={interview.meeting_link} target="_blank" rel="noreferrer"
                                    className="mt-xs inline-flex items-center gap-xs rounded-lg bg-primary px-3 py-1 font-label-sm text-label-sm text-on-primary hover:bg-secondary">
                                    <Icon name="videocam" className="text-[16px]" /> Join meeting
                                  </a>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {app.status === "interview" && (!Array.isArray(app.interviews) || app.interviews.length === 0) && (
                        <div>
                          <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-xs">Interview</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                            The employer is arranging your interview. Details will appear here once scheduled.
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-xs">Submitted documents</p>
                        <div className="flex flex-wrap gap-xs">
                          {app.resume_storage_path && (
                            <span className="inline-flex items-center gap-xs rounded-lg bg-surface-container-high px-3 py-1 font-label-sm text-label-sm text-on-surface">
                              <Icon name="description" className="text-[16px]" /> Resume attached
                            </span>
                          )}
                          {app.portfolio_url && (
                            <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary hover:bg-primary/15">
                              <Icon name="language" className="text-[16px]" /> Portfolio
                            </a>
                          )}
                          {app.github_url && (
                            <a href={app.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary hover:bg-primary/15">
                              <Icon name="code" className="text-[16px]" /> GitHub
                            </a>
                          )}
                          {!app.resume_storage_path && !app.portfolio_url && !app.github_url && (
                            <span className="font-body-sm text-body-sm text-on-surface-variant italic">No documents submitted.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-surface-container border border-outline-variant rounded-xl p-xl flex flex-col items-center text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-md text-on-surface-variant">
              <Icon name="assignment" className="text-[40px]" />
            </div>
            <h2 className="font-headline-md text-on-surface mb-xs">No Applications Yet</h2>
            <p className="font-body-md text-on-surface-variant max-w-md mb-md">
              You haven't applied to any jobs yet. Browse the Jobs board and start applying!
            </p>
            <Link to="/jobs" className="px-6 py-3 bg-primary text-on-primary font-label-md rounded-xl hover:bg-secondary transition-colors">
              Find Jobs
            </Link>
          </div>
        )}
      </main>
    </PageShell>
  );
}
