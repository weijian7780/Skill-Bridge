import test from "node:test";
import assert from "node:assert/strict";

import { normalizeJoobleJob } from "./jobNormalizer.js";

test("extracts common analyst skills from Jooble titles and snippets", () => {
  const job = normalizeJoobleJob({
    title: "Business Intelligence Analyst",
    company: "Example",
    location: "Malaysia",
    snippet: "Build dashboards, write SQL, prepare reports, and support data analytics in an AWS data warehouse.",
    link: "https://example.test/job",
  });

  assert.deepEqual(job.extractedSkills, [
    "SQL",
    "Data Analytics",
    "Business Intelligence",
    "Dashboards",
    "Reporting",
    "Data Warehouse",
    "AWS",
  ]);
});

test("extracts UI/UX hard-skill requirements from Jooble snippets", () => {
  const job = normalizeJoobleJob({
    title: "Mid level and senior UI/UX Designer locals and expats available in Malaysia",
    company: "TWO95 International, Inc",
    location: "Malaysia",
    snippet: `
      Up-to-date knowledge of FIGMA & UI/UX principles, guidelines & best practices.
      Software/Tools Requirements: FIGMA, (Optional) FIGJAM/ Miro, Google Suite, Slack.
    `,
    link: "https://jooble.org/jdp/-2210350391055282614",
  });

  assert.deepEqual(job.extractedSkills, [
    "Figma",
    "FigJam",
    "Miro",
    "Google Suite",
    "Slack",
    "UI/UX Principles",
    "UI/UX Guidelines",
    "UI/UX Best Practices",
  ]);
});

test("extracts common data architecture requirements from long descriptions", () => {
  const job = normalizeJoobleJob({
    title: "Big Data Architect",
    company: "Axiata",
    location: "Kuala Lumpur, Malaysia",
    description: `
      Requires advanced knowledge of Big Data analysis and data management tools.
      Hands on experience in Data Management Lifecycle, Data Modelling and Data Governance.
      Experience with Hadoop clusters, Kafka, Flume, Oozie, Hive, HBASE, Spark SQL, Presto,
      Elasticsearch, Solr, Java, Python, R, Linux OS, machine-learning solutions,
      Natural Language Processing, data security, metadata management and data quality.
      TOGAF certification will be an advantage.
      Excellent communication skills.
    `,
  });

  for (const skill of [
    "Big Data Analysis",
    "Data Management",
    "Data Management Lifecycle",
    "Data Modelling",
    "Data Governance",
    "Metadata Management",
    "Data Quality",
    "Data Security",
    "Hadoop",
    "Kafka",
    "Flume",
    "Oozie",
    "Hive",
    "HBase",
    "Spark SQL",
    "Presto",
    "Elasticsearch",
    "Solr",
    "Java",
    "Python",
    "R",
    "Linux",
    "Machine Learning",
    "Natural Language Processing",
  ]) {
    assert.ok(job.extractedSkills.includes(skill), `${skill} should be extracted`);
  }

  assert.equal(job.extractedSkills.includes("Excel"), false);
  assert.equal(job.extractedSkills.includes("TOGAF"), false);
  assert.equal(job.extractedSkills.includes("Communication"), false);
});
