import { NavLink } from "react-router-dom";
import { Icon } from "./Icon.jsx";
import { appNavigationItems } from "../services/navigation/appNavigation.js";

export function AppHeader({ simple = false, headerRight = null }) {
  return (
    <header className="fixed top-0 w-full bg-surface-container/95 backdrop-blur flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 z-50 border-b border-outline-variant shadow-sm">
      <div className="flex items-center gap-4">
        <img src="/skillbridge-logo.png" alt="SkillBridge" className="h-14 w-auto" />
      </div>

      {!simple && (
        <nav className="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
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

      <div className="flex items-center gap-xs">
        {!simple && (
          <NavLink
            to="/saved"
            title="Saved jobs"
            aria-label="Saved jobs"
            className={({ isActive }) =>
              `flex h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-95 ${
                isActive ? "bg-primary-container text-primary" : "text-on-surface-variant hover:bg-surface-container-high"
              }`
            }
          >
            {({ isActive }) => <Icon name="bookmarks" filled={isActive} />}
          </NavLink>
        )}
        {headerRight}
      </div>
    </header>
  );
}
