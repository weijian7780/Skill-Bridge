import { Navigate, Route, Routes } from "react-router-dom";
import { EmployerSidebar } from "../components/EmployerSidebar.jsx";
import { EmployerDashboardPage } from "./EmployerDashboardPage.jsx";
import { CompanyProfilePage } from "./employer/CompanyProfilePage.jsx";
import { ManageJobsPage } from "./employer/ManageJobsPage.jsx";
import { EditJobPostPage } from "./employer/EditJobPostPage.jsx";
import { ApplicantsPage } from "./employer/ApplicantsPage.jsx";
import { ApplicantDetailsPage } from "./employer/ApplicantDetailsPage.jsx";

export function EmployerApp() {
  return (
    <div className="flex min-h-screen bg-surface">
      <EmployerSidebar />
      <main className="flex-1 ml-64 p-md md:p-lg overflow-y-auto">
        <Routes>
          <Route path="dashboard" element={<EmployerDashboardPage />} />
          <Route path="profile" element={<CompanyProfilePage />} />
          <Route path="jobs" element={<ManageJobsPage />} />
          <Route path="jobs/new" element={<EditJobPostPage />} />
          <Route path="jobs/:id/edit" element={<EditJobPostPage />} />
          <Route path="applicants" element={<ApplicantsPage />} />
          <Route path="applicants/:id" element={<ApplicantDetailsPage />} />
          <Route path="*" element={<Navigate to="/employer/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
