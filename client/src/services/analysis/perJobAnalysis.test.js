import test from "node:test";
import assert from "node:assert/strict";
import {
  extractJobSkills,
  compareJobToCV,
  buildPerJobAnalysis,
} from "./perJobAnalysis.js";

test("perJobAnalysis tests", async (t) => {
  await t.test("compareJobToCV with full overlap (100% match)", () => {
    const jobSkills = ["React", "CSS3"];
    const cvSkills = ["React", "CSS3", "HTML5"];
    const result = compareJobToCV({ jobSkills, cvSkills });
    assert.deepEqual(result, {
      matchScore: 100,
      matchedSkills: ["React", "CSS3"],
      missingSkills: [],
    });
  });

  await t.test("compareJobToCV with partial overlap", () => {
    const jobSkills = ["React", "CSS3", "Python"];
    const cvSkills = ["React", "CSS3", "HTML5"];
    const result = compareJobToCV({ jobSkills, cvSkills });
    assert.deepEqual(result, {
      matchScore: 67,
      matchedSkills: ["React", "CSS3"],
      missingSkills: ["Python"],
    });
  });

  await t.test("compareJobToCV with zero overlap (0% match)", () => {
    const jobSkills = ["Python"];
    const cvSkills = ["React", "CSS3", "HTML5"];
    const result = compareJobToCV({ jobSkills, cvSkills });
    assert.deepEqual(result, {
      matchScore: 0,
      matchedSkills: [],
      missingSkills: ["Python"],
    });
  });

  await t.test("compareJobToCV with empty job skills", () => {
    const jobSkills = [];
    const cvSkills = ["React", "CSS3", "HTML5"];
    const result = compareJobToCV({ jobSkills, cvSkills });
    assert.deepEqual(result, {
      matchScore: 0,
      matchedSkills: [],
      missingSkills: [],
    });
  });

  await t.test("compareJobToCV with canonical name matching (e.g. 'powerbi' in CV matches 'Power BI' in job)", () => {
    const jobSkills = ["Power BI"];
    const cvSkills = ["powerbi"];
    const result = compareJobToCV({ jobSkills, cvSkills });
    assert.deepEqual(result, {
      matchScore: 100,
      matchedSkills: ["Power BI"],
      missingSkills: [],
    });
  });

  await t.test("extractJobSkills from market job with requirements.hardSkills + tools", () => {
    const job = {
      requirements: {
        hardSkills: ["React", "css"],
        tools: ["figma"],
      },
    };
    const result = extractJobSkills(job);
    assert.deepEqual(result, ["React", "CSS3", "Figma"]);
  });

  await t.test("extractJobSkills from market job falling back to extractedSkills", () => {
    const job = {
      extractedSkills: ["html", "css", "miro"],
    };
    const result = extractJobSkills(job);
    assert.deepEqual(result, ["HTML5", "CSS3", "Miro"]);
  });

  await t.test("extractJobSkills from internal job with required_skills", () => {
    const job = {
      required_skills: ["Python", "sql"],
    };
    const result = extractJobSkills(job);
    assert.deepEqual(result, ["Python", "SQL"]);
  });

  await t.test("buildPerJobAnalysis with a market job that has skills", () => {
    const job = {
      title: "Frontend Engineer",
      company: "Tech Corp",
      requirements: {
        hardSkills: ["React", "CSS3"],
      },
    };
    const skillProfile = {
      technicalSkills: ["React"],
      softSkills: [],
      certifications: [],
    };
    const result = buildPerJobAnalysis({ job, skillProfile });
    assert.deepEqual(result, {
      status: "ready",
      matchScore: 50,
      matchedSkills: ["React"],
      missingSkills: ["CSS3"],
      jobTitle: "Frontend Engineer",
      jobCompany: "Tech Corp",
      hasSkillData: true,
    });
  });

  await t.test("buildPerJobAnalysis with a job that has no skills (returns status: 'no_skills')", () => {
    const job = {
      title: "Frontend Engineer",
      company: "Tech Corp",
    };
    const skillProfile = {
      technicalSkills: ["React"],
    };
    const result = buildPerJobAnalysis({ job, skillProfile });
    assert.deepEqual(result, {
      status: "no_skills",
      matchScore: 0,
      matchedSkills: [],
      missingSkills: [],
      jobTitle: "Frontend Engineer",
      jobCompany: "Tech Corp",
      hasSkillData: false,
    });
  });
});
