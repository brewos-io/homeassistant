import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/mode';
import { 
  ChevronDown, 
  Coffee, 
  Plus, 
  Check,
  Wifi,
  WifiOff,
  Settings,
} from 'lucide-react';

export function MachineSelector() {
  const navigate = useNavigate();
  const { devices, selectedDeviceId, selectDevice, getSelectedDevice } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDevice = getSelectedDevice();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (devices.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          {selectedDevice?.isOnline ? (
            <Wifi className="w-4 h-4 text-emerald-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-coffee-400" />
          )}
          <span className="font-medium text-coffee-800 max-w-[150px] truncate">
            {selectedDevice?.name || 'Select Machine'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-coffee-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-cream-200 overflow-hidden z-50">
          <div className="p-2">
            <p className="px-3 py-1 text-xs font-semibold text-coffee-400 uppercase tracking-wider">
              Your Machines
            </p>
            
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => {
                  selectDevice(device.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  device.id === selectedDeviceId
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-cream-100 text-coffee-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  device.isOnline ? 'bg-emerald-100' : 'bg-cream-200'
                }`}>
                  {device.isOnline ? (
                    <Coffee className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Coffee className="w-4 h-4 text-coffee-400" />
                  )}
                </div>
                
                <div className="flex-1 text-left">
                  <p className="font-medium truncate">{device.name}</p>
                  <p className="text-xs text-coffee-400">
                    {device.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                
                {device.id === selectedDeviceId && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
          
          <div className="border-t border-cream-200 p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/machines');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream-100 text-coffee-600 text-sm"
            >
              <Settings className="w-4 h-4" />
              Manage Machines
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/onboarding');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream-100 text-accent text-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Machine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

