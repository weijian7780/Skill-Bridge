export function normalizeJoobleJob(job, requirementProfile = null) {
  const description = stripHtml(job.description || job.fullDescription || job.jobDescription || job.snippet || "");
  const title = job.title || "Untitled role";
  const company = job.company || "Unknown company";
  const location = job.location || "Malaysia";
  const requirements = requirementProfile || null;
  const extractedSkills = requirements
    ? unique(requirements.scoredSkills ?? [...(requirements.hardSkills ?? []), ...(requirements.tools ?? [])])
    : extractJobSkills(`${title} ${description}`);

  return {
    id: String(job.id || job.link || `${title}-${company}-${location}`),
    title,
    company,
    location,
    salary: job.salary || "",
    description,
    url: job.link,
    source: "Jooble",
    jobType: job.type || "",
    postedAt: job.updated || "",
    requirements,
    extractedSkills,
  };
}

export function stripHtml(value) {
  return String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function extractJobSkills(text) {
  const source = normalizeSearchText(text);
  const skillTerms = [
    ["SQL", ["sql"]],
    ["Power BI", ["power bi", "powerbi"]],
    ["Python", ["python"]],
    ["Excel", ["excel"]],
    ["Data Cleaning", ["data cleaning", "data cleansing"]],
    ["Tableau", ["tableau"]],
    ["Data Analytics", ["data analytics", "data analysis", "analytics"]],
    ["Business Intelligence", ["business intelligence", "bi analyst"]],
    ["Dashboards", ["dashboard", "dashboards"]],
    ["Reporting", ["reporting", "reports", "report "]],
    ["Data Warehouse", ["data warehouse", "data warehousing", "edw"]],
    ["AWS", ["aws", "amazon web services"]],
    ["Azure", ["azure", "microsoft azure"]],
    ["Big Data Analysis", ["big data analysis", "big data analytics"]],
    ["Data Management", ["data management"]],
    ["Data Management Lifecycle", ["data management lifecycle"]],
    ["Data Modelling", ["data modelling", "data modeling", "data model"]],
    ["Data Governance", ["data governance"]],
    ["Master Data Management", ["master data management", "mdm"]],
    ["Metadata Management", ["metadata management"]],
    ["Data Quality", ["data quality", "data profiling"]],
    ["Data Security", ["data security", "information security"]],
    ["Data Pipelines", ["data pipeline", "data pipelines"]],
    ["Machine Learning", ["machine learning", "machine-learning", "ml solutions"]],
    ["Natural Language Processing", ["natural language processing", "nlp"]],
    ["NoSQL", ["nosql", "no sql"]],
    ["HDFS", ["hdfs"]],
    ["Hadoop", ["hadoop"]],
    ["Kafka", ["kafka"]],
    ["Flume", ["flume"]],
    ["Oozie", ["oozie"]],
    ["Hive", ["hive"]],
    ["HBase", ["hbase"]],
    ["Spark SQL", ["spark sql"]],
    ["Presto", ["presto"]],
    ["Elasticsearch", ["elasticsearch", "elastic search"]],
    ["Solr", ["solr"]],
    ["Sqoop", ["sqoop"]],
    ["Zookeeper", ["zookeeper", "zoo keeper"]],
    ["HCatalog", ["hcatalog"]],
    ["Avro", ["avro"]],
    ["Java", ["java"]],
    ["R", ["r"]],
    ["Linux", ["linux"]],
    ["Figma", ["figma"]],
    ["FigJam", ["figjam", "fig jam"]],
    ["Miro", ["miro"]],
    ["Google Suite", ["google suite", "google workspace", "g suite", "google docs", "google sheets", "google slides"]],
    ["Slack", ["slack"]],
    ["Cloud Basics", ["cloud basics", "cloud practitioner", "cloud infrastructure"]],
  ];

  const extractedSkills = skillTerms
    .filter(([, aliases]) => aliases.some((alias) => containsAlias(source, alias)))
    .map(([skill]) => skill);

  if (hasUiUxContext(source)) {
    if (source.includes("principles")) {
      extractedSkills.push("UI/UX Principles");
    }

    if (source.includes("guidelines")) {
      extractedSkills.push("UI/UX Guidelines");
    }

    if (source.includes("best practices") || source.includes("best practice")) {
      extractedSkills.push("UI/UX Best Practices");
    }
  }

  return unique(extractedSkills);
}

function normalizeSearchText(value) {
  return ` ${String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function containsAlias(source, alias) {
  const normalizedAlias = normalizeSearchText(alias);
  return source.includes(normalizedAlias);
}

function hasUiUxContext(source) {
  return [
    "ui/ux",
    "ui ux",
    "ux",
    "user experience",
    "user interface",
  ].some((fragment) => source.includes(fragment));
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
