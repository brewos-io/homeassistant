/// <reference types="vite/client" />

declare const __ESP32__: boolean;
declare const __CLOUD__: boolean;

// Google Analytics
interface Window {
  dataLayer: unknown[];
  gtag: (...args: unknown[]) => void;
}

