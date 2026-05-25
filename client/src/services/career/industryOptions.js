export const industryOptions = [
  {
    id: "data-it",
    label: "Data / IT",
    terms: [
      "data",
      "analytics",
      "business intelligence",
      "software",
      "developer",
      "cloud",
      "database",
      "cybersecurity",
      "machine learning",
      "big data",
      "ui/ux",
      "ui ux",
      "user experience",
      "user interface",
      "product designer",
    ],
  },
  {
    id: "finance",
    label: "Finance",
    terms: [
      "finance",
      "financial",
      "banking",
      "accounting",
      "audit",
      "investment",
      "insurance",
      "fintech",
      "payment",
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    terms: [
      "marketing",
      "digital marketing",
      "campaign",
      "brand",
      "advertising",
      "seo",
      "content",
      "social media",
      "market research",
    ],
  },
  {
    id: "engineering",
    label: "Engineering",
    terms: [
      "engineering",
      "engineer",
      "mechanical",
      "electrical",
      "civil",
      "manufacturing",
      "construction",
      "cad",
      "maintenance",
    ],
  },
];

export function normaliseIndustryId(value) {
  return getIndustryOption(value).id;
}

export function getIndustryOption(value) {
  const normalized = normalizeText(value);
  return industryOptions.find((industry) =>
    normalizeText(industry.id) === normalized ||
    normalizeText(industry.label) === normalized
  ) || industryOptions[0];
}

export function getIndustrySearchValue(value) {
  return getIndustryOption(value).id;
}

export function jobMatchesIndustry(job, industryValue) {
  const industry = getIndustryOption(industryValue);
  const text = normalizeText([
    job?.title,
    job?.company,
    job?.location,
    job?.description,
    job?.requirements?.hardSkills?.join(" "),
    job?.requirements?.tools?.join(" "),
  ].filter(Boolean).join(" "));

  if (!text) {
    return false;
  }

  return industry.terms.some((term) => containsTerm(text, term));
}

function containsTerm(text, term) {
  const normalizedTerm = normalizeText(term);
  return ` ${text} `.includes(` ${normalizedTerm} `);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
