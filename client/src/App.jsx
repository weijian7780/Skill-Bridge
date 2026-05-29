import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage.jsx";
import { SignupPage } from "./pages/SignupPage.jsx";
import { RoleChooserPage } from "./pages/RoleChooserPage.jsx";
import { SignupEmployerPage } from "./pages/SignupEmployerPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { RoadmapPage } from "./pages/RoadmapPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { JobApplyPage } from "./pages/JobApplyPage.jsx";
import { StudentApplicationsPage } from "./pages/StudentApplicationsPage.jsx";
import { EmployerApp } from "./pages/EmployerApp.jsx";
import { useAuth } from "./state/AuthContext.jsx";

function resolveUserRole(session) {
  return session?.user?.user_metadata?.role ?? "student";
}

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface grid place-items-center">
        <p className="font-label-md text-label-md text-on-surface-variant">Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RequireRole({ role, children }) {
  const { session } = useAuth();
  const userRole = resolveUserRole(session);

  if (userRole !== role) {
    const fallback = userRole === "employer" ? "/employer/dashboard" : "/home";
    return <Navigate to={fallback} replace />;
  }

  return children;
}

function AuthRedirect() {
  const { isAuthenticated, isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface grid place-items-center">
        <p className="font-label-md text-label-md text-on-surface-variant">Checking session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const role = resolveUserRole(session);
    return <Navigate to={role === "employer" ? "/employer/dashboard" : "/home"} replace />;
  }

  return <LoginPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthRedirect />} />
      <Route path="/signup" element={<RoleChooserPage />} />
      <Route path="/signup/student" element={<SignupPage />} />
      <Route path="/signup/employer" element={<SignupEmployerPage />} />

      {/* Student routes */}
      <Route path="/home" element={<RequireAuth><RequireRole role="student"><HomePage /></RequireRole></RequireAuth>} />
      <Route path="/cv" element={<RequireAuth><RequireRole role="student"><Navigate to="/home" replace /></RequireRole></RequireAuth>} />
      <Route path="/target" element={<RequireAuth><RequireRole role="student"><Navigate to="/home" replace /></RequireRole></RequireAuth>} />
      <Route path="/analysis" element={<RequireAuth><RequireRole role="student"><Navigate to="/home" replace /></RequireRole></RequireAuth>} />
      <Route path="/roadmap" element={<RequireAuth><RequireRole role="student"><RoadmapPage /></RequireRole></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><RequireRole role="student"><ProfilePage /></RequireRole></RequireAuth>} />
      <Route path="/jobs" element={<RequireAuth><RequireRole role="student"><Navigate to="/home#jobs" replace /></RequireRole></RequireAuth>} />
      <Route path="/applications" element={<RequireAuth><RequireRole role="student"><StudentApplicationsPage /></RequireRole></RequireAuth>} />
      <Route path="/jobs/:id/apply" element={<RequireAuth><RequireRole role="student"><JobApplyPage /></RequireRole></RequireAuth>} />

      {/* Employer routes */}
      <Route path="/employer/*" element={<RequireAuth><RequireRole role="employer"><EmployerApp /></RequireRole></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
