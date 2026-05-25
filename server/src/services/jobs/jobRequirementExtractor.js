import { createGeminiChatCompletion } from "../llm/geminiClient.js";
import { parseJsonResponse } from "../llm/skillExtractionPrompt.js";
import { extractJobSkills, stripHtml } from "./jobNormalizer.js";

const GEMINI_JOB_REQUIREMENT_MODEL = "gemini-3.1-flash-lite";
const PARTIAL_DESCRIPTION_LENGTH = 280;
const BATCH_JOB_TEXT_LIMIT = 12000;

const toolNames = new Set([
  "AWS",
  "Azure",
  "Elasticsearch",
  "Excel",
  "Figma",
  "FigJam",
  "Flume",
  "Google Suite",
  "Hadoop",
  "HBase",
  "HCatalog",
  "HDFS",
  "Hive",
  "InVision",
  "Java",
  "Kafka",
  "Linux",
  "Miro",
  "Oozie",
  "Photoshop",
  "Power BI",
  "Presto",
  "Python",
  "R",
  "Slack",
  "Solr",
  "Spark SQL",
  "SQL",
  "Sqoop",
  "Tableau",
  "Zookeeper",
]);

export async function extractJobRequirementProfile(job) {
  const [profile] = await extractJobRequirementProfiles([job]);
  return profile;
}

export async function extractJobRequirementProfiles(jobs = []) {
  const sourceTexts = jobs.map(getBestJobDescription);
  const fallbacks = jobs.map((job, index) => buildFallbackRequirementProfile(job, sourceTexts[index]));
  const jobsWithText = jobs
    .map((job, index) => ({ job, index, sourceText: sourceTexts[index] }))
    .filter(({ sourceText }) => sourceText.text);

  if (!process.env.GEMINI_API_KEY || jobsWithText.length === 0) {
    return fallbacks;
  }

  try {
    const content = await createGeminiChatCompletion({
      model: process.env.GEMINI_JOB_REQUIREMENT_MODEL || process.env.GEMINI_MODEL || GEMINI_JOB_REQUIREMENT_MODEL,
      messages: [
        {
          role: "user",
          content: buildBatchJobRequirementPrompt(jobsWithText),
        },
      ],
      maxTokens: 3000,
    });

    const parsedProfiles = parseBatchRequirementResponse(parseJsonResponse(content), jobsWithText);
    return fallbacks.map((fallback, index) => {
      const parsedProfile = parsedProfiles.get(getRequirementJobId(jobs[index], index));
      if (!parsedProfile) {
        return fallback;
      }

      return withRequirementDefaults(parsedProfile, {
        sourceText: sourceTexts[index],
        extractor: "Gemini",
      });
    });
  } catch (error) {
    return fallbacks.map((fallback) => ({
      ...fallback,
      extractor: "Local rule fallback",
      warnings: [`Gemini job requirement extraction failed: ${error.message}`],
    }));
  }
}

export function getBestJobDescription(job) {
  const fullDescription = stripHtml(job.description || job.fullDescription || job.jobDescription || "");
  const snippet = stripHtml(job.snippet || "");
  const text = fullDescription || snippet;
  const source = fullDescription ? "description" : "snippet";

  return {
    text,
    source,
    partialRequirements: source !== "description" || text.length < PARTIAL_DESCRIPTION_LENGTH,
  };
}

export function buildJobRequirementPrompt({
  title = "",
  company = "",
  location = "",
  text = "",
  partialRequirements = false,
}) {
  return [
    "Extract structured job requirements for SkillBridge.",
    "Return valid JSON only. No markdown, explanation, or code fences.",
    "",
    "Rules:",
    "- hardSkills: required technical concepts, methods, frameworks, domains, and practices.",
    "- tools: software, platforms, programming languages, libraries, databases, operating systems, and named products.",
    "- softSkills: interpersonal or work-style requirements only.",
    "- Do not put certifications into hardSkills or tools. SkillBridge V1 does not use certifications for gap scoring.",
    "- Preserve exact tool names when visible.",
    "- Do not invent requirements not supported by the job text.",
    "- If the text is short or incomplete, still extract visible requirements and keep partialRequirements true.",
    "",
    "Schema:",
    "{",
    '  "hardSkills": string[],',
    '  "tools": string[],',
    '  "softSkills": string[],',
    '  "education": string,',
    '  "experience": string,',
    '  "partialRequirements": boolean,',
    '  "confidence": number',
    "}",
    "",
    `Job title: ${title || "Unknown"}`,
    `Company: ${company || "Unknown"}`,
    `Location: ${location || "Unknown"}`,
    `Input is partial: ${partialRequirements ? "true" : "false"}`,
    "",
    "Job text:",
    text.slice(0, 18000),
  ].join("\n");
}

export function buildBatchJobRequirementPrompt(jobsWithText = []) {
  const jobs = jobsWithText.map(({ job, index, sourceText }) => ({
    id: getRequirementJobId(job, index),
    title: job.title || "Unknown",
    company: job.company || "Unknown",
    location: job.location || "Unknown",
    partialRequirements: sourceText.partialRequirements,
    text: sourceText.text.slice(0, BATCH_JOB_TEXT_LIMIT),
  }));

  return [
    "Extract structured job requirements for SkillBridge from this Jooble result page.",
    "Return valid JSON only. No markdown, explanation, or code fences.",
    "",
    "Rules:",
    "- Return one result for every input job id.",
    "- hardSkills: required technical concepts, methods, frameworks, domains, and practices.",
    "- tools: software, platforms, programming languages, libraries, databases, operating systems, and named products.",
    "- softSkills: interpersonal or work-style requirements only.",
    "- Do not put certifications into hardSkills or tools. SkillBridge V1 does not use certifications for gap scoring.",
    "- Preserve exact tool names when visible.",
    "- Do not invent requirements not supported by the job text.",
    "- If the text is short or incomplete, still extract visible requirements and keep partialRequirements true.",
    "",
    "Schema:",
    "{",
    '  "jobs": [',
    "    {",
    '      "id": string,',
    '      "hardSkills": string[],',
    '      "tools": string[],',
    '      "softSkills": string[],',
    '      "education": string,',
    '      "experience": string,',
    '      "partialRequirements": boolean,',
    '      "confidence": number',
    "    }",
    "  ]",
    "}",
    "",
    "Jobs:",
    JSON.stringify(jobs, null, 2),
  ].join("\n");
}

export function buildFallbackRequirementProfile(job, sourceText = getBestJobDescription(job)) {
  const skills = extractJobSkills(`${job.title || ""} ${sourceText.text}`);
  const tools = skills.filter((skill) => toolNames.has(skill));
  const hardSkills = skills.filter((skill) => !toolNames.has(skill));

  return {
    hardSkills,
    tools,
    scoredSkills: skills,
    softSkills: [],
    education: "",
    experience: "",
    partialRequirements: sourceText.partialRequirements,
    sourceText: sourceText.source,
    extractor: "Local rule fallback",
    confidence: sourceText.partialRequirements ? 0.45 : 0.58,
    warnings: [],
  };
}

function withRequirementDefaults(profile, { sourceText, extractor }) {
  const safeProfile = profile && typeof profile === "object" ? profile : {};
  const hardSkills = toList(safeProfile.hardSkills);
  const tools = toList(safeProfile.tools);

  return {
    hardSkills: unique(hardSkills),
    tools: unique(tools),
    scoredSkills: unique([...hardSkills, ...tools]),
    softSkills: unique(toList(safeProfile.softSkills)),
    education: typeof safeProfile.education === "string" ? safeProfile.education.trim() : "",
    experience: typeof safeProfile.experience === "string" ? safeProfile.experience.trim() : "",
    partialRequirements: typeof safeProfile.partialRequirements === "boolean"
      ? safeProfile.partialRequirements || sourceText.partialRequirements
      : sourceText.partialRequirements,
    sourceText: sourceText.source,
    extractor,
    confidence: Number.isFinite(safeProfile.confidence) ? safeProfile.confidence : 0.65,
    warnings: [],
  };
}

function parseBatchRequirementResponse(payload, jobsWithText) {
  if (jobsWithText.length === 1 && Array.isArray(payload?.jobs) === false && Array.isArray(payload) === false) {
    return new Map([[getRequirementJobId(jobsWithText[0].job, jobsWithText[0].index), payload]]);
  }

  const profiles = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.jobs)
      ? payload.jobs
      : [];

  return new Map(
    profiles
      .filter((profile) => profile?.id)
      .map((profile) => [String(profile.id), profile]),
  );
}

function getRequirementJobId(job, index) {
  return String(job.id || job.link || `${job.title || "job"}-${job.company || "company"}-${index}`);
}

function toList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
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
