import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "./Icon.jsx";
import { useAuth } from "../state/AuthContext.jsx";

const navItems = [
  { to: "/employer/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/employer/jobs", icon: "work", label: "Jobs" },
  { to: "/employer/applicants", icon: "group", label: "Applicants" },
  { to: "/employer/profile", icon: "apartment", label: "Company Profile" },
];

export function EmployerSidebar() {
  const { logout, session } = useAuth();
  const navigate = useNavigate();
  const companyName = session?.user?.user_metadata?.company_name ?? "My Company";

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col"
      style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}>

      {/* Brand */}
      <div className="px-md py-lg flex items-center space-x-sm border-b border-white/10">
        <Icon name="conversion_path" className="text-blue-400 text-[28px]" />
        <div>
          <h1 className="text-white font-semibold text-[16px] leading-tight">SkillBridge</h1>
          <p className="text-slate-400 text-[11px] leading-tight mt-0.5">Employer Portal</p>
        </div>
      </div>

      {/* Company */}
      <div className="px-md py-sm">
        <div className="flex items-center space-x-sm px-sm py-sm rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Icon name="apartment" className="text-blue-400 text-[18px]" />
          </div>
          <span className="text-white text-[13px] font-medium truncate">{companyName}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-sm py-sm space-y-xs">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center space-x-sm px-sm py-[10px] rounded-lg transition-all text-[14px] font-medium ${
                isActive
                  ? "bg-blue-500/15 text-blue-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <Icon name={icon} className="text-[20px]" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-sm py-md border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-sm px-sm py-[10px] rounded-lg text-slate-400 hover:bg-white/5 hover:text-red-400 transition-all w-full text-[14px] font-medium"
        >
          <Icon name="logout" className="text-[20px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
