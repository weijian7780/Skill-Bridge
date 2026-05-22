const skillTerms = [
  "Python",
  "Excel",
  "Data Cleaning",
  "SQL",
  "Power BI",
  "Tableau",
  "Pandas",
  "NumPy",
  "Machine Learning",
  "Data Visualization",
  "Statistics",
  "Cloud Basics",
  "AWS",
  "Azure",
  "Communication",
  "Teamwork",
  "Project Management",
];

const softSkillTerms = ["Communication", "Teamwork", "Leadership", "Problem Solving", "Public Speaking"];

export function extractWithRules(cvText) {
  const source = String(cvText || "").toLowerCase();

  const technicalSkills = skillTerms.filter((skill) => source.includes(skill.toLowerCase()));
  const softSkills = softSkillTerms.filter((skill) => source.includes(skill.toLowerCase()));

  return {
    technicalSkills: unique(technicalSkills),
    softSkills: unique(softSkills),
    education: source.includes("computer science") ? "UMS Year 3 Computer Science" : "",
    certifications: extractCertifications(source),
    confidence: 0.45,
  };
}

function extractCertifications(source) {
  const certifications = [];
  if (source.includes("google data analytics")) certifications.push("Google Data Analytics");
  if (source.includes("microsoft")) certifications.push("Microsoft certification mentioned");
  return certifications;
}

function unique(items) {
  return [...new Set(items)];
}
