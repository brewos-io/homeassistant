/**
 * PWA and build target utilities
 *
 * Build targets (set at compile time via vite.config.ts):
 * - __CLOUD__ = true: Built for cloud.brewos.io deployment
 * - __ESP32__ = true: Built for ESP32 local deployment
 *
 * Demo mode is ONLY for cloud website visitors to preview the app.
 * It is NOT available when:
 * - Running as an installed PWA (should use cloud mode)
 * - Built for ESP32 (real hardware, no need for demo)
 */

/**
 * Check if this build is for ESP32 (set at compile time)
 */
export function isESP32Build(): boolean {
  return __ESP32__;
}

/**
 * Check if this build is for cloud (set at compile time)
 */
export function isCloudBuild(): boolean {
  return __CLOUD__;
}

/**
 * Check if the app is running as an installed PWA (standalone mode)
 * This includes iOS "Add to Home Screen" and Android/Chrome PWA installs.
 */
export function isRunningAsPWA(): boolean {
  if (typeof window === "undefined") return false;

  // Check for standalone display mode (standard PWA detection)
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  // Check for iOS standalone mode (Add to Home Screen)
  const isIOSStandalone =
    (window.navigator as { standalone?: boolean }).standalone === true;

  // Check for TWA (Trusted Web Activity) on Android
  const isTWA = document.referrer.includes("android-app://");

  return isStandalone || isIOSStandalone || isTWA;
}

/**
 * Check if demo mode should be allowed.
 * Demo mode is ONLY for cloud website visitors to preview the app in browser.
 *
 * NOT allowed when:
 * - Built for ESP32 (real hardware, no need for demo)
 * - Running as a PWA (use cloud account)
 */
export function isDemoModeAllowed(): boolean {
  // ESP32 build - no demo mode, user has real hardware
  if (__ESP32__) return false;

  // PWA users should use cloud mode, not demo
  if (isRunningAsPWA()) return false;

  // Only allow demo mode for cloud website visitors in browser
  return true;
}

/**
 * Check if local mode should be allowed
 * Local mode is NOT allowed when running as a PWA (cloud build in standalone)
 */
export function isLocalModeAllowed(): boolean {
  return !isRunningAsPWA();
}
