export function normalizeCareerjetJob(job) {
  const description = stripHtml(job.description || "");

  return {
    id: job.url || `${job.title}-${job.company}-${job.location}`,
    title: job.title || "Untitled role",
    company: job.company || "Unknown company",
    location: job.location || "Malaysia",
    salary: job.salary || "",
    description,
    url: job.url,
    source: "Careerjet",
    extractedSkills: extractJobSkills(`${job.title || ""} ${description}`),
  };
}

export function normalizeJoobleJob(job) {
  const description = stripHtml(job.snippet || job.description || "");
  const title = job.title || "Untitled role";
  const company = job.company || "Unknown company";
  const location = job.location || "Malaysia";

  return {
    id: String(job.id || job.link || `${title}-${company}-${location}`),
    title,
    company,
    location,
    salary: job.salary || "",
    description,
    url: job.link,
    source: "Jooble",
    jobType: job.type || "",
    postedAt: job.updated || "",
    extractedSkills: extractJobSkills(`${title} ${description}`),
  };
}

export function stripHtml(value) {
  return String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function extractJobSkills(text) {
  const source = String(text).toLowerCase();
  const terms = ["SQL", "Power BI", "Python", "Excel", "Data Cleaning", "Tableau", "Cloud Basics"];
  return terms.filter((term) => source.includes(term.toLowerCase()));
}
