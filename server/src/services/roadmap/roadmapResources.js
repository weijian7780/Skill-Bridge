const resourceCatalog = {
  "power bi": [
    {
      label: "Microsoft Learn Power BI",
      url: "https://learn.microsoft.com/power-bi/",
    },
    {
      label: "Power BI Guided Learning",
      url: "https://learn.microsoft.com/power-bi/guided-learning/",
    },
  ],
  tableau: [
    {
      label: "Tableau Free Training Videos",
      url: "https://www.tableau.com/learn/training",
    },
  ],
  aws: [
    {
      label: "AWS Skill Builder",
      url: "https://skillbuilder.aws/",
    },
  ],
  azure: [
    {
      label: "Microsoft Learn Azure",
      url: "https://learn.microsoft.com/azure/",
    },
  ],
  "data warehouse": [
    {
      label: "Microsoft Learn Data Warehousing",
      url: "https://learn.microsoft.com/fabric/data-warehouse/",
    },
  ],
  figma: [
    {
      label: "Figma Learn",
      url: "https://www.figma.com/learn/",
    },
  ],
  figjam: [
    {
      label: "FigJam Learn",
      url: "https://help.figma.com/hc/en-us/categories/1500000420441-FigJam",
    },
  ],
  miro: [
    {
      label: "Miro Academy",
      url: "https://academy.miro.com/",
    },
  ],
  slack: [
    {
      label: "Slack Help Center",
      url: "https://slack.com/help",
    },
  ],
  "google suite": [
    {
      label: "Google Workspace Learning Center",
      url: "https://support.google.com/a/users/",
    },
  ],
  "ui/ux principles": [
    {
      label: "Nielsen Norman Group UX Basics",
      url: "https://www.nngroup.com/articles/definition-user-experience/",
    },
  ],
  "ui/ux guidelines": [
    {
      label: "Material Design Guidelines",
      url: "https://m3.material.io/",
    },
  ],
  "ui/ux best practices": [
    {
      label: "Nielsen Norman Group Articles",
      url: "https://www.nngroup.com/articles/",
    },
  ],
};

export function resourcesForSkill(skill, role = "") {
  const curated = resourceCatalog[normalizeSkill(skill)];
  if (curated) {
    return curated;
  }

  const query = new URLSearchParams({
    q: `${skill} ${role} beginner project`.trim(),
  });

  return [
    {
      label: `${skill} beginner project search`,
      url: `https://www.google.com/search?${query.toString()}`,
    },
  ];
}

export function addResourcesToRoadmapItems(items = [], careerTarget = {}) {
  return items.map((item) => ({
    ...item,
    resources: normalizeResources(item.resources).length > 0
      ? normalizeResources(item.resources)
      : resourcesForSkill(item.skill || item.title || "career skill", careerTarget.role),
  }));
}

function normalizeResources(resources) {
  if (!Array.isArray(resources)) {
    return [];
  }

  return resources
    .map((resource) => ({
      label: String(resource?.label || "").trim(),
      url: String(resource?.url || "").trim(),
    }))
    .filter((resource) => resource.label && isHttpUrl(resource.url));
}

function normalizeSkill(skill) {
  return String(skill || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}
