import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export function SignupEmployerPage() {
  const navigate = useNavigate();
  const { authStatus, config, isAuthenticated, isLoading, register } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/employer/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  async function handleCreateAccount(event) {
    event.preventDefault();
    const result = await register({
      email,
      password,
      metadata: { role: "employer", company_name: companyName },
    });
    setIsError(!result.ok);
    setFormStatus(result.reason || "Account created.");

    if (result.ok && result.session) {
      navigate("/employer/dashboard");
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
          <section className="lg:col-span-7 flex flex-col space-y-md">
            <div className="flex items-center -ml-2 mb-base">
              <img src="/skillbridge-logo.png" alt="SkillBridge" className="h-40 md:h-56 w-auto max-w-full object-contain" />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-background max-w-xl">
              Hire skilled Malaysian graduates
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
              Post internship and job opportunities, manage applicants, and connect with the next generation of professionals.
            </p>
            <div className="hidden lg:block pt-lg">
              <div className="p-md bg-surface-container border border-outline-variant rounded-xl max-w-sm shadow-sm">
                <div className="flex items-start space-x-sm">
                  <Icon name="trending_up" className="text-primary" />
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Built for Employers</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Access a talent pool of university students matched to your requirements with AI-powered skill analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[440px] bg-surface-container border border-outline-variant rounded-xl p-md md:p-lg flex flex-col space-y-md shadow-xl shadow-slate-900/10">
              <div className="space-y-xs">
                <h3 className="font-headline-md text-headline-md text-on-surface">Create Employer Account</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Post jobs and manage applicants on SkillBridge.</p>
              </div>
              <form className="flex flex-col space-y-md" onSubmit={handleCreateAccount}>
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="companyName">Company Name</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40" id="companyName" onChange={(event) => setCompanyName(event.target.value)} placeholder="Acme Sdn Bhd" required type="text" value={companyName} />
                </div>
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">Work Email</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="hr@company.com" required type="email" value={email} />
                </div>
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40" id="password" minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="********" required type="password" value={password} />
                </div>
                {(formStatus || authStatus) && (
                  <div className={`rounded-lg border px-sm py-sm font-body-sm text-body-sm ${(isError || !config.configured) ? "border-error/40 text-error" : "border-outline-variant text-on-surface-variant"}`}>
                    {formStatus || authStatus}
                  </div>
                )}
                <div className="flex flex-col space-y-sm pt-base">
                  <button className="w-full py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-secondary transition-all active:scale-[0.98]">
                    Create Employer Account
                  </button>
                  <div className="text-center pt-xs">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Already have an account? </span>
                    <Link to="/login" className="font-label-sm text-label-sm text-primary hover:underline">Log in</Link>
                  </div>
                  <div className="text-center">
                    <Link to="/signup/student" className="font-label-sm text-label-sm text-primary hover:underline">Sign up as a student instead</Link>
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
