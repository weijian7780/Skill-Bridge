import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { getEmployerStats } from "../services/employer/employerStatsApi.js";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6b6b'];

export function EmployerDashboardPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      if (!session?.accessToken) return;
      setError("");
      try {
        const res = await getEmployerStats(session.accessToken);
        if (res.stats) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error("Failed to load stats", err);
        setError("Couldn't load your dashboard stats. Please refresh to try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen p-md flex items-center justify-center text-on-surface-variant">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-[960px] mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        {/* Header */}
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Welcome to your Employer Dashboard
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Manage your job postings and find the right talent.
          </p>
        </div>

        {error && (
          <div className="mb-md p-sm rounded-lg bg-error/10 text-error font-body-sm text-body-sm">
            {error}
          </div>
        )}

        {/* Top KPI Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
            <div className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col shadow-sm">
              <span className="text-on-surface-variant font-label-md mb-xs flex items-center gap-xs">
                <Icon name="work" className="text-[18px]" /> Total Jobs
              </span>
              <span className="text-headline-lg font-bold text-on-surface">{stats.totalJobs}</span>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col shadow-sm">
              <span className="text-on-surface-variant font-label-md mb-xs flex items-center gap-xs">
                <Icon name="check_circle" className="text-[18px]" /> Active Jobs
              </span>
              <span className="text-headline-lg font-bold text-primary">{stats.activeJobs}</span>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col shadow-sm">
              <span className="text-on-surface-variant font-label-md mb-xs flex items-center gap-xs">
                <Icon name="group" className="text-[18px]" /> Total Applicants
              </span>
              <span className="text-headline-lg font-bold text-on-surface">{stats.totalApplications}</span>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {stats && stats.totalJobs > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-lg">
            
            {/* Applications Over Time */}
            <div className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm h-80 flex flex-col">
              <h3 className="font-headline-sm text-on-surface mb-md">Applications (Last 7 Days)</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.appsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(tick) => tick.substring(5)} stroke="#94a3b8" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                    <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm h-80 flex flex-col">
              <h3 className="font-headline-sm text-on-surface mb-md">Applicant Status</h3>
              <div className="flex-1 w-full min-h-0">
                {stats.statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-on-surface-variant text-body-md">
                    No applicant data yet
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-lg">
          <Link
            to="/employer/jobs/new"
            className="group bg-primary text-on-primary rounded-xl p-md flex items-center space-x-md shadow-lg hover:bg-secondary transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-full bg-on-primary/15 grid place-items-center shrink-0">
              <Icon name="add_circle" className="text-on-primary text-[28px]" />
            </div>
            <div>
              <p className="font-label-md text-label-md">Post a Job</p>
              <p className="font-body-sm text-body-sm opacity-80">Create an internship or job listing</p>
            </div>
          </Link>

          <Link
            to="/employer/profile"
            className="group bg-surface-container border border-outline-variant rounded-xl p-md flex items-center space-x-md shadow-sm hover:border-primary transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 grid place-items-center shrink-0">
              <Icon name="domain" className="text-primary text-[28px]" />
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface">Complete Your Profile</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Add company details and branding</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
