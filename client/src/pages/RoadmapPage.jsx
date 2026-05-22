import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { useAppState } from "../state/AppStateContext.jsx";

export function RoadmapPage() {
  const { roadmap } = useAppState();
  const visibleRoadmap = roadmap.slice(0, 3);

  return (
    <PageShell>
      <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop pt-24 pb-12">
        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-primary font-label-sm uppercase tracking-wider mb-2 block">Step 4 of 4</span>
              <h2 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface">
                My Career Roadmap
              </h2>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-label-md text-label-md text-on-surface-variant mb-2">25% Complete</span>
              <div className="w-full md:w-64 h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary-container w-[25%] transition-all duration-1000" />
              </div>
            </div>
          </div>
        </section>

        <section className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-x-gutter">
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 h-full w-[2px] timeline-line top-4" />
          {visibleRoadmap.map((item, index) => {
            const active = index === 0;
            const left = index % 2 === 0;
            const card = (
              <div className={`${left ? "md:text-right" : ""} mb-12`}>
                <div className={`${active ? "bg-surface-container" : "bg-surface-container-low opacity-85"} p-6 rounded-xl border border-outline-variant hover:border-primary transition-colors relative`}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 ${active ? "bg-primary-container/10 text-primary border-primary/20" : "bg-secondary-container/20 text-on-secondary-container border-outline-variant"} border rounded-full mb-4`}>
                    <Icon name={active ? "sync" : index === 1 ? "schedule" : "lock"} filled={active} className="text-[16px]" />
                    <span className="font-label-sm text-label-sm">{active ? "In Progress" : index === 1 ? "Upcoming" : "Locked"}</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">Month {item.month}: {item.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">{item.description}</p>
                  <div className="space-y-4 border-t border-outline-variant pt-4">
                    <div>
                      <span className="font-label-sm text-label-sm text-primary block mb-1">Reason</span>
                      <p className="font-body-sm text-body-sm text-on-surface">{item.reason}</p>
                    </div>
                    <a className="inline-flex items-center gap-2 text-primary hover:underline font-label-md text-label-md" href="#">
                      <Icon name="link" className="text-[18px]" />
                      Resource: {item.resource}
                    </a>
                  </div>
                  <div className={`hidden md:block absolute top-8 ${left ? "-right-[36px]" : "-left-[36px]"} w-4 h-4 ${active ? "bg-primary" : "bg-outline-variant"} rounded-full border-4 border-surface z-10`} />
                </div>
              </div>
            );
            return left ? (
              <div key={item.title} className="contents">
                {card}
                <div className="hidden md:block" />
                <div className="hidden md:block" />
              </div>
            ) : (
              <div key={item.title} className="contents">
                <div className="hidden md:block" />
                <div className="hidden md:block" />
                {card}
              </div>
            );
          })}
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="md:col-span-2 bg-surface-container-high rounded-xl p-8 border border-primary/20 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="font-headline-lg text-headline-lg text-primary mb-2">Why this path?</h4>
              <p className="font-body-lg text-body-lg text-on-surface max-w-lg">
                This sequence stacks core technical skills before moving to infrastructure, matching the SkillBridge demo flow and the selected Data Analyst target.
              </p>
            </div>
            <Icon name="trending_up" className="absolute -bottom-4 -right-4 text-[160px] text-primary/5 group-hover:text-primary/10 transition-colors pointer-events-none" />
          </div>
          <div className="bg-primary-container p-8 rounded-xl flex flex-col justify-between active:scale-[0.98] transition-transform cursor-pointer">
            <h4 className="font-headline-md text-headline-md text-on-primary">Need help?</h4>
            <p className="font-body-sm text-body-sm text-on-primary/80 mb-6">Speak with a career mentor about your roadmap.</p>
            <button className="bg-on-primary text-primary-fixed py-3 px-6 rounded-lg font-label-md text-label-md text-center">
              Book a Session
            </button>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
