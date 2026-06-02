import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage.jsx";
import { useAuth } from "./state/AuthContext.jsx";

// Route components are code-split so the initial bundle stays small. Each page
// is loaded on demand the first time its route is visited. LoginPage stays
// eager because it is the first paint for unauthenticated visitors.
const lazyPage = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));

const SignupPage = lazyPage(() => import("./pages/SignupPage.jsx"), "SignupPage");
const ForgotPasswordPage = lazyPage(() => import("./pages/ForgotPasswordPage.jsx"), "ForgotPasswordPage");
const ResetPasswordPage = lazyPage(() => import("./pages/ResetPasswordPage.jsx"), "ResetPasswordPage");
const RoleChooserPage = lazyPage(() => import("./pages/RoleChooserPage.jsx"), "RoleChooserPage");
const SignupEmployerPage = lazyPage(() => import("./pages/SignupEmployerPage.jsx"), "SignupEmployerPage");
const HomePage = lazyPage(() => import("./pages/HomePage.jsx"), "HomePage");
const RoadmapPage = lazyPage(() => import("./pages/RoadmapPage.jsx"), "RoadmapPage");
const ProfilePage = lazyPage(() => import("./pages/ProfilePage.jsx"), "ProfilePage");
const JobApplyPage = lazyPage(() => import("./pages/JobApplyPage.jsx"), "JobApplyPage");
const StudentApplicationsPage = lazyPage(() => import("./pages/StudentApplicationsPage.jsx"), "StudentApplicationsPage");
const StudentSetupPage = lazyPage(() => import("./pages/StudentSetupPage.jsx"), "StudentSetupPage");
const SettingsPage = lazyPage(() => import("./pages/SettingsPage.jsx"), "SettingsPage");
const EmployerApp = lazyPage(() => import("./pages/EmployerApp.jsx"), "EmployerApp");

function PageLoading() {
  return (
    <div className="min-h-screen bg-surface text-on-surface grid place-items-center">
      <p className="font-label-md text-label-md text-on-surface-variant">Loading...</p>
    </div>
  );
}

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

function RequireSetup({ children, invert = false }) {
  const { session } = useAuth();
  const userRole = resolveUserRole(session);
  const isSetupCompleted = session?.user?.user_metadata?.setup_completed === true;

  if (userRole === "student") {
    if (invert && isSetupCompleted) {
      return <Navigate to="/home" replace />;
    }
    if (!invert && !isSetupCompleted) {
      return <Navigate to="/student/setup" replace />;
    }
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
    if (role === "student" && session?.user?.user_metadata?.setup_completed !== true) {
      return <Navigate to="/student/setup" replace />;
    }
    return <Navigate to={role === "employer" ? "/employer/dashboard" : "/home"} replace />;
  }

  return <LoginPage />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route path="/" element={<AuthRedirect />} />
      <Route path="/signup" element={<RoleChooserPage />} />
      <Route path="/signup/student" element={<SignupPage />} />
      <Route path="/signup/employer" element={<SignupEmployerPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Student routes */}
      <Route path="/student/setup" element={<RequireAuth><RequireRole role="student"><RequireSetup invert><StudentSetupPage /></RequireSetup></RequireRole></RequireAuth>} />
      <Route path="/home" element={<RequireAuth><RequireRole role="student"><RequireSetup><HomePage /></RequireSetup></RequireRole></RequireAuth>} />
      <Route path="/cv" element={<RequireAuth><RequireRole role="student"><RequireSetup><Navigate to="/home" replace /></RequireSetup></RequireRole></RequireAuth>} />
      <Route path="/target" element={<RequireAuth><RequireRole role="student"><RequireSetup><Navigate to="/home" replace /></RequireSetup></RequireRole></RequireAuth>} />
      <Route path="/analysis" element={<RequireAuth><RequireRole role="student"><RequireSetup><Navigate to="/home" replace /></RequireSetup></RequireRole></RequireAuth>} />
      <Route path="/roadmap" element={<RequireAuth><RequireRole role="student"><RequireSetup><RoadmapPage /></RequireSetup></RequireRole></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><RequireRole role="student"><RequireSetup><ProfilePage /></RequireSetup></RequireRole></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><RequireRole role="student"><RequireSetup><SettingsPage /></RequireSetup></RequireRole></RequireAuth>} />
      <Route path="/jobs" element={<RequireAuth><RequireRole role="student"><RequireSetup><Navigate to="/home#jobs" replace /></RequireSetup></RequireRole></RequireAuth>} />
      <Route path="/applications" element={<RequireAuth><RequireRole role="student"><RequireSetup><StudentApplicationsPage /></RequireSetup></RequireRole></RequireAuth>} />
      <Route path="/jobs/:id/apply" element={<RequireAuth><RequireRole role="student"><RequireSetup><JobApplyPage /></RequireSetup></RequireRole></RequireAuth>} />

      {/* Employer routes */}
      <Route path="/employer/*" element={<RequireAuth><RequireRole role="employer"><EmployerApp /></RequireRole></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
