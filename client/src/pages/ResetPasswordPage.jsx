import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirm) {
      setIsError(true);
      setFormStatus("Passwords do not match.");
      return;
    }

    const result = await resetPassword(password);
    setIsError(!result.ok);
    setFormStatus(result.reason || "Password updated.");

    if (result.ok) {
      navigate("/home");
    }
  }

  // The recovery link logs the user in with a short-lived recovery session.
  // If there is no session once loading settles, the link was invalid or expired.
  const linkInvalid = !isLoading && !isAuthenticated;

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface">
      <main className="flex-grow flex items-center justify-center px-margin-mobile md:px-margin-desktop py-xl">
        <div className="w-full max-w-[440px] bg-surface-container border border-outline-variant rounded-xl p-md md:p-lg flex flex-col space-y-md shadow-xl shadow-slate-900/10">
          <div className="space-y-xs">
            <h3 className="font-headline-md text-headline-md text-on-surface">Set a new password</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Choose a new password for your SkillBridge account.
            </p>
          </div>

          {linkInvalid ? (
            <div className="space-y-md">
              <div className="rounded-lg border border-error/40 px-sm py-sm font-body-sm text-body-sm text-error">
                This password reset link is invalid or has expired. Please request a new one.
              </div>
              <Link to="/forgot-password" className="font-label-sm text-label-sm text-primary hover:underline">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form className="flex flex-col space-y-md" onSubmit={handleSubmit}>
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">New password</label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40"
                  id="password"
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  required
                  type="password"
                  value={password}
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="confirm">Confirm password</label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40"
                  id="confirm"
                  minLength={6}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="********"
                  required
                  type="password"
                  value={confirm}
                />
              </div>

              {formStatus && (
                <div className={`rounded-lg border px-sm py-sm font-body-sm text-body-sm ${isError ? "border-error/40 text-error" : "border-outline-variant text-on-surface-variant"}`}>
                  {formStatus}
                </div>
              )}

              <button
                className="w-full py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-secondary transition-all active:scale-[0.98]"
                type="submit"
              >
                Update password
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
