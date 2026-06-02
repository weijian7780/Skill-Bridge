import { useState } from "react";
import { Icon } from "../../components/Icon.jsx";
import { useEmployerSubscription } from "../../state/useEmployerSubscription.js";

const PLAN_FEATURES = [
  "Post unlimited internship & graduate jobs",
  "Search candidates by skill type and location",
  "Access AI-verified candidate skill profiles",
  "Review and manage applicants",
];

export function SubscriptionPage() {
  const { subscription, active, loading, status, subscribe, cancel } = useEmployerSubscription();
  const [busy, setBusy] = useState(false);

  async function handleSubscribe() {
    setBusy(true);
    await subscribe("professional");
    setBusy(false);
  }

  async function handleCancel() {
    setBusy(true);
    await cancel();
    setBusy(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mb-sm">
        Employer Subscription
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
        Unlock candidate search, AI-verified skill profiles, and job posting.
      </p>

      <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg shadow-sm">
        <div className="flex items-start justify-between mb-md">
          <div>
            <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Professional</p>
            <p className="font-headline-lg text-headline-lg text-on-surface mt-xs">
              RM300<span className="font-body-md text-body-md text-on-surface-variant">/month</span>
            </p>
          </div>
          <span className={`inline-flex items-center gap-xs rounded-full px-sm py-xs font-label-sm text-label-sm ${active ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-container-high text-on-surface-variant"}`}>
            <Icon name={active ? "check_circle" : "lock"} className="text-[16px]" />
            {loading ? "Loading..." : active ? "Active" : "Not subscribed"}
          </span>
        </div>

        <ul className="space-y-sm mb-lg">
          {PLAN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-sm font-body-md text-body-md text-on-surface">
              <Icon name="check" className="text-primary text-[20px] mt-[2px] shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {active ? (
          <div className="flex items-center justify-between gap-sm">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {subscription?.expires_at ? `Renews ${new Date(subscription.expires_at).toLocaleDateString()}` : "Subscription active"}
            </p>
            <button
              onClick={handleCancel}
              disabled={busy}
              className="px-md py-sm rounded-lg border border-outline-variant font-label-md text-label-md text-on-surface hover:bg-surface-container-high disabled:opacity-60"
            >
              Cancel subscription
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={busy}
            className="w-full py-sm bg-primary text-on-primary font-label-lg text-label-lg rounded-xl hover:bg-secondary transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Processing..." : "Subscribe now"}
          </button>
        )}

        {status && <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">{status}</p>}
      </div>

      <p className="font-label-sm text-label-sm text-on-surface-variant mt-md">
        Demo billing — activating is a mock checkout (no payment is taken).
      </p>
    </div>
  );
}
