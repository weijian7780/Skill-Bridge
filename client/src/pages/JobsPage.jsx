import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export function JobsPage() {
  const { supabaseConnection, session, config } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchJobs() {
      if (!supabaseConnection?.configured || !config) {
        setError("Supabase not configured");
        setIsLoading(false);
        return;
      }

      try {
        const url = new URL("/rest/v1/job_posts?status=eq.active", config.url);
        const response = await fetch(url.toString(), {
          headers: {
            apikey: config.publishableKey,
            Authorization: `Bearer ${session?.accessToken || config.publishableKey}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Error: ${response.status}`);
        }

        const jobsData = await response.json();
        const jobsList = Array.isArray(jobsData) ? jobsData : [];

        if (jobsList.length > 0) {
          const employerIds = [...new Set(jobsList.map((j) => j.employer_id))];
          const profilesUrl = new URL(`/rest/v1/employer_profiles?user_id=in.(${employerIds.join(",")})&select=user_id,company_name,company_logo_storage_path`, config.url);
          const profilesRes = await fetch(profilesUrl.toString(), {
            headers: {
              apikey: config.publishableKey,
              Authorization: `Bearer ${session?.accessToken || config.publishableKey}`,
              "Content-Type": "application/json"
            }
          });

          if (profilesRes.ok) {
            const profilesData = await profilesRes.json();
            const profileMap = {};
            for (const p of profilesData) {
              profileMap[p.user_id] = p;
            }
            for (const j of jobsList) {
              j.employer_profiles = profileMap[j.employer_id];
            }
          }
        }

        setJobs(jobsList);
      } catch (err) {
        setError(err.message || "Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, [config, session?.accessToken, supabaseConnection?.configured]);

  return (
    <PageShell>
      <main className="pt-20 pb-32 px-margin-mobile md:px-margin-desktop max-w-[1000px] mx-auto">
        <section className="mb-lg">
          <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Internal openings</p>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">SkillBridge openings</h1>
          <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
            Apply to active openings created directly by SkillBridge employers.
          </p>
        </section>

        {isLoading ? (
          <div className="py-xl text-center font-body-md text-on-surface-variant">Loading openings...</div>
        ) : error ? (
          <div className="py-xl text-center text-error font-body-md">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="bg-surface-container rounded-xl p-xl text-center border border-outline-variant">
            <Icon name="work_off" className="text-[48px] text-on-surface-variant mb-sm" />
            <h2 className="font-headline-md text-headline-md text-on-surface">No active openings</h2>
            <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
              There are currently no active openings on the platform. Check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-md">
            {jobs.map(job => (
              <article key={job.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm transition-all hover:border-primary/40 hover:shadow-md flex flex-col md:flex-row md:items-start md:justify-between gap-md">
                <div>
                  <div className="flex items-center gap-xs mb-xs">
                    {job.employer_profiles?.company_logo_storage_path ? (
                      <img src={job.employer_profiles.company_logo_storage_path} alt="Logo" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <Icon name="business" className="text-on-surface-variant text-[18px]" />
                    )}
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {job.employer_profiles?.company_name || "Company name unavailable"}
                    </p>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{job.title}</h3>
                  <div className="mt-xs flex flex-wrap gap-xs">
                    {job.location && (
                      <span className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant">
                        <Icon name="location_on" className="text-[16px]" />
                        {job.location}
                      </span>
                    )}
                    {job.employment_type && (
                      <span className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant">
                        <Icon name="work" className="text-[16px]" />
                        {job.employment_type}
                      </span>
                    )}
                  </div>
                  {job.required_skills?.length > 0 && (
                    <div className="mt-sm flex flex-wrap gap-xs">
                      {job.required_skills.slice(0, 5).map(skill => (
                        <span key={skill} className="skill-chip skill-chip-neutral">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-start md:items-end gap-sm shrink-0">
                  <Link 
                    to={`/jobs/${job.id}/apply`}
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-xl py-sm font-label-md text-label-md font-bold text-on-primary transition-all hover:bg-secondary active:scale-[0.98]"
                  >
                    Apply
                  </Link>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </PageShell>
  );
}
