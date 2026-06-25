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
  "Project Management",
];

const softSkillTerms = ["Communication", "Teamwork", "Leadership", "Problem Solving", "Public Speaking"];

export function extractWithRules(cvText) {
  const text = String(cvText || "");
  const source = text.toLowerCase();

  // Prefer what the CV actually lists under its Skills headings. This reads any
  // skill the candidate wrote (not just a fixed keyword list) and, because it
  // only reads the Skills sections, it won't mistake coursework or job-history
  // words for skills. A single generic "Skills" section feeds the technical
  // bucket and is split by known soft terms below.
  let technicalCandidates = readSkillSection(text, ["technical skills"]);
  if (technicalCandidates.length === 0) {
    technicalCandidates = readSkillSection(text, ["skills"]);
  }
  let softSkills = readSkillSection(text, ["soft skills"]);

  // A known soft skill is always classified as soft, even if the CV listed it
  // under a technical heading — so nothing appears in both buckets.
  const softFromTechnical = technicalCandidates.filter((item) => isSoftSkill(item));
  let technicalSkills = technicalCandidates.filter((item) => !isSoftSkill(item));
  if (softFromTechnical.length > 0) {
    softSkills = unique([...softSkills, ...softFromTechnical]);
  }

  // Keyword scan is the last resort for CVs with no recognisable Skills section.
  if (technicalSkills.length === 0) {
    technicalSkills = skillTerms.filter((skill) => source.includes(skill.toLowerCase()));
  }
  if (softSkills.length === 0) {
    softSkills = softSkillTerms.filter((skill) => source.includes(skill.toLowerCase()));
  }

  return {
    technicalSkills: unique(technicalSkills),
    softSkills: unique(softSkills),
    education: extractEducation(text, source),
    certifications: extractCertifications(source),
    confidence: 0.45,
  };
}

// Reads the items a CV lists under a Skills heading, supporting both a
// standalone heading followed by lines/bullets, and an inline
// "Heading: item, item, item" line. Returns [] when no such section exists.
function readSkillSection(text, headings) {
  for (const heading of headings) {
    const section = extractSection(text, heading);
    if (section) {
      const items = splitSkillItems(section);
      if (items.length > 0) {
        return items;
      }
    }
  }

  for (const line of String(text || "").split(/\r?\n/)) {
    const match = line.match(/^([a-z][a-z ]+):\s*(.+)$/i);
    if (match && headings.includes(match[1].trim().toLowerCase())) {
      const items = splitSkillItems(match[2]);
      if (items.length > 0) {
        return items;
      }
    }
  }

  return [];
}

function splitSkillItems(raw) {
  return unique(
    String(raw || "")
      .split(/[;,\n•|]+/)
      .map((item) => item.replace(/^[-*•]\s*/, "").replace(/[.\s]+$/, "").trim())
      .filter((item) => item.length > 1 && item.length <= 40),
  );
}

function isSoftSkill(item) {
  const lower = item.toLowerCase();
  return softSkillTerms.some((term) => lower.includes(term.toLowerCase()));
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
