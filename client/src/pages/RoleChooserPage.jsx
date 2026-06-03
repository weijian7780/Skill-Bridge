import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export function RoleChooserPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, isLoading, navigate]);

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

        <div className="max-w-[1280px] w-full flex flex-col items-center relative z-10">
          <div className="w-full flex items-center justify-center mb-base">
            <img src="/skillbridge-logo.png" alt="SkillBridge" className="h-32 md:h-52 w-auto max-w-full object-contain" />
          </div>

          <h2 className="font-headline-lg text-headline-lg text-on-background text-center mb-base">
            How do you want to use SkillBridge?
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant text-center max-w-lg mb-lg">
            Choose your role to get started with the right experience.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter w-full max-w-[720px]">
            {/* Student Card */}
            <button
              className="group bg-surface-container border border-outline-variant rounded-xl p-lg flex flex-col items-center space-y-md shadow-xl shadow-slate-900/10 transition-all duration-200 hover:scale-[1.03] hover:border-primary focus:outline-none focus:border-primary cursor-pointer"
              onClick={() => navigate("/signup/student")}
              type="button"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 grid place-items-center">
                <Icon name="school" className="text-primary text-[32px]" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">I'm a Student</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
                Find internships, analyze skills, build your career roadmap
              </p>
            </button>

            {/* Employer Card */}
            <button
              className="group bg-surface-container border border-outline-variant rounded-xl p-lg flex flex-col items-center space-y-md shadow-xl shadow-slate-900/10 transition-all duration-200 hover:scale-[1.03] hover:border-primary focus:outline-none focus:border-primary cursor-pointer"
              onClick={() => navigate("/signup/employer")}
              type="button"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 grid place-items-center">
                <Icon name="business" className="text-primary text-[32px]" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">I'm an Employer</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
                Post jobs, manage applicants, find the right talent
              </p>
            </button>
          </div>

          <div className="text-center pt-lg">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Already have an account? </span>
            <Link to="/login" className="font-label-sm text-label-sm text-primary hover:underline">Log in</Link>
          </div>
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
