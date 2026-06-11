import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthMarketingPanel } from "../components/AuthMarketingPanel.jsx";
import { useAuth } from "../state/AuthContext.jsx";

function roleRedirectPath(session) {
  const role = session?.user?.user_metadata?.role;
  return role === "employer" ? "/employer/dashboard" : "/home";
}

export function LoginPage() {
  const navigate = useNavigate();
  const { authStatus, config, isAuthenticated, isLoading, login, loginWithGoogle, session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(roleRedirectPath(session));
    }
  }, [isAuthenticated, isLoading, navigate, session]);

  async function handleLogin(event) {
    event.preventDefault();
    const result = await login({ email, password });
    setIsError(!result.ok);
    setFormStatus(result.reason || "Signed in.");

    if (result.ok) {
      const role = result.session?.user?.user_metadata?.role;
      navigate(role === "employer" ? "/employer/dashboard" : "/home");
    }
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface">
      <main className="flex-grow flex items-center justify-center relative overflow-hidden px-margin-mobile md:px-margin-desktop py-xl">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
          <svg height="100%" viewBox="0 0 1000 1000" width="100%" xmlns="http://www.w3.org/2000/svg">
            <path className="bridge-path" d="M0,800 Q250,750 500,500 T1000,200" fill="none" stroke="#0b63ce" strokeWidth="2" />
            <path className="bridge-path" d="M0,850 Q250,800 500,550 T1000,250" fill="none" opacity="0.5" stroke="#0b63ce" strokeWidth="1" />
            <path className="bridge-path" d="M0,900 Q250,850 500,600 T1000,300" fill="none" opacity="0.3" stroke="#0b63ce" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center relative z-10">
          <AuthMarketingPanel />

          <section className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[440px] bg-surface-container border border-outline-variant rounded-xl p-md md:p-lg flex flex-col space-y-md shadow-xl shadow-slate-900/10">
              <div className="space-y-xs">
                <h3 className="font-headline-md text-headline-md text-on-surface">Welcome back</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Access your personalized career roadmap.</p>
              </div>
              <div className="flex flex-col space-y-sm">
                <button className="flex items-center justify-center space-x-sm w-full py-sm bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg transition-all active:scale-[0.98]" onClick={loginWithGoogle} type="button">
                  <span className="w-5 h-5 rounded-full bg-white text-[#4285F4] grid place-items-center font-bold text-xs">G</span>
                  <span className="font-label-md text-label-md text-on-surface">Continue with Google</span>
                </button>
                <p className="text-center font-label-sm text-label-sm text-on-surface-variant">For student accounts only.</p>
              </div>
              <div className="flex items-center space-x-sm">
                <hr className="flex-grow border-outline-variant" />
                <span className="font-label-sm text-label-sm text-on-surface-variant px-base">OR</span>
                <hr className="flex-grow border-outline-variant" />
              </div>
              <form className="flex flex-col space-y-md" onSubmit={handleLogin}>
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">Email</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required type="email" value={email} />
                </div>
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40" id="password" minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="********" required type="password" value={password} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-xs cursor-pointer group">
                    <input className="w-4 h-4 rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary focus:ring-offset-surface" type="checkbox" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-on-surface">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="font-label-sm text-label-sm text-primary hover:underline">Forgot password?</Link>
                </div>
                {(formStatus || authStatus) && (
                  <div className={`rounded-lg border px-sm py-sm font-body-sm text-body-sm ${(isError || !config.configured) ? "border-error/40 text-error" : "border-outline-variant text-on-surface-variant"}`}>
                    {formStatus || authStatus}
                  </div>
                )}
                <div className="flex flex-col space-y-sm pt-base">
                <button className="w-full py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-secondary transition-all active:scale-[0.98]">
                    Login
                  </button>
                  <div className="text-center pt-xs">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Don't have an account? </span>
                    <Link to="/signup" className="font-label-sm text-label-sm text-primary hover:underline">Sign up</Link>
                  </div>
                </div>
              </form>
              <p className="text-center font-body-sm text-body-sm text-on-surface-variant pt-sm">
                By continuing, you agree to SkillBridge's <a className="text-primary hover:underline" href="#">Terms of Service</a>.
              </p>
            </div>
          </section>
        </div>
      </main>
      <footer className="py-md px-margin-mobile md:px-margin-desktop border-t border-outline-variant/10">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-sm">
          <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">© 2024 SkillBridge Malaysia. All rights reserved.</p>
          <div className="flex items-center space-x-md">
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
