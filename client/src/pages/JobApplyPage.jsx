import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { applyForJob, uploadResume } from "../services/student/applicationApi.js";
import { useAuth } from "../state/AuthContext.jsx";

export function JobApplyPage() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { session, supabaseConnection } = useAuth();
  
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadJob() {
      if (!supabaseConnection?.configured) {
        setError("Supabase not configured");
        setIsLoading(false);
        return;
      }

      try {
        const result = await supabaseConnection.client.select("job_posts", { eq: { id: jobId } });
        if (result.error) {
          throw new Error(result.error.message);
        }
        if (!result.data) {
          throw new Error("Job not found or not active.");
        }
        setJob(result.data);
      } catch (err) {
        setError(err.message || "Failed to load job details.");
      } finally {
        setIsLoading(false);
      }
    }

    loadJob();
  }, [jobId, supabaseConnection]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let resumeStoragePath = "";
      if (resumeFile) {
        const uploadResult = await uploadResume(session.accessToken, resumeFile);
        if (!uploadResult.ok) {
          throw new Error(uploadResult.error || "Failed to upload resume");
        }
        resumeStoragePath = uploadResult.path;
      }

      const response = await applyForJob(session.accessToken, {
        job_id: jobId,
        cover_letter: coverLetter,
        resume_storage_path: resumeStoragePath,
        portfolio_url: portfolioUrl.trim(),
        github_url: githubUrl.trim(),
      });

      if (!response.ok) {
        throw new Error(response.error?.message || response.error || "Failed to submit application");
      }

      // Success!
      navigate("/home");
    } catch (err) {
      setError(err.message || "Failed to submit application");
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <main className="pt-20 pb-32 px-margin-mobile md:px-margin-desktop max-w-[800px] mx-auto">
        <button
          className="mb-md inline-flex items-center gap-xs font-label-md text-label-md text-primary hover:underline"
          onClick={() => navigate(-1)}
          type="button"
        >
          <Icon name="arrow_back" />
          Back
        </button>

        <section className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
          {isLoading ? (
            <div className="py-xl text-center font-body-md text-on-surface-variant">Loading job details...</div>
          ) : error ? (
            <div className="py-xl text-center">
              <Icon name="error" className="mb-sm text-[48px] text-error" />
              <p className="font-headline-sm text-headline-sm text-error">{error}</p>
            </div>
          ) : job ? (
            <>
              <div className="mb-lg border-b border-outline-variant pb-md">
                <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
                  Application
                </p>
                <h1 className="mt-xs font-headline-lg text-headline-lg text-on-surface">
                  Apply for {job.title}
                </h1>
                <div className="mt-sm flex flex-wrap gap-xs">
                  {job.location && (
                    <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                      <Icon name="location_on" className="text-[16px]" />
                      {job.location}
                    </span>
                  )}
                  {job.employment_type && (
                    <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                      <Icon name="work" className="text-[16px]" />
                      {job.employment_type}
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-md">
                <label className="block">
                  <span className="mb-xs block font-label-md text-label-md text-on-surface">Resume / CV (Optional)</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-sm font-body-md text-body-md text-on-surface shadow-sm outline-none file:mr-sm file:rounded-lg file:border-0 file:bg-primary file:px-md file:py-xs file:text-on-primary"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                    disabled={isSubmitting}
                  />
                  {resumeFile && (
                    <span className="mt-xs block font-label-sm text-label-sm text-on-surface-variant">Selected: {resumeFile.name}</span>
                  )}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <label className="block">
                    <span className="mb-xs block font-label-md text-label-md text-on-surface">Portfolio URL (Optional)</span>
                    <input
                      type="url"
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-sm font-body-md text-body-md text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="https://your-portfolio.com"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-xs block font-label-md text-label-md text-on-surface">GitHub URL (Optional)</span>
                    <input
                      type="url"
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-sm font-body-md text-body-md text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="https://github.com/username"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-xs block font-label-md text-label-md text-on-surface">Cover Letter (Optional)</span>
                  <textarea
                    className="h-48 w-full resize-y rounded-xl border border-outline-variant bg-surface-container-lowest p-sm font-body-md text-body-md text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Tell the employer why you are a great fit for this role..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    disabled={isSubmitting}
                  />
                </label>

                <div className="flex items-center justify-end">
                  <button
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-xl py-sm font-label-md text-label-md font-bold text-on-primary shadow-sm transition-all hover:bg-secondary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </section>
      </main>
    </PageShell>
  );
}
