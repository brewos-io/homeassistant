/**
 * AlertToastBridge
 * 
 * Bridges the Zustand store's alerts to the Toast notification system.
 * This ensures errors and warnings from WebSocket messages are prominently displayed.
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { useToast } from './Toast';

export function AlertToastBridge() {
  const alerts = useStore((s) => s.alerts);
  const { error, warning, success } = useToast();
  
  // Track which alerts we've already shown as toasts
  const shownAlerts = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Check for new alerts
    for (const alert of alerts) {
      // Skip if already shown or dismissed
      if (shownAlerts.current.has(alert.id) || alert.dismissed) {
        continue;
      }

      // Mark as shown
      shownAlerts.current.add(alert.id);

      // Show toast based on alert level
      switch (alert.level) {
        case 'error':
          error(alert.message);
          break;
        case 'warning':
          warning(alert.message);
          break;
        case 'info':
          success(alert.message);
          break;
      }
    }

    // Clean up old alerts from tracking set (keep last 50)
    if (shownAlerts.current.size > 50) {
      const alertIds = new Set(alerts.map(a => a.id));
      shownAlerts.current.forEach(id => {
        if (!alertIds.has(id)) {
          shownAlerts.current.delete(id);
        }
      });
    }
  }, [alerts, error, warning, success]);

  // This component doesn't render anything
  return null;
}

