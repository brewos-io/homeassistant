/**
 * Firmware Update Checker
 *
 * Periodically checks for firmware updates and sends push notifications
 * when a new version is available for the user's selected channel.
 */

import {
  checkForUpdates,
  getUpdateChannel,
  compareVersions,
  type UpdateChannel,
  type UpdateCheckResult,
} from "./updates";

// Storage keys
const LAST_CHECK_KEY = "brewos-update-last-check";
const LAST_NOTIFIED_KEY = "brewos-update-last-notified";
const CHECK_INTERVAL_KEY = "brewos-update-check-interval";

// Default check interval: 4 hours
const DEFAULT_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
// Minimum interval: 1 hour (to avoid excessive API calls)
const MIN_CHECK_INTERVAL_MS = 60 * 60 * 1000;

// Callback for in-app notifications (when native notifications not available)
type UpdateAvailableCallback = (
  version: string,
  channel: UpdateChannel
) => void;
let onUpdateAvailableCallback: UpdateAvailableCallback | null = null;

// Interval handle
let checkIntervalHandle: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

/**
 * Set callback for in-app update notifications
 * Used when native notifications are not available or denied
 */
export function setFirmwareUpdateCallback(
  callback: UpdateAvailableCallback
): void {
  onUpdateAvailableCallback = callback;
}

/**
 * Get the configured check interval in milliseconds
 */
export function getCheckInterval(): number {
  const stored = localStorage.getItem(CHECK_INTERVAL_KEY);
  if (stored) {
    const interval = parseInt(stored, 10);
    if (!isNaN(interval) && interval >= MIN_CHECK_INTERVAL_MS) {
      return interval;
    }
  }
  return DEFAULT_CHECK_INTERVAL_MS;
}

/**
 * Set the check interval in milliseconds
 */
export function setCheckInterval(intervalMs: number): void {
  const validInterval = Math.max(intervalMs, MIN_CHECK_INTERVAL_MS);
  localStorage.setItem(CHECK_INTERVAL_KEY, validInterval.toString());

  // Restart checker with new interval if running
  if (isRunning) {
    stopFirmwareUpdateChecker();
    startFirmwareUpdateChecker();
  }
}

/**
 * Get the last notified version for a channel
 */
function getLastNotifiedVersion(channel: UpdateChannel): string | null {
  try {
    const data = localStorage.getItem(LAST_NOTIFIED_KEY);
    if (data) {
      const notified = JSON.parse(data);
      return notified[channel] || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Set the last notified version for a channel
 */
function setLastNotifiedVersion(channel: UpdateChannel, version: string): void {
  try {
    const data = localStorage.getItem(LAST_NOTIFIED_KEY);
    const notified = data ? JSON.parse(data) : {};
    notified[channel] = version;
    localStorage.setItem(LAST_NOTIFIED_KEY, JSON.stringify(notified));
  } catch {
    // Ignore errors
  }
}

/**
 * Get the timestamp of the last update check
 */
export function getLastCheckTime(): number | null {
  const stored = localStorage.getItem(LAST_CHECK_KEY);
  if (stored) {
    const timestamp = parseInt(stored, 10);
    if (!isNaN(timestamp)) {
      return timestamp;
    }
  }
  return null;
}

/**
 * Check if enough time has passed since last check
 */
function shouldCheck(): boolean {
  const lastCheck = getLastCheckTime();
  if (!lastCheck) return true;

  const interval = getCheckInterval();
  return Date.now() - lastCheck >= interval;
}

/**
 * Show a native browser notification
 */
async function showNativeNotification(
  version: string,
  channel: UpdateChannel
): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    const channelLabel =
      channel === "dev" ? "Dev Build" : channel === "beta" ? "Beta" : "Stable";
    const title = "BrewOS Firmware Update";
    const body = `Version ${version} (${channelLabel}) is available for your machine.`;

    const notification = new Notification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: "firmware-update", // Replaces existing notification with same tag
      requireInteraction: true, // Keep notification visible until user interacts
      data: { version, channel },
    });

    // Handle click - navigate to settings
    notification.onclick = () => {
      window.focus();
      window.location.href = "/settings?tab=system";
      notification.close();
    };

    return true;
  } catch (error) {
    console.error("[FirmwareChecker] Failed to show notification:", error);
    return false;
  }
}

/**
 * Notify about available update
 */
async function notifyUpdate(
  version: string,
  channel: UpdateChannel
): Promise<void> {
  // Try native notification first
  const nativeShown = await showNativeNotification(version, channel);

  // Always call the callback for in-app notification (it can check if native was shown)
  if (onUpdateAvailableCallback) {
    onUpdateAvailableCallback(version, channel);
  }

  if (nativeShown) {
    console.log(
      `[FirmwareChecker] Notification shown for ${channel} update: ${version}`
    );
  }
}

/**
 * Check for firmware updates
 * @param currentVersion The currently installed firmware version
 * @param forceNotify If true, notify even if already notified for this version
 * @returns The update check result
 */
export async function checkFirmwareUpdates(
  currentVersion: string,
  forceNotify = false
): Promise<UpdateCheckResult | null> {
  // Skip if notifications are disabled (unless force checking)
  if (!forceNotify && !getFirmwareUpdateNotificationEnabled()) {
    console.log("[FirmwareChecker] Notifications disabled, skipping check");
    return null;
  }

  console.log("[FirmwareChecker] Checking for updates...");

  try {
    const result = await checkForUpdates(currentVersion);
    const channel = getUpdateChannel();

    // Record check time
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

    // Determine which version to check based on channel
    let latestVersion: string | null = null;
    let hasUpdate = false;

    switch (channel) {
      case "dev":
        // Dev always has "updates" available (it's the latest from main)
        if (result.dev) {
          latestVersion = result.dev.version;
          hasUpdate = result.hasDevUpdate;
        }
        break;
      case "beta":
        // Beta users get beta updates, or stable if no beta available
        if (result.beta && result.hasBetaUpdate) {
          latestVersion = result.beta.version;
          hasUpdate = true;
        } else if (result.stable && result.hasStableUpdate) {
          latestVersion = result.stable.version;
          hasUpdate = true;
        }
        break;
      case "stable":
      default:
        if (result.stable && result.hasStableUpdate) {
          latestVersion = result.stable.version;
          hasUpdate = true;
        }
        break;
    }

    // Check if we should notify (only if notifications enabled)
    if (hasUpdate && latestVersion && getFirmwareUpdateNotificationEnabled()) {
      const lastNotified = getLastNotifiedVersion(channel);
      const shouldNotify =
        forceNotify ||
        !lastNotified ||
        compareVersions(latestVersion, lastNotified) > 0;

      if (shouldNotify) {
        await notifyUpdate(latestVersion, channel);
        setLastNotifiedVersion(channel, latestVersion);
      } else {
        console.log(
          `[FirmwareChecker] Already notified about ${latestVersion}, skipping`
        );
      }
    } else if (!getFirmwareUpdateNotificationEnabled()) {
      console.log("[FirmwareChecker] Notifications disabled, skipping notify");
    } else {
      console.log(
        "[FirmwareChecker] No updates available for channel:",
        channel
      );
    }

    return result;
  } catch (error) {
    console.error("[FirmwareChecker] Error checking for updates:", error);
    return null;
  }
}

/**
 * Start periodic firmware update checks
 * @param currentVersion The currently installed firmware version
 */
export function startFirmwareUpdateChecker(currentVersion?: string): void {
  // Don't start if notifications are disabled
  if (!getFirmwareUpdateNotificationEnabled()) {
    console.log("[FirmwareChecker] Notifications disabled, not starting");
    return;
  }

  if (isRunning) {
    console.log("[FirmwareChecker] Already running");
    return;
  }

  console.log("[FirmwareChecker] Starting periodic update checker");
  isRunning = true;

  // Get version from parameter or try to get from global state
  const getVersion = (): string | null => {
    if (currentVersion) return currentVersion;
    // Try to get from DOM data attribute (set by App component)
    const versionEl = document.querySelector("[data-firmware-version]");
    return versionEl?.getAttribute("data-firmware-version") || null;
  };

  // Check immediately if enough time has passed
  if (shouldCheck()) {
    const version = getVersion();
    if (version) {
      checkFirmwareUpdates(version);
    }
  }

  // Set up periodic check
  const interval = getCheckInterval();
  checkIntervalHandle = setInterval(() => {
    // Also check preference in interval - user might have disabled it
    if (!getFirmwareUpdateNotificationEnabled()) {
      console.log("[FirmwareChecker] Notifications disabled, stopping");
      stopFirmwareUpdateChecker();
      return;
    }

    const version = getVersion();
    if (version && shouldCheck()) {
      checkFirmwareUpdates(version);
    }
  }, Math.min(interval, 60 * 60 * 1000)); // Check at most every hour, actual check uses shouldCheck()

  console.log(
    `[FirmwareChecker] Check interval: ${interval / 1000 / 60} minutes`
  );
}

/**
 * Stop periodic firmware update checks
 */
export function stopFirmwareUpdateChecker(): void {
  if (checkIntervalHandle) {
    clearInterval(checkIntervalHandle);
    checkIntervalHandle = null;
  }
  isRunning = false;
  console.log("[FirmwareChecker] Stopped");
}

/**
 * Check if the update checker is running
 */
export function isUpdateCheckerRunning(): boolean {
  return isRunning;
}

/**
 * Clear the last notified versions (useful when user manually checks)
 */
export function clearLastNotified(): void {
  localStorage.removeItem(LAST_NOTIFIED_KEY);
}

/**
 * Get notification preference for firmware updates
 */
export function getFirmwareUpdateNotificationEnabled(): boolean {
  const stored = localStorage.getItem("brewos-firmware-update-notification");
  return stored !== "false"; // Enabled by default
}

/**
 * Set notification preference for firmware updates
 * Also starts/stops the checker based on the preference
 */
export function setFirmwareUpdateNotificationEnabled(enabled: boolean): void {
  localStorage.setItem(
    "brewos-firmware-update-notification",
    enabled.toString()
  );

  // Start or stop the checker based on preference
  if (enabled && !isRunning) {
    startFirmwareUpdateChecker();
  } else if (!enabled && isRunning) {
    stopFirmwareUpdateChecker();
  }
}
