import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export function ForgotPasswordPage() {
  const { config, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await sendPasswordReset(email);
    setIsError(!result.ok);

    if (result.ok) {
      setSent(true);
      setFormStatus("If an account exists for that email, a password reset link is on its way.");
    } else {
      setFormStatus(result.reason || "Could not send the reset email.");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface">
      <main className="flex-grow flex items-center justify-center px-margin-mobile md:px-margin-desktop py-xl">
        <div className="w-full max-w-[440px] bg-surface-container border border-outline-variant rounded-xl p-md md:p-lg flex flex-col space-y-md shadow-xl shadow-slate-900/10">
          <div className="space-y-xs">
            <h3 className="font-headline-md text-headline-md text-on-surface">Reset your password</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Enter your account email and we&apos;ll send you a link to set a new password.
            </p>
          </div>

          <form className="flex flex-col space-y-md" onSubmit={handleSubmit}>
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">Email</label>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="student@university.edu.my"
                required
                type="email"
                value={email}
              />
            </div>

            {formStatus && (
              <div className={`rounded-lg border px-sm py-sm font-body-sm text-body-sm ${(isError || !config.configured) ? "border-error/40 text-error" : "border-outline-variant text-on-surface-variant"}`}>
                {formStatus}
              </div>
            )}

            <button
              className="w-full py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-secondary transition-all active:scale-[0.98] disabled:opacity-60"
              disabled={sent}
              type="submit"
            >
              {sent ? "Email sent" : "Send reset link"}
            </button>
          </form>

          <div className="text-center pt-xs">
            <Link to="/" className="font-label-sm text-label-sm text-primary hover:underline">Back to login</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
