import { WifiOff, RefreshCw } from 'lucide-react';
import { useThemeStore } from '@/lib/themeStore';

interface DeviceOfflineBannerProps {
  deviceName?: string;
  onRetry?: () => void;
}

export function DeviceOfflineBanner({ deviceName, onRetry }: DeviceOfflineBannerProps) {
  const { theme } = useThemeStore();
  const isDark = theme.isDark;

  return (
    <div 
      className={`
        border-b px-4 py-2.5
        ${isDark 
          ? 'bg-gradient-to-r from-red-500/20 via-red-500/15 to-red-500/20 border-red-400/30' 
          : 'bg-gradient-to-r from-red-600/15 via-red-600/10 to-red-600/15 border-red-500/40'
        }
      `}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className={`
              flex items-center gap-2 px-2.5 py-1 rounded-full
              ${isDark 
                ? 'bg-red-500/25 border border-red-400/30' 
                : 'bg-red-600/20 border border-red-500/30'
              }
            `}
          >
            <WifiOff 
              className={`w-3.5 h-3.5 ${isDark ? 'text-red-300' : 'text-red-600'}`} 
            />
            <span 
              className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-red-200' : 'text-red-700'}`}
            >
              Offline
            </span>
          </div>
          <span 
            className={`text-sm ${isDark ? 'text-red-300/90' : 'text-red-600/90'}`}
          >
            <span className="hidden sm:inline">
              {deviceName ? `${deviceName} is` : 'Device is'} not connected
            </span>
            <span className="sm:hidden">
              Device offline
            </span>
          </span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`
              flex items-center gap-1.5 text-sm transition-colors group
              ${isDark 
                ? 'text-red-300/80 hover:text-red-100' 
                : 'text-red-600/80 hover:text-red-800'
              }
            `}
          >
            <span className="hidden sm:inline font-medium">Retry</span>
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        )}
      </div>
    </div>
  );
}

