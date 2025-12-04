import { useStore } from "@/lib/store";
import { getActiveConnection } from "@/lib/connection";
import { Wifi, RefreshCw, X } from "lucide-react";
import { Button } from "./Button";
import { useState, useEffect } from "react";

// Allow bypassing overlay in development for easier testing
const DEV_MODE = import.meta.env.DEV;
const DEV_BYPASS_KEY = "brewos-dev-bypass-overlay";

// Debounce time before hiding overlay after connection
const HIDE_DELAY_MS = 500;

export function ConnectionOverlay() {
  const connectionState = useStore((s) => s.connectionState);
  const [retrying, setRetrying] = useState(false);

  // Check localStorage for dev bypass preference
  const [devBypassed, setDevBypassed] = useState(() => {
    if (!DEV_MODE) return false;
    return localStorage.getItem(DEV_BYPASS_KEY) === "true";
  });

  const isConnected = connectionState === "connected";
  const [isVisible, setIsVisible] = useState(!isConnected);

  // Simple visibility control - show when not connected, hide with delay when connected
  useEffect(() => {
    if (isConnected) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, HIDE_DELAY_MS);
      return () => clearTimeout(timeout);
    } else {
      setIsVisible(true);
    }
  }, [isConnected]);

  // Lock body scroll when overlay is visible
  useEffect(() => {
    if (isVisible) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isVisible]);

  const handleDevBypass = () => {
    localStorage.setItem(DEV_BYPASS_KEY, "true");
    setDevBypassed(true);
  };

  // Don't render if bypassed in dev mode or not visible
  if (DEV_MODE && devBypassed) return null;
  if (!isVisible) return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await getActiveConnection()?.connect();
    } catch (e) {
      console.error("Retry failed:", e);
    }
    setRetrying(false);
  };

  // Always show "Connecting" state - simpler and no flickering
  // The overlay is only visible when not connected, and we're always trying to reconnect
  const isRetryingOrConnecting = retrying || 
    connectionState === "connecting" || 
    connectionState === "reconnecting";

  const status = {
    icon: <Wifi className="w-16 h-16 text-accent" />,
    title: "Connecting to your machine...",
    subtitle: "Please wait while we establish a connection",
    showRetry: !isRetryingOrConnecting,
    showPulse: true,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-theme/95 backdrop-blur-md">
      {/* Dev mode bypass button */}
      {DEV_MODE && (
        <button
          onClick={handleDevBypass}
          className="absolute top-4 right-4 p-2 rounded-lg bg-theme-tertiary hover:bg-theme-secondary text-theme-muted transition-colors"
          title="Bypass overlay (dev mode only - persists in localStorage)"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated Icon */}
        <div className="relative inline-flex items-center justify-center">
          {/* Pulsing ring for connecting state */}
          {status.showPulse && (
            <>
              <div className="absolute inset-0 w-24 h-24 -m-4 rounded-full bg-accent/20 animate-ping" />
              <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full bg-accent/30 animate-pulse" />
            </>
          )}
          <div className={status.showPulse ? "animate-pulse" : ""}>
            {status.icon}
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-theme">{status.title}</h2>
          <p className="text-theme-muted leading-relaxed">{status.subtitle}</p>
        </div>

        {/* Retry Button */}
        {status.showRetry && (
          <Button
            onClick={handleRetry}
            loading={retrying}
            variant="primary"
            size="lg"
            className="min-w-40"
          >
            <RefreshCw className="w-5 h-5" />
            Retry Connection
          </Button>
        )}

        {/* Connection attempts indicator */}
        {status.showPulse && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-theme-muted">
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}

        {/* Dev mode hint */}
        {DEV_MODE && (
          <p className="text-xs text-theme-muted opacity-60">
            Dev mode: Click × to bypass (saved to localStorage)
          </p>
        )}
      </div>
    </div>
  );
}
