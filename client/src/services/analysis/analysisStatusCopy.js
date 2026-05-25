export function buildAnalysisScoreMessage({ analysisStatus, jobStatus, matchedCount }) {
  if (analysisStatus === "ready") {
    return `Based on ${matchedCount} matched skills from your confirmed latest CV and live job-market results.`;
  }

  if (analysisStatus === "needs_cv") {
    return "Upload and confirm your latest CV before this score is calculated.";
  }

  if (analysisStatus === "needs_market") {
    return buildMarketUnavailableMessage(jobStatus);
  }

  return "SkillBridge needs your confirmed CV and live job-market results before calculating the score.";
}

export function buildAnalysisActionLabel({ analysisStatus, jobStatus }) {
  if (analysisStatus === "ready") {
    return "Generate My Roadmap";
  }

  if (analysisStatus === "needs_cv") {
    return "Go to CV Upload";
  }

  if (/failed to fetch/i.test(jobStatus)) {
    return "Retry Job Search";
  }

  if (isJobProviderProblem(jobStatus)) {
    return "Job API Unavailable";
  }

  if (/loaded \d+/i.test(jobStatus)) {
    return "Reload Jobs";
  }

  return "Load Jobs";
}

function buildMarketUnavailableMessage(jobStatus = "") {
  if (/failed to fetch/i.test(jobStatus)) {
    return "Job-market data is unavailable because the local API server cannot be reached. Start the server on port 4000.";
  }

  if (isJobProviderProblem(jobStatus)) {
    return `Job-market data is unavailable: ${jobStatus}`;
  }

  if (/loaded 0/i.test(jobStatus)) {
    return "The job provider returned 0 usable jobs, so there are no market skills to compare with your CV.";
  }

  return "Live job-market results are required before calculating the score.";
}

function isJobProviderProblem(jobStatus = "") {
  return /403|rejected|not configured|request failed|error|api key/i.test(jobStatus);
}
