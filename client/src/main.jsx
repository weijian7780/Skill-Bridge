import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./state/AuthContext.jsx";
import { AppStateProvider } from "./state/AppStateContext.jsx";
import { ToastProvider } from "./state/ToastContext.jsx";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppStateProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppStateProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
