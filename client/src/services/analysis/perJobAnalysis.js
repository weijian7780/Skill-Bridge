export function extractJobSkills(job) {
  if (job.source === "skillbridge" || job.required_skills) {
    return normaliseSkills(job.required_skills);
  }

  const structuredSkills = [
    ...(job?.requirements?.hardSkills ?? []),
    ...(job?.requirements?.tools ?? []),
  ];

  return normaliseSkills(
    structuredSkills.length > 0 ? structuredSkills : job.extractedSkills || job.requiredSkills || []
  );
}

export function compareJobToCV({ jobSkills, cvSkills }) {
  const normalizedCvSkills = normaliseSkills(cvSkills);
  const normalizedJobSkills = normaliseSkills(jobSkills);

  if (normalizedJobSkills.length === 0) {
    return {
      matchScore: 0,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const matchedSkills = normalizedJobSkills.filter((skill) =>
    hasSkill(normalizedCvSkills, skill)
  );
  const missingSkills = normalizedJobSkills.filter(
    (skill) => !hasSkill(normalizedCvSkills, skill)
  );

  const matchScore = Math.round(
    (matchedSkills.length / normalizedJobSkills.length) * 100
  );

  return {
    matchScore,
    matchedSkills,
    missingSkills,
  };
}

export function buildPerJobAnalysis({ job, skillProfile }) {
  const cvSkills = [
    ...(skillProfile?.technicalSkills ?? []),
    ...(skillProfile?.softSkills ?? []),
    ...(skillProfile?.certifications ?? []),
  ];

  const jobSkills = extractJobSkills(job);

  if (jobSkills.length === 0) {
    return {
      status: "no_skills",
      matchScore: 0,
      matchedSkills: [],
      missingSkills: [],
      jobTitle: job.title || "Unknown role",
      jobCompany: job.company_name || job.company || "Unknown company",
      hasSkillData: false,
    };
  }

  const comparison = compareJobToCV({ jobSkills, cvSkills });

  return {
    status: "ready",
    ...comparison,
    jobTitle: job.title || "Unknown role",
    jobCompany: job.company_name || job.company || "Unknown company",
    hasSkillData: true,
  };
}

function hasSkill(cvSkills, requiredSkill) {
  const required = requiredSkill.toLowerCase();
  return cvSkills.some((skill) => skill.toLowerCase() === required);
}

function normaliseSkills(skills = []) {
  return unique(
    skills
      .map((skill) => String(skill || "").trim())
      .filter(Boolean)
      .map(toDisplaySkill)
  );
}

function toDisplaySkill(skill) {
  const canonical = {
    analytics: "Data Analytics",
    "data analysis": "Data Analytics",
    "data analytics": "Data Analytics",
    powerbi: "Power BI",
    "power bi": "Power BI",
    sql: "SQL",
    python: "Python",
    excel: "Excel",
    tableau: "Tableau",
    "business intelligence": "Business Intelligence",
    dashboard: "Dashboards",
    dashboards: "Dashboards",
    report: "Reporting",
    reports: "Reporting",
    reporting: "Reporting",
    "data warehouse": "Data Warehouse",
    "data warehousing": "Data Warehouse",
    edw: "Data Warehouse",
    aws: "AWS",
    "amazon web services": "AWS",
    azure: "Azure",
    "microsoft azure": "Azure",
    figma: "Figma",
    figjam: "FigJam",
    "fig jam": "FigJam",
    miro: "Miro",
    "google suite": "Google Suite",
    "google workspace": "Google Suite",
    "g suite": "Google Suite",
    slack: "Slack",
    "ui/ux principles": "UI/UX Principles",
    "ui ux principles": "UI/UX Principles",
    "ux principles": "UI/UX Principles",
    "ui/ux guidelines": "UI/UX Guidelines",
    "ui ux guidelines": "UI/UX Guidelines",
    "ux guidelines": "UI/UX Guidelines",
    "ui/ux best practices": "UI/UX Best Practices",
    "ui ux best practices": "UI/UX Best Practices",
    "ux best practices": "UI/UX Best Practices",
    wordpress: "WordPress",
    "word press": "WordPress",
    html: "HTML5",
    html5: "HTML5",
    "html 5": "HTML5",
    css: "CSS3",
    css3: "CSS3",
    "css 3": "CSS3",
    sketch: "Sketch",
    photoshop: "Photoshop",
    ftp: "FTP",
    jquery: "jQuery",
    "j query": "jQuery",
    react: "React",
    reactjs: "React",
    "react js": "React",
    angular: "Angular",
    angularjs: "Angular",
    "angular js": "Angular",
    bootstrap: "Bootstrap",
    "html/css component translation": "HTML/CSS Component Translation",
    "html css component translation": "HTML/CSS Component Translation",
    "web usability": "Web Usability",
    "web design": "Web Design",
    "web development principles": "Web Development Principles",
    "browser compatibility": "Browser Compatibility",
  };
  return canonical[skill.toLowerCase()] || skill;
}

function unique(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
