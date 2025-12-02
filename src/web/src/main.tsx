import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./styles/index.css";
import { GOOGLE_CLIENT_ID } from "./lib/auth";
import { registerServiceWorker } from "./lib/push-notifications";
import { ToastProvider } from "./components/Toast";

// Google Analytics - only in production
const GA_MEASUREMENT_ID = "G-KY0H392KGB";

if (import.meta.env.PROD) {
  // Load gtag.js script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    registerServiceWorker().catch((error) => {
      console.error("Failed to register service worker:", error);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
