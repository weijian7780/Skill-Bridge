import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import { useAppState } from "../state/AppStateContext.jsx";
import { regionOptions } from "../services/career/regionOptions.js";
import { Icon } from "../components/Icon.jsx";

export function StudentSetupPage() {
  const navigate = useNavigate();
  const { session, updateMetadata } = useAuth();
  const { academicProfile, setAcademicProfile } = useAppState();

  const [displayName, setDisplayName] = useState(
    session?.user?.user_metadata?.display_name || ""
  );
  const [university, setUniversity] = useState(academicProfile.university);
  const [program, setProgram] = useState(academicProfile.program);
  const [studyYear, setStudyYear] = useState(academicProfile.studyYear);
  const [location, setLocation] = useState(academicProfile.location || "all-malaysia");
  const [discoverable, setDiscoverable] = useState(academicProfile.discoverable ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    // 1. Update Auth Metadata
    const authResult = await updateMetadata({
      display_name: displayName,
      setup_completed: true,
    });

    if (!authResult.ok) {
      setError(authResult.reason || "Failed to update profile.");
      setIsSaving(false);
      return;
    }

    // 2. Update Academic Profile in AppState (this will trigger auto-save to DB)
    setAcademicProfile({
      university,
      program,
      studyYear,
      location,
      discoverable,
    });

    // 3. Redirect to Home
    navigate("/home", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-xl px-margin-mobile md:px-margin-desktop relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
        <svg height="100%" viewBox="0 0 1000 1000" width="100%" xmlns="http://www.w3.org/2000/svg">
          <circle cx="500" cy="500" r="400" fill="none" stroke="#0b63ce" strokeWidth="2" />
          <circle cx="500" cy="500" r="300" fill="none" stroke="#0b63ce" strokeWidth="1" opacity="0.5" />
          <circle cx="500" cy="500" r="200" fill="none" stroke="#0b63ce" strokeWidth="0.5" opacity="0.3" />
        </svg>
      </div>

      <div className="w-full max-w-lg bg-surface-container border border-outline-variant rounded-2xl p-lg md:p-xl shadow-xl relative z-10">
        <div className="flex flex-col items-center text-center space-y-sm mb-lg">
          <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-sm">
            <Icon name="person_add" className="text-[32px]" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Welcome to SkillBridge!</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Let's set up your student profile to personalize your career journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-md">
          {error && (
            <div className="p-sm bg-error/10 border border-error/20 rounded-lg text-error font-body-sm text-body-sm">
              {error}
            </div>
          )}

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="displayName">
              Display Name <span className="text-error">*</span>
            </label>
            <input
              id="displayName"
              type="text"
              required
              placeholder="e.g. Alex"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="university">
              University <span className="text-error">*</span>
            </label>
            <input
              id="university"
              type="text"
              required
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="program">
              Degree Program / Major <span className="text-error">*</span>
            </label>
            <input
              id="program"
              type="text"
              required
              placeholder="e.g. Computer Science"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="studyYear">
              Current Year <span className="text-error">*</span>
            </label>
            <select
              id="studyYear"
              required
              value={studyYear}
              onChange={(e) => setStudyYear(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="Year 1">Year 1</option>
              <option value="Year 2">Year 2</option>
              <option value="Year 3">Year 3</option>
              <option value="Year 4">Year 4</option>
              <option value="Year 5">Year 5</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="location">
              Preferred work location <span className="text-error">*</span>
            </label>
            <select
              id="location"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              {regionOptions.map((region) => (
                <option key={region.id} value={region.id}>{region.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-sm p-sm rounded-lg bg-surface-container-lowest border border-outline-variant cursor-pointer">
            <input
              type="checkbox"
              checked={discoverable}
              onChange={(e) => setDiscoverable(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              <span className="font-label-md text-label-md text-on-surface block">Let employers find me</span>
              Allow subscribed employers to discover your skill profile and location when searching for candidates. You can change this anytime.
            </span>
          </label>

          <div className="pt-md">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-sm bg-primary text-on-primary font-label-lg text-label-lg rounded-xl hover:bg-secondary transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <Icon name="progress_activity" className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Complete Setup</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
