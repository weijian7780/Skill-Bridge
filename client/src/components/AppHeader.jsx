import { NavLink } from "react-router-dom";
import { Icon } from "./Icon.jsx";

const navItems = [
  { to: "/home", label: "Home" },
  { to: "/cv", label: "CV" },
  { to: "/analysis", label: "Analysis" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/profile", label: "Profile" },
];

export function AppHeader({ simple = false }) {
  return (
    <header className="fixed top-0 w-full bg-surface flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 z-50 border-b border-outline-variant/20">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-label-md">
          AM
        </div>
        <span className="font-headline-md text-headline-md font-bold text-primary">SkillBridge</span>
      </div>

      {!simple && (
        <nav className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `font-label-md text-label-md hover:bg-surface-container-high transition-colors px-3 py-1 rounded-lg ${
                  isActive ? "text-primary font-bold" : "text-on-surface-variant"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 text-primary">
        <Icon name="notifications" />
      </button>
    </header>
  );
}
