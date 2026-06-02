import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Icon } from "../../components/Icon.jsx";
import { useAuth } from "../../state/AuthContext.jsx";
import { getEmployerApplication, updateApplicationStatus, updateApplicationNotes, getApplicationResumeUrl } from "../../services/employer/employerApplicationsApi.js";
import { createEmployerInterview, getEmployerInterviews } from "../../services/employer/employerInterviewsApi.js";

export function ApplicantDetailsPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesStatus, setNotesStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Interview Scheduler State
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    scheduled_at: "",
    duration_minutes: 30,
    location: "",
    meeting_link: ""
  });
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!session?.accessToken) return;
      setIsLoading(true);
      try {
        const response = await getEmployerApplication(session.accessToken, id);
        if (response.application) {
          setApplication(response.application);
          setNotes(response.application.notes || "");
        }
        
        const interviewRes = await getEmployerInterviews(session.accessToken, id);
        if (interviewRes.interviews) {
          setInterviews(interviewRes.interviews);
        }
      } catch (err) {
        setError("Failed to load applicant details");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, session]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === application.status) return;
    setIsUpdatingStatus(true);
    try {
      const response = await updateApplicationStatus(session.accessToken, id, newStatus);
      if (response.application) {
        setApplication({ ...application, status: response.application.status });
      }
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setNotesStatus("");
    try {
      const response = await updateApplicationNotes(session.accessToken, id, notes);
      if (response.application) {
        setApplication({ ...application, notes: response.application.notes });
        setNotesStatus("saved");
        setTimeout(() => setNotesStatus(""), 3000);
      }
    } catch (err) {
      setNotesStatus("error");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setIsScheduling(true);
    try {
      const response = await createEmployerInterview(session.accessToken, {
        application_id: id,
        ...scheduleData
      });
      if (response.interview) {
        setInterviews([response.interview, ...interviews]);
        setShowScheduler(false);
        setApplication({ ...application, status: "interview" });
        alert("Interview scheduled successfully!");
      }
    } catch (err) {
      alert("Failed to schedule interview");
    } finally {
      setIsScheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-md md:p-xl flex items-center justify-center">
        <p className="font-label-md text-label-md text-on-surface-variant">Loading applicant profile...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex-1 p-md md:p-xl flex flex-col items-center justify-center space-y-md">
        <Icon name="error_outline" className="text-error text-[48px]" />
        <p className="font-label-md text-label-md text-on-surface-variant">{error || "Applicant not found"}</p>
        <button onClick={() => navigate("/employer/applicants")} className="text-primary hover:underline font-label-md">
          Back to Applicants
        </button>
      </div>
    );
  }

  const { student_profile: profile } = application;

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-orange-500/20 text-orange-700 border-orange-500/30";
      case "reviewed": return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "shortlisted": return "bg-purple-500/20 text-purple-700 border-purple-500/30";
      case "interview": return "bg-teal-500/20 text-teal-700 border-teal-500/30";
      case "hired": return "bg-green-500/20 text-green-700 border-green-500/30";
      case "rejected": return "bg-red-500/20 text-red-700 border-red-500/30";
      default: return "bg-surface-variant text-on-surface-variant border-outline-variant";
    }
  };

  return (
    <div className="flex-1 p-md md:p-xl overflow-y-auto max-w-5xl">
      <button 
        onClick={() => navigate("/employer/applicants")}
        className="flex items-center space-x-xs text-on-surface-variant hover:text-primary transition-colors font-label-sm mb-lg"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        <span>Back to Applicants</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Left Column: Details & Profile */}
        <div className="lg:col-span-2 space-y-md">
          {/* Header Card */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface break-all">
                {application.student_email}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs flex items-center space-x-sm">
                <span>Applied for:</span>
                <span className="font-medium text-on-surface">{application.job_title}</span>
              </p>
            </div>
            <div className={`px-4 py-1.5 rounded-full border font-label-md uppercase tracking-wide flex items-center space-x-xs ${getStatusColor(application.status)}`}>
              {isUpdatingStatus && <Icon name="sync" className="text-[16px] animate-spin" />}
              <span>{application.status}</span>
            </div>
          </div>

          {/* Student Profile Overview */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md flex items-center space-x-xs">
              <Icon name="person" className="text-primary" />
              <span>Student Profile</span>
            </h3>
            
            {profile ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">University</p>
                  <p className="font-body-md text-body-md text-on-surface">{profile.university || "Not provided"}</p>
                </div>
                <div className="space-y-xs">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Program</p>
                  <p className="font-body-md text-body-md text-on-surface">{profile.program || "Not provided"}</p>
                </div>
                <div className="space-y-xs">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Study Year</p>
                  <p className="font-body-md text-body-md text-on-surface">{profile.study_year || "Not provided"}</p>
                </div>
                <div className="space-y-xs">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Readiness Score</p>
                  <div className="flex items-center space-x-sm">
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${profile.readiness_score || 0}%` }}></div>
                    </div>
                    <span className="font-label-sm text-on-surface">{profile.readiness_score || 0}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">No profile snapshot available.</p>
            )}
          </div>

          {/* Cover Letter */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md flex items-center space-x-xs">
              <Icon name="description" className="text-primary" />
              <span>Cover Letter</span>
            </h3>
            {application.cover_letter ? (
              <div className="bg-surface-container-lowest p-md rounded-lg font-body-sm text-body-sm text-on-surface whitespace-pre-wrap leading-relaxed border border-outline-variant/30">
                {application.cover_letter}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">No cover letter provided.</p>
            )}
          </div>

          {/* Documents & Links */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md flex items-center space-x-xs">
              <Icon name="attach_file" className="text-primary" />
              <span>Documents &amp; Links</span>
            </h3>
            {(application.resume_storage_path || application.portfolio_url || application.github_url) ? (
              <div className="flex flex-wrap gap-sm">
                {application.resume_storage_path && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const result = await getApplicationResumeUrl(session.accessToken, id);
                        if (result.url) window.open(result.url, "_blank", "noopener");
                      } catch {
                        alert("Could not open the resume.");
                      }
                    }}
                    className="inline-flex items-center gap-xs rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-label-sm text-label-sm text-primary hover:bg-primary/15">
                    <Icon name="description" className="text-[18px]" /> View Resume
                  </button>
                )}
                {application.portfolio_url && (
                  <a href={application.portfolio_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-xs rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-label-sm text-label-sm text-primary hover:bg-primary/15">
                    <Icon name="language" className="text-[18px]" /> Portfolio
                  </a>
                )}
                {application.github_url && (
                  <a href={application.github_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-xs rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-label-sm text-label-sm text-primary hover:bg-primary/15">
                    <Icon name="code" className="text-[18px]" /> GitHub
                  </a>
                )}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">No documents or links provided.</p>
            )}
          </div>

          {/* Interviews Section */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center space-x-xs">
                <Icon name="event" className="text-primary" />
                <span>Interviews</span>
              </h3>
              {!showScheduler && (
                <button 
                  onClick={() => setShowScheduler(true)}
                  className="px-3 py-1.5 bg-primary/10 text-primary font-label-sm rounded hover:bg-primary/20 transition-colors"
                >
                  + Schedule Interview
                </button>
              )}
            </div>

            {showScheduler && (
              <form onSubmit={handleScheduleInterview} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md mb-md space-y-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                  <div>
                    <label className="font-label-sm text-on-surface-variant block mb-1">Date & Time *</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={scheduleData.scheduled_at}
                      onChange={e => setScheduleData({...scheduleData, scheduled_at: e.target.value})}
                      className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1.5 text-on-surface font-body-sm"
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-on-surface-variant block mb-1">Duration (mins)</label>
                    <input 
                      type="number" 
                      value={scheduleData.duration_minutes}
                      onChange={e => setScheduleData({...scheduleData, duration_minutes: parseInt(e.target.value)})}
                      className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1.5 text-on-surface font-body-sm"
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-on-surface-variant block mb-1">Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Office / Zoom"
                      value={scheduleData.location}
                      onChange={e => setScheduleData({...scheduleData, location: e.target.value})}
                      className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1.5 text-on-surface font-body-sm"
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-on-surface-variant block mb-1">Meeting Link</label>
                    <input 
                      type="url" 
                      placeholder="https://zoom.us/..."
                      value={scheduleData.meeting_link}
                      onChange={e => setScheduleData({...scheduleData, meeting_link: e.target.value})}
                      className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1.5 text-on-surface font-body-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-sm pt-sm">
                  <button type="button" onClick={() => setShowScheduler(false)} className="px-4 py-1.5 text-on-surface-variant font-label-sm hover:text-on-surface">Cancel</button>
                  <button type="submit" disabled={isScheduling} className="px-4 py-1.5 bg-primary text-on-primary font-label-sm rounded hover:bg-secondary disabled:opacity-50">
                    {isScheduling ? "Scheduling..." : "Confirm Schedule"}
                  </button>
                </div>
              </form>
            )}

            {interviews.length > 0 ? (
              <div className="space-y-sm">
                {interviews.map(inv => (
                  <div key={inv.id} className="p-sm bg-surface-container-lowest border border-outline-variant rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-label-md text-on-surface">
                        {new Date(inv.scheduled_at).toLocaleString()} ({inv.duration_minutes} mins)
                      </p>
                      <p className="font-body-sm text-on-surface-variant">
                        {inv.location || "No location"} {inv.meeting_link && <a href={inv.meeting_link} target="_blank" rel="noreferrer" className="text-primary hover:underline ml-2">Join Link</a>}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded bg-teal-500/20 text-teal-700 font-label-sm uppercase text-[10px]">
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              !showScheduler && <p className="font-body-sm text-on-surface-variant italic">No interviews scheduled yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Actions & Notes */}
        <div className="space-y-md">
          {/* Status Actions */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Update Status</h3>
            <div className="flex flex-col space-y-sm">
              <button onClick={() => handleStatusChange("reviewed")} className={`px-4 py-2 text-left rounded-lg font-label-sm transition-colors border ${application.status === "reviewed" ? "bg-blue-500/20 text-blue-700 border-blue-500/30" : "bg-surface-container-lowest text-on-surface hover:bg-surface-variant border-outline-variant"}`}>
                Mark as Reviewed
              </button>
              <button onClick={() => handleStatusChange("shortlisted")} className={`px-4 py-2 text-left rounded-lg font-label-sm transition-colors border ${application.status === "shortlisted" ? "bg-purple-500/20 text-purple-700 border-purple-500/30" : "bg-surface-container-lowest text-on-surface hover:bg-surface-variant border-outline-variant"}`}>
                Shortlist Candidate
              </button>
              <button onClick={() => handleStatusChange("interview")} className={`px-4 py-2 text-left rounded-lg font-label-sm transition-colors border ${application.status === "interview" ? "bg-teal-500/20 text-teal-700 border-teal-500/30" : "bg-surface-container-lowest text-on-surface hover:bg-surface-variant border-outline-variant"}`}>
                Invite to Interview
              </button>
              <button onClick={() => handleStatusChange("hired")} className={`px-4 py-2 text-left rounded-lg font-label-sm transition-colors border ${application.status === "hired" ? "bg-green-500/20 text-green-700 border-green-500/30" : "bg-surface-container-lowest text-on-surface hover:bg-surface-variant border-outline-variant"}`}>
                Hire Candidate
              </button>
              <div className="my-2 border-t border-outline-variant/30"></div>
              <button onClick={() => handleStatusChange("rejected")} className={`px-4 py-2 text-left rounded-lg font-label-sm transition-colors border ${application.status === "rejected" ? "bg-red-500/20 text-red-700 border-red-500/30" : "bg-surface-container-lowest text-on-surface hover:bg-error/10 hover:text-error border-outline-variant"}`}>
                Reject Application
              </button>
            </div>
          </div>

          {/* Employer Notes */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs flex items-center space-x-xs">
              <Icon name="edit_note" className="text-primary" />
              <span>Private Notes</span>
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">These notes are only visible to you.</p>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your evaluation notes here..."
              className="w-full h-32 bg-surface-container-lowest border border-outline-variant rounded-lg p-sm font-body-sm text-on-surface focus:outline-none focus:border-primary resize-none mb-sm"
            ></textarea>
            
            <button 
              onClick={handleSaveNotes}
              disabled={isSavingNotes || notes === application.notes}
              className="w-full py-2 bg-primary text-on-primary font-label-sm rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-xs"
            >
              {isSavingNotes ? <Icon name="sync" className="animate-spin text-[16px]" /> : <Icon name="save" className="text-[16px]" />}
              <span>{isSavingNotes ? "Saving..." : "Save Notes"}</span>
            </button>
            {notesStatus === "saved" && (
              <p className="mt-xs flex items-center gap-xs font-label-sm text-label-sm text-green-600">
                <Icon name="check_circle" className="text-[16px]" /> Notes saved
              </p>
            )}
            {notesStatus === "error" && (
              <p className="mt-xs flex items-center gap-xs font-label-sm text-label-sm text-error">
                <Icon name="error" className="text-[16px]" /> Could not save notes
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
