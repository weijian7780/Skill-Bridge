import { NavLink } from "react-router-dom";
import { Icon } from "./Icon.jsx";

const items = [
  { to: "/home", icon: "home", label: "Home" },
  { to: "/cv", icon: "description", label: "CV" },
  { to: "/analysis", icon: "analytics", label: "Analysis" },
  { to: "/roadmap", icon: "map", label: "Roadmap" },
  { to: "/profile", icon: "person", label: "Profile" },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container shadow-md rounded-t-xl">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${
              isActive
                ? "bg-primary-container text-on-primary-container rounded-full px-4 py-1"
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
