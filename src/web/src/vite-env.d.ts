/// <reference types="vite/client" />

// Build target constants (set in vite.config.ts)
declare const __ESP32__: boolean;
declare const __CLOUD__: boolean;

// Version and environment constants (set in vite.config.ts)
// __VERSION__: Release version (e.g., "0.2.0") or "dev" for local builds
// __ENVIRONMENT__: "staging", "production", or "development"
declare const __VERSION__: string;
declare const __ENVIRONMENT__: "staging" | "production" | "development";

// Google Analytics
interface Window {
  dataLayer: unknown[];
  gtag: (...args: unknown[]) => void;
}

