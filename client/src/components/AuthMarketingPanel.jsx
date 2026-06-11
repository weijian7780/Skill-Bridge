import { Icon } from "./Icon.jsx";

const sloganParts = [
  { text: "Your Skills", icon: "psychology" },
  { text: "Your Map", icon: "route" },
  { text: "Your Move", icon: "rocket_launch" },
];

export function AuthMarketingPanel() {
  return (
    <section className="lg:col-span-7 flex flex-col space-y-md">
      <div className="flex items-center -ml-2 mb-base">
        <img src="/skillbridge-logo.png" alt="SkillBridge" className="h-40 md:h-56 w-auto max-w-full object-contain" />
      </div>

      <div className="max-w-2xl space-y-md">
        <div className="flex w-fit items-center gap-xs rounded-full border border-outline-variant bg-surface-container/80 px-sm py-xs shadow-sm">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-on-primary">
            <Icon name="auto_awesome" className="text-[14px]" />
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            AI career readiness for Malaysian undergraduates
          </span>
        </div>

        <div className="space-y-sm">
          <h2 className="max-w-xl font-extrabold text-[32px] leading-[38px] tracking-normal text-on-background md:text-[42px] md:leading-[50px]">
            Graduate with a plan,
            <span className="block text-primary">not a guess.</span>
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            SkillBridge turns your CV into skill gaps, priorities, and a focused career roadmap.
          </p>
        </div>

        <div className="hidden lg:flex w-fit items-center rounded-xl border border-outline-variant bg-surface-container/90 p-xs shadow-sm">
          {sloganParts.map((part, index) => (
            <div className="flex items-center" key={part.text}>
              <span className="flex items-center gap-xs rounded-lg px-sm py-xs">
                <Icon name={part.icon} className="text-[18px] text-primary" />
                <span className="font-label-md text-label-md text-on-surface">{part.text}</span>
              </span>
              {index < sloganParts.length - 1 && (
                <Icon name="arrow_forward" className="mx-xs text-[18px] text-outline" />
              )}
            </div>
          ))}
        </div>

        <p className="hidden max-w-xl border-l-4 border-tertiary pl-sm font-body-sm text-body-sm text-on-surface-variant lg:block">
          Designed around the real transition from campus learning to industry expectations.
        </p>
      </div>
    </section>
  );
}
