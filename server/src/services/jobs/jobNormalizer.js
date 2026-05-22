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
  const skillTerms = [
    ["SQL", ["sql"]],
    ["Power BI", ["power bi", "powerbi"]],
    ["Python", ["python"]],
    ["Excel", ["excel"]],
    ["Data Cleaning", ["data cleaning", "data cleansing"]],
    ["Tableau", ["tableau"]],
    ["Data Analytics", ["data analytics", "data analysis", "analytics"]],
    ["Business Intelligence", ["business intelligence", "bi analyst"]],
    ["Dashboards", ["dashboard", "dashboards"]],
    ["Reporting", ["reporting", "reports", "report "]],
    ["Data Warehouse", ["data warehouse", "data warehousing", "edw"]],
    ["AWS", ["aws", "amazon web services"]],
    ["Azure", ["azure", "microsoft azure"]],
    ["Figma", ["figma"]],
    ["Cloud Basics", ["cloud basics", "cloud practitioner", "cloud infrastructure"]],
  ];

  return skillTerms
    .filter(([, aliases]) => aliases.some((alias) => source.includes(alias)))
    .map(([skill]) => skill);
}
