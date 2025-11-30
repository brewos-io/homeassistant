/**
 * Auth compatibility layer - re-exports from mode.ts
 */
import { useAppStore } from './mode';

// Re-export for backwards compatibility
export const useAuth = () => {
  const store = useAppStore();
  return {
    user: store.user,
    loading: store.authLoading,
    initialized: store.initialized,
    initialize: store.initialize,
    handleGoogleLogin: store.handleGoogleLogin,
    signOut: store.signOut,
    getAccessToken: store.getAccessToken,
  };
};

export const useDevices = () => {
  const store = useAppStore();
  return {
    devices: store.devices,
    loading: store.devicesLoading,
    fetchDevices: store.fetchDevices,
    claimDevice: store.claimDevice,
    removeDevice: store.removeDevice,
    renameDevice: store.renameDevice,
  };
};
