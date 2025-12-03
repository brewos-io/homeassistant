/**
 * Developer Mode Detection
 * 
 * Enables hidden developer features when ?dev=true is in the URL.
 * Once enabled, the flag is saved to localStorage for persistence.
 */

import { useSyncExternalStore } from "react";

const DEV_MODE_KEY = "brewos-dev-mode";

// Subscribers for dev mode changes
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

// Initialize dev mode immediately on module load
// This ensures localStorage is set before any React component renders
if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("dev") === "true") {
    localStorage.setItem(DEV_MODE_KEY, "true");
    console.log("[DevMode] Enabled via URL parameter");
  }
}

/**
 * Check if dev mode is enabled (non-reactive, use useDevMode() in components)
 */
export function isDevModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEV_MODE_KEY) === "true";
}

/**
 * React hook for dev mode - automatically re-renders when dev mode changes
 */
export function useDevMode(): boolean {
  return useSyncExternalStore(
    (callback) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    () => isDevModeEnabled(),
    () => false // Server-side rendering fallback
  );
}

/**
 * Explicitly enable dev mode
 */
export function enableDevMode(): void {
  localStorage.setItem(DEV_MODE_KEY, "true");
  notifySubscribers();
}

/**
 * Disable dev mode
 */
export function disableDevMode(): void {
  localStorage.removeItem(DEV_MODE_KEY);
  notifySubscribers();
}

