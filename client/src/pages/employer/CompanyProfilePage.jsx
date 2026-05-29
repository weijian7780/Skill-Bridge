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
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-md md:p-xl flex items-center justify-center">
        <p className="font-label-md text-label-md text-on-surface-variant">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-md md:p-xl overflow-y-auto max-w-4xl">
      <div className="mb-lg">
        <h1 className="font-headline-md text-headline-md text-on-surface">Company Profile</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage your organization's details visible to students.</p>
      </div>

      <form onSubmit={handleSave} className="bg-surface-container border border-outline-variant rounded-xl p-md md:p-lg flex flex-col space-y-md shadow-sm">
        {statusMessage && (
          <div className={`p-sm rounded-lg font-body-sm text-body-sm ${statusMessage.startsWith("Error") ? "bg-error/10 text-error" : "bg-primary/10 text-primary"}`}>
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Company Name *</label>
            <input 
              required
              type="text" 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Industry</label>
            <input 
              type="text" 
              value={industry} 
              onChange={e => setIndustry(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Company Size</label>
            <select 
              value={companySize} 
              onChange={e => setCompanySize(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">Select size...</option>
              <option value="startup">Startup (1-10)</option>
              <option value="small">Small (11-50)</option>
              <option value="medium">Medium (51-200)</option>
              <option value="large">Large (201-1000)</option>
              <option value="enterprise">Enterprise (1000+)</option>
            </select>
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Website</label>
            <input 
              type="url" 
              value={website} 
              onChange={e => setWebsite(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              placeholder="https://"
            />
          </div>

          <div className="space-y-xs md:col-span-2">
            <label className="font-label-md text-label-md text-on-surface-variant">Description</label>
            <textarea 
              rows={4}
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-y"
              placeholder="Tell students about your company..."
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Contact Email</label>
            <input 
              type="email" 
              value={contactEmail} 
              onChange={e => setContactEmail(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Contact Phone</label>
            <input 
              type="tel" 
              value={contactPhone} 
              onChange={e => setContactPhone(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="pt-md flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center space-x-xs px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-secondary transition-all disabled:opacity-50"
          >
            <Icon name="save" className="text-[18px]" />
            <span>{isSaving ? "Saving..." : "Save Profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
