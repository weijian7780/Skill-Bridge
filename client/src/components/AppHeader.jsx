import { NavLink } from "react-router-dom";
import { Icon } from "./Icon.jsx";
import { appNavigationItems } from "../services/navigation/appNavigation.js";

export function AppHeader({ simple = false }) {
  return (
    <header className="fixed top-0 w-full bg-surface-container/95 backdrop-blur flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 z-50 border-b border-outline-variant shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-label-md shadow-sm">
          AM
        </div>
        <span className="font-headline-md text-headline-md font-bold text-on-surface">SkillBridge</span>
      </div>

      {!simple && (
        <nav className="hidden md:flex gap-8 items-center">
          {appNavigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `font-label-md text-label-md transition-colors px-3 py-2 rounded-lg ${
                  isActive ? "bg-primary-container text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 text-on-surface-variant">
        <Icon name="notifications" />
      </button>
    </header>
  );
}
