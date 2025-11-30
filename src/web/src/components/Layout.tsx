import { Outlet, NavLink } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { 
  LayoutGrid, 
  Coffee, 
  Scale, 
  Settings, 
  Server, 
  Info,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutGrid },
  { name: 'Brewing', href: '/brewing', icon: Coffee },
  { name: 'Scale', href: '/scale', icon: Scale },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'System', href: '/system', icon: Server },
  { name: 'About', href: '/about', icon: Info },
];

export function Layout() {
  const connectionState = useStore((s) => s.connectionState);
  
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting' || connectionState === 'reconnecting';

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="BrewOS" 
                className="h-8 w-auto"
              />
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-200/80">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-emerald-600" />
              ) : isConnecting ? (
                <Wifi className="w-4 h-4 text-amber-500 animate-pulse" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs font-medium text-coffee-700">
                {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-16 z-40 bg-white border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-coffee-800 text-white shadow-soft'
                      : 'text-coffee-600 hover:bg-cream-200'
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}

