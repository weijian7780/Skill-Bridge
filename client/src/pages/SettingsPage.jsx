import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import { useAppState } from "../state/AppStateContext.jsx";
import { regionOptions } from "../services/career/regionOptions.js";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";

export function SettingsPage() {
  const navigate = useNavigate();
  const { session, updateMetadata } = useAuth();
  const { academicProfile, setAcademicProfile } = useAppState();

  const [displayName, setDisplayName] = useState(
    session?.user?.user_metadata?.display_name || ""
  );
  const [university, setUniversity] = useState(academicProfile?.university || "UMS");
  const [program, setProgram] = useState(academicProfile?.program || "Computer Science");
  const [studyYear, setStudyYear] = useState(academicProfile?.studyYear || "Year 3");
  const [location, setLocation] = useState(academicProfile?.location || "all-malaysia");
  const [discoverable, setDiscoverable] = useState(academicProfile?.discoverable ?? false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    const authResult = await updateMetadata({
      display_name: displayName,
    });

    if (!authResult.ok) {
      setError(authResult.reason || "Failed to update profile.");
      setIsSaving(false);
      return;
    }

    setAcademicProfile({
      university,
      program,
      studyYear,
      location,
      discoverable,
    });

    setIsSaving(false);
    setSuccess("Profile updated successfully!");
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess("");
    }, 3000);
  }

  function handleDeleteAccount() {
    alert("Please contact support at support@skillbridge.edu to delete your account.");
  }

  return (
    <PageShell>
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-[800px] mx-auto">
        
        <div className="flex items-center gap-sm mb-lg">
          <button 
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <Icon name="arrow_back" />
          </button>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Account Settings</h1>
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg md:p-xl shadow-sm mb-xl">
          <div className="flex items-center gap-sm mb-md">
            <Icon name="person" className="text-primary text-[24px]" />
            <h2 className="font-headline-md text-headline-md text-on-surface">Profile Details</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col space-y-md">
            {error && (
              <div className="p-sm bg-error-container text-on-error-container rounded-lg font-body-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-sm bg-green-500/20 border border-green-500/30 text-green-700 rounded-lg font-body-sm">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="displayName">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="university">
                  University
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
                  Degree Program / Major
                </label>
                <input
                  id="program"
                  type="text"
                  required
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="studyYear">
                  Current Year
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
                  Preferred work location
                </label>
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                >
                  {regionOptions.map((region) => (
                    <option key={region.id} value={region.id}>{region.label}</option>
                  ))}
                </select>
              </div>
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
                Allow subscribed employers to discover your skill profile and location when searching for candidates.
              </span>
            </label>

            <div className="pt-md border-t border-outline-variant mt-lg flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary text-on-primary font-label-md rounded-xl hover:bg-secondary transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <Icon name="progress_activity" className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="border border-error/50 bg-error/5 rounded-2xl p-lg md:p-xl">
          <div className="flex items-center gap-sm mb-sm">
            <Icon name="warning" className="text-error text-[24px]" />
            <h2 className="font-headline-md text-error">Danger Zone</h2>
          </div>
          <p className="font-body-md text-on-surface-variant mb-md">
            Permanently remove your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-6 py-2.5 bg-error text-on-error font-label-md rounded-xl hover:bg-error/80 transition-colors"
          >
            Delete Account
          </button>
        </div>

      </main>
    </PageShell>
  );
}
