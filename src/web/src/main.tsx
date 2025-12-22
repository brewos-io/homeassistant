import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./styles/index.css";
import { GOOGLE_CLIENT_ID } from "./lib/auth";
import { registerServiceWorker } from "./lib/push-notifications";
import { ToastProvider } from "./components/Toast";
import { AlertToastBridge } from "./components/AlertToastBridge";
import { ConfirmDialogProvider } from "./components/ConfirmDialogProvider";

// Initialize dev mode detection early (checks ?dev=true in URL)
import "./lib/dev-mode";

// Initialize demo mode detection early (checks ?demo=true in URL)
// This MUST happen before React mounts to ensure localStorage is set
// before App component evaluates isDemoMode()
import { initDemoModeFromUrl } from "./lib/demo-mode";
initDemoModeFromUrl();

// Google Analytics - only in production
const GA_MEASUREMENT_ID = "G-KY0H392KGB";

if (import.meta.env.PROD) {
  // Load gtag.js script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag - must be assigned to window.gtag for GA to work
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);
}

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    registerServiceWorker().catch((error) => {
      console.error("Failed to register service worker:", error);
    });
  });

  // Check service worker health when app becomes visible (after being in background)
  // This helps recover from broken states when user returns to the app
  document.addEventListener("visibilitychange", async () => {
    if (!document.hidden && navigator.serviceWorker.controller) {
      // Wait a bit for the app to initialize, then check health
      setTimeout(async () => {
        try {
          const messageChannel = new MessageChannel();
          const healthCheckPromise = new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => resolve(false), 2000);

            messageChannel.port1.onmessage = (event) => {
              clearTimeout(timeout);
              resolve(event.data === "pong");
            };

            navigator.serviceWorker.controller?.postMessage(
              { type: "HEALTH_CHECK" },
              [messageChannel.port2]
            );
          });

          const isHealthy = await healthCheckPromise;
          if (!isHealthy) {
            console.warn(
              "[PWA] Service worker health check failed on visibility change"
            );
            // Don't auto-recover here, just log - let the user manually refresh if needed
            // Auto-recovery might be too aggressive
          }
        } catch (error) {
          console.warn("[PWA] Health check error on visibility change:", error);
        }
      }, 1000);
    }
  });
}

// White screen detection and recovery
function detectWhiteScreen() {
  // Check if root is empty or app hasn't rendered after 5 seconds
  setTimeout(() => {
    const root = document.getElementById("root");
    if (root && root.children.length === 0) {
      console.warn("[App] White screen detected - root element is empty");

      // Check if service worker might be the issue
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        console.warn(
          "[App] Service worker is active but app didn't render - attempting recovery"
        );

        // Try to recover by unregistering broken service worker
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          if (registrations.length > 0) {
            console.log("[App] Unregistering service workers for recovery");
            Promise.all(registrations.map((reg) => reg.unregister())).then(
              () => {
                console.log(
                  "[App] Reloading page after service worker unregistration"
                );
                window.location.reload();
              }
            );
          } else {
            // No service worker, just reload
            window.location.reload();
          }
        });
      } else {
        // No service worker issue, just reload
        console.log("[App] Reloading page to recover from white screen");
        window.location.reload();
      }
    }
  }, 5000);
}

// Start white screen detection
detectWhiteScreen();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ToastProvider>
          <ConfirmDialogProvider>
            <AlertToastBridge />
            <App />
          </ConfirmDialogProvider>
        </ToastProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
