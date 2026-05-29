import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../../components/Icon.jsx";
import { useAuth } from "../../state/AuthContext.jsx";
import { getEmployerApplications } from "../../services/employer/employerApplicationsApi.js";

export function ApplicantsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");

  useEffect(() => {
    async function loadApplications() {
      if (!session?.accessToken) return;
      setIsLoading(true);
      try {
        const response = await getEmployerApplications(session.accessToken);
        setApplications(response.applications || []);
      } catch (err) {
        setError("Failed to load applicants");
      } finally {
        setIsLoading(false);
      }
    }
    loadApplications();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex-1 p-md md:p-xl flex items-center justify-center">
        <p className="font-label-md text-label-md text-on-surface-variant">Loading applicants...</p>
      </div>
    );
  }

  // Derive unique jobs for the filter dropdown
  const uniqueJobs = Array.from(new Set(applications.map(app => app.job_title)));

  // Filter applications
  const filteredApps = applications.filter(app => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (jobFilter !== "all" && app.job_title !== jobFilter) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-orange-500/20 text-orange-700";
      case "reviewed": return "bg-blue-500/20 text-blue-700";
      case "shortlisted": return "bg-purple-500/20 text-purple-700";
      case "interview": return "bg-teal-500/20 text-teal-700";
      case "hired": return "bg-green-500/20 text-green-700";
      case "rejected": return "bg-red-500/20 text-red-700";
      default: return "bg-surface-variant text-on-surface-variant";
    }
  };

  return (
    <div className="flex-1 p-md md:p-xl overflow-y-auto">
      <div className="mb-lg">
        <h1 className="font-headline-md text-headline-md text-on-surface">Applicants</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Review and manage candidates for your job postings.</p>
      </div>

      {error && (
        <div className="mb-md p-sm rounded-lg bg-error/10 text-error font-body-sm text-body-sm">
          {error}
        </div>
      )}

      {applications.length > 0 && (
        <div className="flex flex-wrap gap-sm mb-md">
          <select 
            value={jobFilter}
            onChange={e => setJobFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-xs text-on-surface font-label-sm focus:outline-none focus:border-primary"
          >
            <option value="all">All Jobs</option>
            {uniqueJobs.map(job => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-xs text-on-surface font-label-sm focus:outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {filteredApps.length === 0 ? (
        <div className="bg-surface-container border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center space-y-md text-center">
          <Icon name="group" className="text-on-surface-variant text-[48px] opacity-50" />
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">No applicants found</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              {applications.length === 0 ? "You haven't received any applications yet." : "No applications match your current filters."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="p-sm font-label-sm text-label-sm text-on-surface-variant">Candidate Email</th>
                  <th className="p-sm font-label-sm text-label-sm text-on-surface-variant">Job Title</th>
                  <th className="p-sm font-label-sm text-label-sm text-on-surface-variant">Applied Date</th>
                  <th className="p-sm font-label-sm text-label-sm text-on-surface-variant">Status</th>
                  <th className="p-sm font-label-sm text-label-sm text-on-surface-variant text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map(app => (
                  <tr key={app.id} className="border-b border-outline-variant/50 hover:bg-surface-container-high/50 transition-colors">
                    <td className="p-sm font-body-sm text-body-sm text-on-surface font-medium">
                      {app.student_email}
                    </td>
                    <td className="p-sm font-body-sm text-body-sm text-on-surface-variant">
                      {app.job_title}
                    </td>
                    <td className="p-sm font-body-sm text-body-sm text-on-surface-variant">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="p-sm">
                      <span className={`px-2 py-1 rounded-full font-label-sm text-[11px] font-bold tracking-wide uppercase ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-sm text-right">
                      <button 
                        onClick={() => navigate(`/employer/applicants/${app.id}`)}
                        className="text-primary hover:text-secondary font-label-sm text-label-sm px-3 py-1.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
