const roadmapLibrary = {
  "SQL Optimization": {
    title: "SQL Optimization",
    description: "Practice joins, indexing basics, query plans, and analytical SQL patterns.",
    resource: "SQL for Data Analysts",
  },
  "Power BI": {
    title: "Power BI Dashboards",
    description: "Build dashboards, measures, and simple DAX reports for business questions.",
    resource: "Microsoft Learn Power BI",
  },
  "Cloud Basics": {
    title: "Cloud Basics",
    description: "Learn cloud storage, compute basics, and managed analytics concepts.",
    resource: "Cloud fundamentals for data roles",
  },
};

export function buildRoadmap(missingSkills) {
  const skills = missingSkills.length > 0 ? missingSkills : ["SQL Optimization", "Power BI"];

  return skills.map((skill, index) => ({
    month: index + 1,
    status: index === 0 ? "In Progress" : "Not Started",
    ...(roadmapLibrary[skill] || {
      title: skill,
      description: `Build applied knowledge in ${skill}.`,
      resource: `${skill} starter resource`,
    }),
  }));
}
