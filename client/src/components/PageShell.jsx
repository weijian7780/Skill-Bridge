import { AppHeader } from "./AppHeader.jsx";
import { BottomNav } from "./BottomNav.jsx";

export function PageShell({ children, headerRight = null }) {
  return (
    <div className="bg-background text-on-surface min-h-screen pb-24 md:pb-0">
      <AppHeader headerRight={headerRight} />
      {children}
      <BottomNav />
    </div>
  );
}
