export function SkillChip({ children, tone = "neutral" }) {
  return <span className={`skill-chip skill-chip-${tone}`}>{children}</span>;
}
