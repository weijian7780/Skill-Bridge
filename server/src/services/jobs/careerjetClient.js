import { normalizeCareerjetJob } from "./jobNormalizer.js";

const careerjetEndpoint = "https://search.api.careerjet.net/v4/query";

export async function searchCareerjetJobs({ role, location, userIp, userAgent, referer }) {
  const apiKey = process.env.CAREERJET_API_KEY || process.env.CAREERJET_AFFID;

  if (!apiKey) {
    return {
      configured: false,
      source: "Careerjet",
      message: "Careerjet API key not configured. Add CAREERJET_API_KEY to server/.env.",
      jobs: [],
    };
  }

  const params = new URLSearchParams({
    locale_code: process.env.CAREERJET_LOCALE || "en_MY",
    keywords: role,
    location,
    user_ip: userIp,
    user_agent: userAgent,
    page_size: "10",
    page: "1",
  });

  const credentials = Buffer.from(`${apiKey}:`).toString("base64");
  const response = await fetch(`${careerjetEndpoint}?${params.toString()}`, {
    headers: {
      Authorization: `Basic ${credentials}`,
      Referer: referer,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Careerjet rejected the request with 403. Check CAREERJET_API_KEY and set CLIENT_PUBLIC_URL to the public website URL registered with Careerjet, not localhost.");
    }

    throw new Error(`Careerjet request failed with status ${response.status}`);
  }

  const data = await response.json();

  return {
    configured: true,
    source: "Careerjet",
    total: data.hits || 0,
    jobs: Array.isArray(data.jobs) ? data.jobs.map(normalizeCareerjetJob) : [],
  };
}
