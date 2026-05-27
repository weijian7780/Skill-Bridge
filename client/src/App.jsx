import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage.jsx";
import { SignupPage } from "./pages/SignupPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { RoadmapPage } from "./pages/RoadmapPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { useAuth } from "./state/AuthContext.jsx";

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/cv" element={<RequireAuth><Navigate to="/home" replace /></RequireAuth>} />
      <Route path="/target" element={<RequireAuth><Navigate to="/home" replace /></RequireAuth>} />
      <Route path="/analysis" element={<RequireAuth><Navigate to="/home" replace /></RequireAuth>} />
      <Route path="/roadmap" element={<RequireAuth><RoadmapPage /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
