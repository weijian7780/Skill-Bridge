import { NavLink } from "react-router-dom";
import { Icon } from "./Icon.jsx";
import { appNavigationItems } from "../services/navigation/appNavigation.js";

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container border-t border-outline-variant shadow-[0_-10px_28px_rgb(23_32_51_/_10%)] rounded-t-xl">
      {appNavigationItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${
              isActive
                ? "bg-primary-container text-primary rounded-full px-4 py-1"
                : "text-on-surface-variant hover:text-primary"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} filled={isActive} />
              <span className="font-label-md text-label-md">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
