import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Icon } from "../../components/Icon.jsx";
import { useAuth } from "../../state/AuthContext.jsx";
import { getEmployerJob, createEmployerJob, updateEmployerJob } from "../../services/employer/employerJobsApi.js";

export function EditJobPostPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    employment_type: "full-time",
    job_type: "full-time",
    salary_min: "",
    salary_max: "",
    location: "",
    work_mode: "on-site",
    required_skills: "",
    description: "",
    responsibilities: "",
    requirements: "",
    status: "draft"
  });

  useEffect(() => {
    async function loadJob() {
      if (!isEditMode || !session?.accessToken) return;
      try {
        const response = await getEmployerJob(session.accessToken, id);
        if (response.job) {
          setFormData({
            ...response.job,
            salary_min: response.job.salary_min || "",
            salary_max: response.job.salary_max || "",
            required_skills: Array.isArray(response.job.required_skills) ? response.job.required_skills.join(", ") : "",
          });
        }
      } catch (err) {
        setError("Failed to load job post details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadJob();
  }, [id, isEditMode, session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const payload = {
        ...formData,
        salary_min: formData.salary_min ? parseInt(formData.salary_min, 10) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max, 10) : null,
        required_skills: formData.required_skills ? formData.required_skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      };

      if (isEditMode) {
        await updateEmployerJob(session.accessToken, id, payload);
      } else {
        await createEmployerJob(session.accessToken, payload);
      }
      navigate("/employer/jobs");
    } catch (err) {
      setError(`Failed to save job post: ${err.message}`);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-md md:p-xl flex items-center justify-center">
        <p className="font-label-md text-label-md text-on-surface-variant">Loading job details...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-md md:p-xl overflow-y-auto max-w-5xl">
      <div className="mb-lg flex items-center space-x-md">
        <Link to="/employer/jobs" className="p-sm rounded-lg hover:bg-surface-variant text-on-surface-variant transition-colors">
          <Icon name="arrow_back" />
        </Link>
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">
            {isEditMode ? "Edit Job Post" : "Create Job Post"}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {isEditMode ? "Update the details of your job posting." : "Fill out the details to post a new job."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container border border-outline-variant rounded-xl p-md md:p-lg flex flex-col space-y-lg shadow-sm">
        {error && (
          <div className="p-sm rounded-lg font-body-sm text-body-sm bg-error/10 text-error">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs md:col-span-2">
            <label className="font-label-md text-label-md text-on-surface-variant">Job Title *</label>
            <input 
              required name="title" value={formData.title} onChange={handleChange}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Category</label>
            <input 
              name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Software Development"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Location</label>
            <input 
              name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Kuala Lumpur"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Employment Type</label>
            <select name="employment_type" value={formData.employment_type} onChange={handleChange} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors">
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Job Type</label>
            <select name="job_type" value={formData.job_type} onChange={handleChange} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors">
              <option value="full-time">Full-time</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Work Mode</label>
            <select name="work_mode" value={formData.work_mode} onChange={handleChange} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors">
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Salary Min (RM)</label>
            <input 
              type="number" name="salary_min" value={formData.salary_min} onChange={handleChange}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Salary Max (RM)</label>
            <input 
              type="number" name="salary_max" value={formData.salary_max} onChange={handleChange}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-md border-t border-outline-variant pt-lg">
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Required Skills (comma separated)</label>
            <input 
              name="required_skills" value={formData.required_skills} onChange={handleChange} placeholder="e.g. React, Node.js, TypeScript"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Description</label>
            <textarea 
              rows={4} name="description" value={formData.description} onChange={handleChange}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-y"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Responsibilities</label>
            <textarea 
              rows={4} name="responsibilities" value={formData.responsibilities} onChange={handleChange}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-y"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Requirements</label>
            <textarea 
              rows={4} name="requirements" value={formData.requirements} onChange={handleChange}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-y"
            />
          </div>
        </div>

        <div className="pt-md flex justify-end space-x-sm">
          <Link 
            to="/employer/jobs"
            className="px-md py-sm bg-transparent text-on-surface-variant hover:bg-surface-variant font-label-md text-label-md rounded-lg transition-all"
          >
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center space-x-xs px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-secondary transition-all disabled:opacity-50"
          >
            <Icon name="save" className="text-[18px]" />
            <span>{isSaving ? "Saving..." : "Save Job Post"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
