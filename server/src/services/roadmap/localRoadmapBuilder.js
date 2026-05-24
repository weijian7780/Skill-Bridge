export function buildLocalRoadmap({ careerTarget, analysis }) {
  const missingSkills = analysis?.missingSkills ?? [];
  const skillDemand = analysis?.marketEvidence?.skillDemand ?? {};
  const jobMatches = analysis?.marketEvidence?.jobMatches ?? [];
  const role = careerTarget?.role || "target role";

  return {
    overview: `Roadmap generated from deterministic gaps for ${role}.`,
    items: missingSkills.map((skill, index) => {
      const companyEvidence = companiesForSkill(jobMatches, skill);
      const demandCount = skillDemand[skill] ?? companyEvidence.length;
      const month = index + 1;
      const what = buildWhat({ skill, role });
      const why = buildWhy({ skill, demandCount, companyEvidence });
      const when = `Month ${month}: ${index === 0 ? "start immediately" : `after completing ${missingSkills[index - 1]}`}`;
      const howToStart = buildHowToStart({ skill, role });
      const successCriteria = buildSuccessCriteria({ skill, role });

      return {
        month,
        skill,
        title: `Build ${skill} evidence`,
        what,
        why,
        when,
        howToStart,
        successCriteria,
        objective: what,
        description: what,
        reason: why,
        deliverable: successCriteria,
        resource: `${skill} for ${role} beginner project`,
        tasks: howToStart,
        companyEvidence,
      };
    }),
    assumptions: [
      "Missing skills come from deterministic CV-vs-company requirement comparison.",
      "Roadmap order follows repeated demand across selected job posts.",
    ],
    confidence: missingSkills.length > 0 ? 0.74 : 1,
    source: "local-rules",
  };
}

function companiesForSkill(jobMatches, skill) {
  return [
    ...new Set(
      jobMatches
        .filter((job) => (job.missingSkills ?? []).includes(skill))
        .map((job) => String(job.company || "").trim())
        .filter(Boolean),
    ),
  ].slice(0, 5);
}

function buildWhat({ skill, role }) {
  const templates = {
    "Power BI": `Build a Power BI dashboard that answers one ${role} business question with clear measures and filters.`,
    SQL: `Write SQL queries that clean, join, aggregate, and explain a small business dataset for ${role} work.`,
    Reporting: `Create a weekly KPI report that turns raw data into decisions for a ${role} stakeholder.`,
    "Business Intelligence": `Build a business intelligence summary that connects metrics, trends, and actions for ${role} roles.`,
    "Data Analytics": `Analyze one dataset end-to-end and explain the insight, method, and business recommendation.`,
    "Data Warehouse": "Map a simple data warehouse flow from raw source data into reporting-ready tables.",
  };

  return templates[skill] ?? `Build a practical ${skill} portfolio artifact for ${role} roles.`;
}

function buildWhy({ skill, demandCount, companyEvidence }) {
  const companyText = companyEvidence.length > 0
    ? ` Companies include ${companyEvidence.slice(0, 3).join(", ")}.`
    : "";
  return `${skill} appears in ${demandCount} matching ${demandCount === 1 ? "job" : "jobs"} from the selected company evidence.${companyText}`;
}

function buildHowToStart({ skill, role }) {
  const starters = {
    "Power BI": [
      "Follow one beginner Power BI tutorial using a small CSV dataset.",
      "Rebuild one dashboard from a real job-relevant business question.",
      "Add screenshots and three insights to your CV or portfolio.",
    ],
    SQL: [
      "Practice SELECT, JOIN, GROUP BY, and window functions on one public dataset.",
      "Write five queries that answer business questions for the target role.",
      "Save the queries and explanations as a portfolio case study.",
    ],
    Reporting: [
      "Choose one recurring metric set such as sales, support, or student activity.",
      "Create a one-page report with trend, variance, and recommendation sections.",
      "Write a short explanation of what decision the report supports.",
    ],
    "Business Intelligence": [
      "Define three business questions from the selected company job posts.",
      "Connect each question to a metric, dimension, and recommended action.",
      "Package the result as a BI case study with screenshots.",
    ],
    "Data Analytics": [
      "Pick one clean dataset related to the target industry.",
      "Run basic exploration, segmentation, and trend analysis.",
      "Write the conclusion as a short business recommendation.",
    ],
    "Data Warehouse": [
      "Sketch the source, staging, warehouse, and dashboard layers.",
      "Create sample fact and dimension tables for one dataset.",
      "Explain how the model supports reporting requirements.",
    ],
  };

  return starters[skill] ?? [
    `Learn the core ${skill} workflow from one beginner resource.`,
    `Build one ${role} portfolio example using ${skill}.`,
    "Add the outcome, screenshots, and result summary to your CV.",
  ];
}

function buildSuccessCriteria({ skill, role }) {
  return `A CV-ready ${skill} artifact that proves you can apply this skill in ${role} work.`;
}
