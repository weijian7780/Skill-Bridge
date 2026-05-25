const industryProfiles = [
  {
    id: "data-it",
    labels: ["data-it", "data / it", "data it"],
    keywords: ["data", "analytics", "software", "cloud", "database", "IT"],
  },
  {
    id: "finance",
    labels: ["finance"],
    keywords: ["finance", "banking", "accounting", "fintech", "financial"],
  },
  {
    id: "marketing",
    labels: ["marketing"],
    keywords: ["marketing", "campaign", "brand", "advertising", "digital marketing"],
  },
  {
    id: "engineering",
    labels: ["engineering"],
    keywords: ["engineering", "engineer", "mechanical", "electrical", "manufacturing"],
  },
];

export function buildIndustryAwareKeywords({ role = "", industry = "" }) {
  const baseRole = String(role || "").trim();
  const profile = getIndustryProfile(industry);
  if (!profile) {
    return baseRole;
  }

  return unique([baseRole, ...profile.keywords])
    .filter(Boolean)
    .join(" ");
}

function getIndustryProfile(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  return industryProfiles.find((profile) =>
    profile.labels.some((label) => normalizeText(label) === normalized)
  ) || null;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeText(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
