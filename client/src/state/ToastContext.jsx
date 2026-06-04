import { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../components/Icon.jsx";

const ToastContext = createContext(null);

const TONE_STYLES = {
  success: { icon: "check_circle", className: "border-tertiary/40 bg-tertiary-container text-on-tertiary-container" },
  error: { icon: "error", className: "border-error/40 bg-error-container text-on-error-container" },
  info: { icon: "info", className: "border-primary/40 bg-primary-container text-on-primary-container" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  // showToast("Job saved")  or  showToast("Upload failed", "error")
  const showToast = useCallback(
    (message, tone = "success", duration = 3000) => {
      const id = ++idRef.current;
      setToasts((current) => [...current, { id, message, tone }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      {createPortal(
        <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-sm md:bottom-6">
          {toasts.map((toast) => {
            const tone = TONE_STYLES[toast.tone] || TONE_STYLES.info;
            return (
              <div
                key={toast.id}
                role="status"
                className={`toast-enter flex max-w-sm items-start gap-xs rounded-xl border px-md py-sm shadow-lg font-body-sm text-body-sm ${tone.className}`}
              >
                <Icon name={tone.icon} className="text-[18px] shrink-0" />
                <span className="flex-1">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss"
                  className="shrink-0 opacity-70 hover:opacity-100"
                >
                  <Icon name="close" className="text-[16px]" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

// Safe to call even outside the provider (returns a no-op) so components/tests don't crash.
export function useToast() {
  const context = useContext(ToastContext);
  return context ?? { showToast: () => {}, dismiss: () => {} };
}
