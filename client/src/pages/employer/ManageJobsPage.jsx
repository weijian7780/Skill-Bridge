import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../../components/Icon.jsx";
import { useAuth } from "../../state/AuthContext.jsx";
import { useEmployerSubscription } from "../../state/useEmployerSubscription.js";
import { getEmployerJobs, deleteEmployerJob, updateEmployerJobStatus } from "../../services/employer/employerJobsApi.js";

export function ManageJobsPage() {
  const { session } = useAuth();
  const { active, availableCredits } = useEmployerSubscription();
  // Can post with an active subscription OR an unused pay-per-post credit.
  const canPost = active || availableCredits > 0;
  const postJobTarget = canPost ? "/employer/jobs/new" : "/employer/subscription";
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadJobs() {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const response = await getEmployerJobs(session.accessToken);
      setJobs(response.jobs || []);
    } catch (err) {
      setError("Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, [session]);

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this job post?")) return;
    try {
      await deleteEmployerJob(session.accessToken, id);
      setJobs(jobs.filter(j => j.id !== id));
    } catch (err) {
      alert("Failed to delete job post");
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await updateEmployerJobStatus(session.accessToken, id, newStatus);
      setJobs(jobs.map(j => (j.id === id ? { ...j, status: newStatus } : j)));
    } catch (err) {
      alert("Failed to update status");
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-md md:p-xl flex items-center justify-center">
        <p className="font-label-md text-label-md text-on-surface-variant">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-md md:p-xl overflow-y-auto">
      <div className="mb-lg flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">Manage Jobs</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">View and edit your job postings.</p>
        </div>
        <Link
          to={postJobTarget}
          className="flex items-center space-x-xs px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-secondary transition-all"
        >
          <Icon name={canPost ? "add" : "lock"} className="text-[18px]" />
          <span>{canPost ? "Post a Job" : "Subscribe to Post"}</span>
        </Link>
      </div>

      {error && (
        <div className="mb-md p-sm rounded-lg bg-error/10 text-error font-body-sm text-body-sm">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-surface-container border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center space-y-md text-center">
          <Icon name="work_outline" className="text-on-surface-variant text-[48px] opacity-50" />
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">No jobs posted yet</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Get started by creating your first job post.</p>
          </div>
          <Link
            to={postJobTarget}
            className="flex items-center space-x-xs px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-secondary transition-all"
          >
            <span>{canPost ? "Create Job Post" : "Subscribe to Post"}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md">
          {jobs.map(job => (
            <div key={job.id} className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col md:flex-row items-start md:items-center justify-between gap-md hover:border-primary transition-colors">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{job.title}</h3>
                <div className="flex items-center space-x-sm mt-xs">
                  <span className={`px-sm py-xs rounded-full font-label-sm text-label-sm ${
                    job.status === "active" ? "bg-green-500/20 text-green-700" :
                    job.status === "draft" ? "bg-surface-variant text-on-surface-variant" :
                    "bg-orange-500/20 text-orange-700"
                  }`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center space-x-xs">
                    <Icon name="location_on" className="text-[16px]" />
                    <span>{job.location || "Location not set"}</span>
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center space-x-xs">
                    <Icon name="work" className="text-[16px]" />
                    <span>{job.employment_type || "Type not set"}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-sm w-full md:w-auto">
                <select 
                  value={job.status}
                  onChange={(e) => handleStatusChange(job.id, e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-xs text-on-surface font-label-sm text-label-sm focus:outline-none focus:border-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
                <button 
                  onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                  className="p-sm text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg transition-colors"
                  aria-label="Edit job"
                >
                  <Icon name="edit" />
                </button>
                <button 
                  onClick={() => handleDelete(job.id)}
                  className="p-sm text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  aria-label="Delete job"
                >
                  <Icon name="delete" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
