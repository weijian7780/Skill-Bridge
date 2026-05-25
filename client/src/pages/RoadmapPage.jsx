import { Link } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { buildRoadmapPageView } from "../services/roadmap/roadmapDisplay.js";
import { useAppState } from "../state/AppStateContext.jsx";

export function RoadmapPage() {
  const { analysis, careerTarget, roadmapPlan } = useAppState();
  const view = buildRoadmapPageView({
    careerTarget,
    analysis,
    roadmapPlan,
  });

  return (
    <PageShell>
      <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop pt-24 pb-12">
        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-primary font-label-sm uppercase tracking-wider mb-2 block">Step 4 of 4</span>
              <h2 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface">
                {view.heroTitle}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-sm max-w-2xl">
                {view.heroSubtitle}
              </p>
            </div>
            <div className="inline-flex items-center gap-xs rounded-lg border border-primary/30 bg-primary/10 px-sm py-xs text-primary font-label-md text-label-md">
              <Icon name={view.isGenerated ? "route" : "pending"} className="text-[18px]" />
              {view.sourceLabel}
            </div>
          </div>
        </section>

        {!view.isGenerated ? (
          <section className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
              <div>
                <div className="flex items-center gap-sm text-primary mb-sm">
                  <Icon name="analytics" />
                  <h3 className="font-headline-md text-headline-md">Analysis required</h3>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                  {view.emptyStateMessage}
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center gap-xs rounded-xl bg-primary px-lg py-sm font-label-md text-label-md text-on-primary active:scale-[0.98]"
                to="/home"
              >
                Open Workspace
                <Icon name="arrow_forward" />
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-sm mb-gutter">
              {view.summaryCards.map((card) => (
                <article key={card.label} className="bg-surface-container border border-outline-variant rounded-xl p-md">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="font-headline-lg text-headline-lg text-primary mt-xs">
                    {card.value}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                    {card.detail}
                  </p>
                </article>
              ))}
            </section>

            {view.hasNoGaps ? (
              <section className="bg-surface-container border border-primary/20 rounded-xl p-lg mb-gutter">
                <div className="flex items-start gap-sm">
                  <Icon name="check_circle" className="text-primary mt-1" />
                  <div>
                    <h3 className="font-headline-md text-headline-md text-primary mb-xs">No roadmap items needed yet</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                      The current market evidence did not find a missing repeated skill for this target. Keep the CV evidence current, reload jobs later, or change the target role/location if you want a stricter comparison.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <section className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-x-gutter">
                <div className="hidden md:block absolute left-1/2 -translate-x-1/2 h-full w-[2px] timeline-line top-4" />
                {view.pathItems.map((item, index) => {
                  const left = index % 2 === 0;
                  const card = (
                    <div className={`${left ? "md:text-right" : ""} mb-12`}>
                      <article className={`${item.isActive ? "bg-surface-container" : "bg-surface-container-low"} p-6 rounded-xl border border-outline-variant hover:border-primary transition-colors relative`}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 ${item.isActive ? "bg-primary-container/10 text-primary border-primary/20" : "bg-secondary-container/20 text-on-secondary-container border-outline-variant"} border rounded-full mb-4`}>
                          <Icon name={item.statusIcon} filled={item.isActive} className="text-[16px]" />
                          <span className="font-label-sm text-label-sm">{item.statusLabel}</span>
                        </div>

                        <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-xs">
                          {item.phase} | {item.skill}
                        </p>
                        <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">
                          {item.title}
                        </h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                          {item.what}
                        </p>

                        {item.companyChips.length > 0 && (
                          <div className={`flex flex-wrap gap-xs mb-md ${left ? "md:justify-end" : ""}`}>
                            {item.companyChips.map((company) => (
                              <span key={company} className="rounded-full bg-surface-container-highest border border-outline-variant px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                                {company}
                              </span>
                            ))}
                            {item.extraCompanyCount > 0 && (
                              <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-1 font-label-sm text-label-sm text-primary">
                                +{item.extraCompanyCount} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="space-y-md border-t border-outline-variant pt-md">
                          <div>
                            <span className="font-label-sm text-label-sm text-primary block mb-2">Learning focus</span>
                            <div className={`flex flex-wrap gap-xs ${left ? "md:justify-end" : ""}`}>
                              {item.learningFocus.map((focus) => (
                                <span key={focus} className="rounded-lg bg-surface-container-high px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                                  {focus}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="font-label-sm text-label-sm text-primary block mb-2">Project tasks</span>
                            <ul className={`space-y-2 ${left ? "md:ml-auto" : ""}`}>
                              {item.projectTasks.map((task) => (
                                <li key={task} className={`flex gap-xs font-body-sm text-body-sm text-on-surface ${left ? "md:flex-row-reverse" : ""}`}>
                                  <Icon name="check_circle" className="text-primary text-[16px] mt-[2px] shrink-0" />
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="font-label-sm text-label-sm text-primary block mb-1">Timeline</span>
                            <p className="font-body-sm text-body-sm text-on-surface">{item.when}</p>
                          </div>
                          <div>
                            <span className="font-label-sm text-label-sm text-primary block mb-1">Portfolio output</span>
                            <p className="font-body-sm text-body-sm text-on-surface">{item.portfolioOutput}</p>
                          </div>
                          {item.resources.length > 0 && (
                            <div>
                              <span className="font-label-sm text-label-sm text-primary block mb-2">Resources</span>
                              <div className={`flex flex-wrap gap-xs ${left ? "md:justify-end" : ""}`}>
                                {item.resources.map((resource) => (
                                  resource.url ? (
                                    <a
                                      key={`${resource.label}-${resource.url}`}
                                      className="inline-flex items-center gap-xs rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary hover:bg-primary/15"
                                      href={resource.url}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      <Icon name="open_in_new" className="text-[16px]" />
                                      {resource.label}
                                    </a>
                                  ) : (
                                    <span key={resource.label} className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                                      <Icon name="link" className="text-[16px]" />
                                      {resource.label}
                                    </span>
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={`hidden md:block absolute top-8 ${left ? "-right-[36px]" : "-left-[36px]"} w-4 h-4 ${item.isActive ? "bg-primary" : "bg-outline-variant"} rounded-full border-4 border-surface z-10`} />
                      </article>
                    </div>
                  );

                  return left ? (
                    <div key={`${item.stepLabel}-${item.title}`} className="contents">
                      {card}
                      <div className="hidden md:block" />
                      <div className="hidden md:block" />
                    </div>
                  ) : (
                    <div key={`${item.stepLabel}-${item.title}`} className="contents">
                      <div className="hidden md:block" />
                      <div className="hidden md:block" />
                      {card}
                    </div>
                  );
                })}
              </section>
            )}

            <section className="mt-4 bg-surface-container-high rounded-xl p-md border border-primary/20">
              <div className="flex items-start gap-sm">
                <Icon name="fact_check" className="text-primary mt-1" />
                <div>
                  <h4 className="font-headline-md text-headline-md text-primary mb-xs">Generation basis</h4>
                  <p className="font-body-md text-body-md text-on-surface">
                    {view.basisOverview}
                  </p>
                  {view.assumptions.length > 0 && (
                    <div className="mt-sm flex flex-wrap gap-xs">
                      {view.assumptions.map((assumption) => (
                        <span key={assumption} className="rounded-full bg-surface-container-lowest border border-outline-variant px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                          {assumption}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </PageShell>
  );
}
