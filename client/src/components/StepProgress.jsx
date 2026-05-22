export function StepProgress({ step, total = 4, label }) {
  return (
    <div className="step-progress">
      <div className="step-progress-row">
        <span>Step {step} of {total}</span>
        <span>{label}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}
