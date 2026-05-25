import { resourcesForSkill } from "./roadmapResources.js";

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
      const learningFocus = buildLearningFocus(skill);
      const portfolioOutput = buildPortfolioOutput({ skill, role });

      return {
        month,
        skill,
        title: `Build ${skill} evidence`,
        learningFocus,
        portfolioOutput,
        resources: resourcesForSkill(skill, role),
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

function buildLearningFocus(skill) {
  const focus = {
    "Power BI": [
      "Power Query data cleaning",
      "Data modelling relationships",
      "DAX measures",
      "Dashboard storytelling",
    ],
    Tableau: [
      "Data connection basics",
      "Calculated fields",
      "Interactive dashboards",
      "Insight annotation",
    ],
    AWS: [
      "Cloud storage basics",
      "IAM fundamentals",
      "Managed analytics services",
      "Deployment cost awareness",
    ],
    Azure: [
      "Azure fundamentals",
      "Storage and compute basics",
      "Data service overview",
      "Cloud security basics",
    ],
    "Data Warehouse": [
      "Fact and dimension tables",
      "ETL flow design",
      "Star schema basics",
      "Reporting-ready data models",
    ],
    FigJam: [
      "Workshop board structure",
      "User-flow mapping",
      "Ideation templates",
      "Design collaboration notes",
    ],
    Miro: [
      "Collaborative whiteboarding",
      "Customer journey mapping",
      "Workshop facilitation",
      "Design handoff boards",
    ],
    Slack: [
      "Team communication workflow",
      "Channel etiquette",
      "Async update writing",
      "Stakeholder follow-up",
    ],
    "Google Suite": [
      "Docs collaboration",
      "Sheets tracking",
      "Slides reporting",
      "Drive file organization",
    ],
    "UI/UX Principles": [
      "Usability heuristics",
      "Interaction design basics",
      "Accessibility awareness",
      "User-centered design decisions",
    ],
    "UI/UX Guidelines": [
      "Design-system rules",
      "Mobile layout conventions",
      "Accessibility guidelines",
      "Component consistency",
    ],
    "UI/UX Best Practices": [
      "Research-backed design decisions",
      "Prototype testing",
      "Clear information hierarchy",
      "Design critique iteration",
    ],
  };

  return focus[skill] ?? [
    `${skill} core concepts`,
    `${skill} applied workflow`,
    `${skill} portfolio evidence`,
  ];
}

function buildSuccessCriteria({ skill, role }) {
  return `A CV-ready ${skill} artifact that proves you can apply this skill in ${role} work.`;
}

function buildPortfolioOutput({ skill, role }) {
  const outputs = {
    "Power BI": "A Power BI dashboard case study with screenshots, DAX notes, and three business insights.",
    Tableau: "A Tableau dashboard case study with interactive views and a short insight summary.",
    AWS: "A simple cloud analytics architecture diagram plus notes explaining the AWS services used.",
    Azure: "A simple Azure data workflow diagram plus notes explaining storage, compute, and security choices.",
    "Data Warehouse": "A warehouse schema diagram with sample fact/dimension tables and reporting use cases.",
    FigJam: "A FigJam workshop board showing user journey, ideas, and prioritised design decisions.",
    Miro: "A Miro collaboration board showing a journey map, pain points, and proposed design actions.",
    Slack: "A stakeholder communication playbook with sample channel updates and decision summaries.",
    "Google Suite": "A project workspace containing a planning sheet, short report, and presentation summary.",
  };

  return outputs[skill] ?? `A ${skill} portfolio project that proves practical use for ${role} roles.`;
}
