import { useEffect, useState } from "react";
import { Icon } from "../../components/Icon.jsx";
import { useAuth } from "../../state/AuthContext.jsx";
import { getEmployerProfile, updateEmployerProfile } from "../../services/employer/employerProfileApi.js";

export function CompanyProfilePage() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  
  // Form fields
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!session?.accessToken) return;
      try {
        const response = await getEmployerProfile(session.accessToken);
        if (response.profile) {
          setProfile(response.profile);
          setCompanyName(response.profile.company_name || "");
          setIndustry(response.profile.industry || "");
          setCompanySize(response.profile.company_size || "");
          setWebsite(response.profile.website || "");
          setDescription(response.profile.description || "");
          setContactEmail(response.profile.contact_email || "");
          setContactPhone(response.profile.contact_phone || "");
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [session]);

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage("");
    
    try {
      const response = await updateEmployerProfile(session.accessToken, {
        company_name: companyName,
        industry,
        company_size: companySize,
        website,
        description,
        contact_email: contactEmail,
        contact_phone: contactPhone,
      });
      
      if (response.profile) {
        setProfile(response.profile);
        setStatusMessage("Profile saved successfully.");
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-md md:p-xl flex items-center justify-center">
        <p className="font-label-md text-label-md text-on-surface-variant flex items-center gap-sm">
          <Icon name="progress_activity" className="animate-spin" /> Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-md md:p-xl overflow-y-auto max-w-4xl mx-auto w-full">
      <div className="mb-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Company Profile</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage your organization's details visible to students.</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col space-y-xl">
        {statusMessage && (
          <div className={`p-md rounded-xl font-body-sm text-body-sm flex items-center gap-sm transition-all animate-fade-in ${statusMessage.startsWith("Error") ? "bg-error-container text-on-error-container border border-error/20" : "bg-green-500/10 text-green-700 border border-green-500/20"}`}>
            <Icon name={statusMessage.startsWith("Error") ? "error" : "check_circle"} className="text-[20px]" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Basic Organization Details */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg md:p-xl shadow-sm">
          <div className="flex items-center gap-sm mb-lg border-b border-outline-variant pb-md">
            <Icon name="business" className="text-primary text-[24px]" />
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Organization Info</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-lg gap-y-md">
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant">Company Name *</label>
              <div className="relative">
                <Icon name="apartment" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
                <input 
                  required
                  type="text" 
                  value={companyName} 
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-sm py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant">Industry</label>
              <div className="relative">
                <Icon name="category" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
                <input 
                  type="text" 
                  value={industry} 
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-sm py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="e.g. Technology, Healthcare"
                />
              </div>
            </div>

            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant">Company Size</label>
              <div className="relative">
                <Icon name="groups" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
                <select 
                  value={companySize} 
                  onChange={e => setCompanySize(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-xl py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
                >
                  <option value="">Select size...</option>
                  <option value="startup">Startup (1-10)</option>
                  <option value="small">Small (11-50)</option>
                  <option value="medium">Medium (51-200)</option>
                  <option value="large">Large (201-1000)</option>
                  <option value="enterprise">Enterprise (1000+)</option>
                </select>
                <Icon name="expand_more" className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
              </div>
            </div>

            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant">Website</label>
              <div className="relative">
                <Icon name="language" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
                <input 
                  type="url" 
                  value={website} 
                  onChange={e => setWebsite(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-sm py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-xs md:col-span-2 mt-sm">
              <label className="font-label-md text-label-md text-on-surface-variant">Description</label>
              <textarea 
                rows={5}
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-sm py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-y"
                placeholder="Tell students about your company's mission, culture, and goals..."
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg md:p-xl shadow-sm">
          <div className="flex items-center gap-sm mb-lg border-b border-outline-variant pb-md">
            <Icon name="contact_mail" className="text-secondary text-[24px]" />
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Contact Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-lg gap-y-md">
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant">Contact Email</label>
              <div className="relative">
                <Icon name="email" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
                <input 
                  type="email" 
                  value={contactEmail} 
                  onChange={e => setContactEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-sm py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="hr@example.com"
                />
              </div>
            </div>

            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant">Contact Phone</label>
              <div className="relative">
                <Icon name="phone" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
                <input 
                  type="tel" 
                  value={contactPhone} 
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-sm py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="+60 12-345 6789"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-sm pb-xl">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center space-x-sm px-6 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-xl hover:bg-secondary hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {isSaving ? (
              <>
                <Icon name="progress_activity" className="animate-spin text-[20px]" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icon name="save" className="text-[20px]" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
