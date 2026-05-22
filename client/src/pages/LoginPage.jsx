import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const { authStatus, config, isAuthenticated, isLoading, login, loginWithGoogle, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formStatus, setFormStatus] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, isLoading, navigate]);

  async function handleLogin(event) {
    event.preventDefault();
    const result = await login({ email, password });
    setFormStatus(result.reason || "Signed in.");

    if (result.ok) {
      navigate("/home");
    }
  }

  async function handleCreateAccount() {
    const result = await register({ email, password });
    setFormStatus(result.reason || "Account created.");

    if (result.ok && result.session) {
      navigate("/home");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface">
      <main className="flex-grow flex items-center justify-center relative overflow-hidden px-margin-mobile md:px-margin-desktop py-xl">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
          <svg height="100%" viewBox="0 0 1000 1000" width="100%" xmlns="http://www.w3.org/2000/svg">
            <path className="bridge-path" d="M0,800 Q250,750 500,500 T1000,200" fill="none" stroke="#57f1db" strokeWidth="2" />
            <path className="bridge-path" d="M0,850 Q250,800 500,550 T1000,250" fill="none" opacity="0.5" stroke="#57f1db" strokeWidth="1" />
            <path className="bridge-path" d="M0,900 Q250,850 500,600 T1000,300" fill="none" opacity="0.3" stroke="#57f1db" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center relative z-10">
          <section className="lg:col-span-7 flex flex-col space-y-md">
            <div className="flex items-center space-x-sm mb-base">
              <Icon name="conversion_path" className="text-primary text-[32px]" />
              <h1 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-primary">
                SkillBridge
              </h1>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-background max-w-xl">
              Bridge your skills to your future career
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
              AI-powered career readiness for Malaysian undergraduates. Navigating the transition from university to industry with precision and data-driven insights.
            </p>
            <div className="hidden lg:block pt-lg">
              <div className="p-md bg-surface-container border border-outline-variant rounded-xl max-w-sm">
                <div className="flex items-start space-x-sm">
                  <Icon name="verified_user" className="text-primary" />
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Built for Universities</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Trusted by Malaysian institutions to empower the next generation of professionals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[440px] bg-surface-container border border-outline-variant rounded-xl p-md md:p-lg flex flex-col space-y-md">
              <div className="space-y-xs">
                <h3 className="font-headline-md text-headline-md text-on-surface">Welcome back</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Access your personalized career roadmap.</p>
              </div>
              <div className="flex flex-col space-y-sm">
                <button className="flex items-center justify-center space-x-sm w-full py-sm bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg transition-all active:scale-[0.98]" onClick={loginWithGoogle} type="button">
                  <span className="w-5 h-5 rounded-full bg-white text-[#4285F4] grid place-items-center font-bold text-xs">G</span>
                  <span className="font-label-md text-label-md text-on-surface">Continue with Google</span>
                </button>
                <button className="flex items-center justify-center space-x-sm w-full py-sm bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg transition-all active:scale-[0.98]">
                  <Icon name="mail" className="text-on-surface text-[20px]" />
                  <span className="font-label-md text-label-md text-on-surface">Continue with Email</span>
                </button>
              </div>
              <div className="flex items-center space-x-sm">
                <hr className="flex-grow border-outline-variant" />
                <span className="font-label-sm text-label-sm text-on-surface-variant px-base">OR</span>
                <hr className="flex-grow border-outline-variant" />
              </div>
              <form className="flex flex-col space-y-md" onSubmit={handleLogin}>
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">University Email</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="student@university.edu.my" required type="email" value={email} />
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
                  <a className="font-label-sm text-label-sm text-primary hover:underline" href="#">Forgot password?</a>
                </div>
                <div className="flex flex-col space-y-sm pt-base">
                  <button className="w-full py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-all active:scale-[0.98]">
                    Login
                  </button>
                  <button className="w-full py-sm border border-primary text-primary font-label-md text-label-md rounded-lg hover:bg-primary/10 transition-all active:scale-[0.98]" onClick={handleCreateAccount} type="button">
                    Create Account
                  </button>
                </div>
              </form>
              <div className={`rounded-lg border px-sm py-sm font-body-sm text-body-sm ${config.configured ? "border-outline-variant text-on-surface-variant" : "border-error/40 text-error"}`}>
                {formStatus || authStatus}
              </div>
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
