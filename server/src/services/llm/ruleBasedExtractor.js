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
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Java",
  "C++",
  "Figma",
  "Adobe XD",
  "Sketch",
  "InVision",
  "Photoshop",
  "Illustrator",
  "User Research",
  "Prototyping",
  "Wireframing",
  "Communication",
  "Teamwork",
  "Project Management",
];

const softSkillTerms = ["Communication", "Teamwork", "Leadership", "Problem Solving", "Public Speaking"];

export function extractWithRules(cvText) {
  const text = String(cvText || "");
  const source = text.toLowerCase();

  const technicalSkills = skillTerms.filter((skill) => source.includes(skill.toLowerCase()));
  const softSkills = softSkillTerms.filter((skill) => source.includes(skill.toLowerCase()));

  return {
    technicalSkills: unique(technicalSkills),
    softSkills: unique(softSkills),
    education: extractEducation(text, source),
    certifications: extractCertifications(source),
    confidence: 0.45,
  };
}

function extractEducation(text, source) {
  const educationSection = extractSection(text, "education");
  if (educationSection) {
    return educationSection;
  }

  if (source.includes("computer science")) {
    return "Computer Science";
  }

  return "";
}

function extractSection(text, sectionName) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const startIndex = lines.findIndex((line) => normaliseHeading(line) === sectionName);
  if (startIndex < 0) {
    return "";
  }

  const sectionLines = [];
  for (const line of lines.slice(startIndex + 1)) {
    if (isSectionHeading(line)) {
      break;
    }
    sectionLines.push(cleanResumeLine(line));
  }

  return sectionLines.filter(Boolean).join("; ");
}

function isSectionHeading(line) {
  const heading = normaliseHeading(line);
  return [
    "profile",
    "profile summary",
    "summary",
    "contact",
    "contact information",
    "skills",
    "technical skills",
    "soft skills",
    "languages",
    "hobbies",
    "experience",
    "work experience",
    "certifications",
    "projects",
  ].includes(heading);
}

function normaliseHeading(line) {
  return String(line || "")
    .replace(/[:：]\s*$/, "")
    .trim()
    .toLowerCase();
}

function cleanResumeLine(line) {
  return String(line || "")
    .replace(/^[\-*•]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
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
