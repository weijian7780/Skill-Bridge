import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon.jsx";
import { useAppState } from "../state/AppStateContext.jsx";
import { buildPerJobAnalysis } from "../services/analysis/perJobAnalysis.js";
import { generateRoadmapFromAnalysis } from "../services/roadmap/roadmapApi.js";

/**
 * JobDetailPanel Component
 * Displays selected job details and per-job skill gap analysis.
 */
export default function JobDetailPanel({
  job,
  isSaved,
  onToggleSave,
  onClose,
}) {
  const navigate = useNavigate();
  const { skillProfile, careerTarget, setRoadmapPlan } = useAppState();

  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState("");

  // Reset analysis when job changes
  useEffect(() => {
    setAnalysisResult(null);
    setRoadmapError("");
  }, [job?.id]);

  if (!job) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-on-surface-variant">
        <Icon name="work_outline" className="text-[48px] text-outline-variant mb-4" />
        <p className="font-headline-sm text-headline-sm">Select a job post to view details</p>
        <p className="font-body-md text-body-md mt-2 max-w-sm">
          Click on any job listing in the feed to explore its requirements, analyze your CV skills, and generate custom learning roadmaps.
        </p>
      </div>
    );
  }

  const { title, company, location, employmentType, source, badgeLabel, originalJob, url, applyPath } = job;

  // Handle Skill Analysis client-side
  const handleAnalyzeSkills = () => {
    setIsAnalyzing(true);
    // Artificially small delay for premium feels/micro-animation
    setTimeout(() => {
      try {
        const result = buildPerJobAnalysis({ job: originalJob, skillProfile });
        setAnalysisResult(result);
      } catch (err) {
        console.error("Analysis error:", err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 400);
  };

  // Handle Roadmap generation for the selected job
  const handleGenerateRoadmap = async () => {
    if (!analysisResult) return;
    setIsGeneratingRoadmap(true);
    setRoadmapError("");

    try {
      const result = await generateRoadmapFromAnalysis({
        careerTarget: {
          role: title,
          region: location || careerTarget.region,
        },
        skillProfile,
        analysis: {
          status: analysisResult.status,
          readinessScore: analysisResult.matchScore,
          matchedSkills: analysisResult.matchedSkills,
          missingSkills: analysisResult.missingSkills,
          marketEvidence: [],
        },
      });

      if (result && result.roadmap) {
        setRoadmapPlan({
          ...result.roadmap,
          generatedForJob: true,
          jobMissingSkills: analysisResult.missingSkills,
        });
        navigate("/roadmap");
      } else {
        throw new Error("Invalid roadmap response from server");
      }
    } catch (err) {
      setRoadmapError(err.message || "Failed to generate learning roadmap.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Salary format helper
  const renderSalary = () => {
    if (source === "skillbridge" && originalJob) {
      if (originalJob.salary_undisclosed || (!originalJob.salary_min && !originalJob.salary_max)) {
        return <span className="text-on-surface-variant">Salary undisclosed</span>;
      }
      const minStr = originalJob.salary_min ? `RM ${originalJob.salary_min.toLocaleString()}` : "";
      const maxStr = originalJob.salary_max ? `RM ${originalJob.salary_max.toLocaleString()}` : "";
      if (minStr && maxStr) {
        return <span className="font-semibold text-primary">{minStr} - {maxStr}</span>;
      }
      return <span className="font-semibold text-primary">{minStr || maxStr}</span>;
    }

    if (source === "market" && originalJob?.salary) {
      return <span className="font-semibold text-primary">{originalJob.salary}</span>;
    }

    return <span className="text-on-surface-variant">Salary undisclosed</span>;
  };

  const isInternal = source === "skillbridge";
  const requiredSkills = isInternal 
    ? (originalJob?.required_skills || [])
    : (originalJob?.requirements?.hardSkills || originalJob?.requirements?.tools || originalJob?.extractedSkills || originalJob?.requiredSkills || []);

  return (
    <div className="flex h-full flex-col bg-surface-container-lowest shadow-sm rounded-r-xl border border-outline-variant overflow-hidden">
      {/* Header Panel */}
      <div className="p-md border-b border-outline-variant bg-surface-container-low flex items-start justify-between gap-sm">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-xs mb-xs">
            <span className="inline-block rounded-full bg-primary-container/60 px-2.5 py-0.5 font-label-xs text-label-xs text-primary font-semibold">
              {badgeLabel}
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface truncate" title={title}>
            {title}
          </h2>
          <p className="font-label-md text-label-md text-on-surface-variant mt-0.5 font-semibold">
            {company}
          </p>
          <div className="flex flex-wrap items-center gap-x-sm gap-y-xs mt-2 font-body-sm text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-x-xs">
              <Icon name="location_on" className="text-[16px]" />
              {location || "Location not specified"}
            </span>
            <span className="text-outline-variant">•</span>
            <span className="flex items-center gap-x-xs">
              <Icon name="work" className="text-[16px]" />
              {employmentType || "Full-time"}
            </span>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
            aria-label="Close panel"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-md space-y-md">
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm bg-surface-container-low p-sm rounded-xl">
          <div>
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Salary</p>
            <p className="mt-0.5 font-body-md text-body-md text-on-surface">{renderSalary()}</p>
          </div>
          <div>
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Source</p>
            <p className="mt-0.5 font-body-md text-body-md text-on-surface capitalize">{source}</p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-sm">
          {isInternal ? (
            <button
              onClick={() => navigate(applyPath)}
              className="flex-1 h-11 inline-flex items-center justify-center rounded-xl bg-primary font-label-md text-label-md font-bold text-on-primary shadow-sm hover:bg-secondary active:scale-[0.98] transition-all"
            >
              Apply on SkillBridge
            </button>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 h-11 inline-flex items-center justify-center rounded-xl bg-primary font-label-md text-label-md font-bold text-on-primary shadow-sm hover:bg-secondary active:scale-[0.98] transition-all text-center"
            >
              Open listing
              <Icon name="open_in_new" className="text-[16px] ml-xs" />
            </a>
          )}

          <button
            onClick={() => onToggleSave(job)}
            className={`save-btn ${isSaved ? "save-btn-active" : ""}`}
            title={isSaved ? "Unsave job" : "Save job"}
            aria-label={isSaved ? "Unsave job" : "Save job"}
          >
            <Icon name={isSaved ? "favorite" : "favorite_border"} className="text-[20px]" />
          </button>
        </div>

        {/* Premium Per-Job Skill Analysis Panel */}
        <div className="detail-section">
          <h3 className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-sm">
            CV Skill Gap Analysis
          </h3>

          {!analysisResult ? (
            <div className="border border-outline-variant rounded-xl p-md text-center bg-surface-container-low">
              <Icon name="auto_awesome" className="text-[32px] text-primary/70 mb-sm" />
              <p className="font-headline-sm text-headline-sm text-on-surface">Compare with your CV</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs mb-sm">
                Analyze this job's requirement skills against your uploaded CV to see your match level.
              </p>
              <button
                onClick={handleAnalyzeSkills}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-xs rounded-xl bg-primary px-xl py-2.5 font-label-md text-label-md font-bold text-on-primary hover:bg-secondary active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Icon name="sync" className="animate-spin text-[18px]" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Icon name="query_stats" className="text-[18px]" />
                    Analyze Skills
                  </>
                )}
              </button>
            </div>
          ) : analysisResult.status === "no_skills" ? (
            <div className="analysis-result-empty border border-dashed rounded-xl p-md text-center">
              <Icon name="info" className="text-[28px] text-orange-500 mb-xs" />
              <p className="font-label-md text-label-md text-on-surface font-semibold">No skills extracted</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                This job posting does not have structured required skills or tools. You can still open the original listing to review.
              </p>
            </div>
          ) : (
            <div className="analysis-result space-y-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Requirement matches</h4>
                  <p className="font-body-xs text-body-xs text-on-surface-variant mt-0.5">Based on your confirmed CV skills</p>
                </div>
                <div className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 font-bold text-label-md flex items-center gap-x-xs">
                  <Icon name="check_circle" className="text-[16px]" />
                  {analysisResult.matchScore}%
                </div>
              </div>

              {/* Matched Skills */}
              <div>
                <p className="font-label-xs text-label-xs text-emerald-700 uppercase tracking-wider mb-xs">
                  Matched Skills ({analysisResult.matchedSkills.length})
                </p>
                <div className="flex flex-wrap gap-xs">
                  {analysisResult.matchedSkills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-x-xs rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      <Icon name="check" className="text-[12px]" />
                      {skill}
                    </span>
                  ))}
                  {analysisResult.matchedSkills.length === 0 && (
                    <span className="text-xs text-on-surface-variant italic">No overlapping skills matching your CV.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <p className="font-label-xs text-label-xs text-orange-700 uppercase tracking-wider mb-xs">
                  Missing Skills ({analysisResult.missingSkills.length})
                </p>
                <div className="flex flex-wrap gap-xs">
                  {analysisResult.missingSkills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-x-xs rounded-full bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-semibold text-orange-800">
                      <Icon name="add" className="text-[12px]" />
                      {skill}
                    </span>
                  ))}
                  {analysisResult.missingSkills.length === 0 && (
                    <span className="text-xs text-emerald-700 font-semibold italic">You match all requirements for this role!</span>
                  )}
                </div>
              </div>

              {/* Generate Roadmap Action */}
              {analysisResult.missingSkills.length > 0 && (
                <div className="pt-sm border-t border-emerald-200/50 mt-sm">
                  <button
                    onClick={handleGenerateRoadmap}
                    disabled={isGeneratingRoadmap}
                    className="w-full inline-flex items-center justify-center gap-xs rounded-xl bg-primary px-xl py-2.5 font-label-md text-label-md font-bold text-on-primary hover:bg-secondary active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {isGeneratingRoadmap ? (
                      <>
                        <Icon name="sync" className="animate-spin text-[18px]" />
                        Generating Roadmap...
                      </>
                    ) : (
                      <>
                        <Icon name="map" className="text-[18px]" />
                        Generate Roadmap
                      </>
                    )}
                  </button>
                  {roadmapError && (
                    <p className="text-error font-body-sm text-body-sm mt-sm text-center">
                      {roadmapError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="detail-section">
          <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">
            Job Description
          </h3>
          <div 
            className="font-body-md text-body-md text-on-surface-variant space-y-xs whitespace-pre-wrap leading-relaxed"
            dangerouslySetInnerHTML={{ __html: originalJob?.description || "No job description provided." }}
          />
        </div>

        {/* Required Skills list */}
        {requiredSkills.length > 0 && (
          <div className="detail-section">
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">
              All Job Requirements ({requiredSkills.length})
            </h3>
            <div className="flex flex-wrap gap-xs">
              {requiredSkills.map((skill) => (
                <span key={skill} className="skill-chip skill-chip-neutral">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
