import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getConnection } from '@/lib/connection';
import { Card, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { QRCodeDisplay } from '@/components/QRCode';
import { 
  Cpu, 
  HardDrive, 
  Download, 
  RefreshCw,
  Terminal,
  Trash2,
  AlertTriangle,
  Check,
  Clock,
  Cloud,
} from 'lucide-react';
import { formatUptime, formatBytes } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';

interface PairingData {
  deviceId: string;
  token: string;
  url: string;
  expiresIn: number;
}

export function System() {
  const esp32 = useStore((s) => s.esp32);
  const pico = useStore((s) => s.pico);
  const stats = useStore((s) => s.stats);
  const logs = useStore((s) => s.logs);
  const clearLogs = useStore((s) => s.clearLogs);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  
  // Pairing state (only on local ESP32)
  const [pairingData, setPairingData] = useState<PairingData | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  
  // Fetch pairing QR code data (only on ESP32)
  const fetchPairingData = async () => {
    setPairingLoading(true);
    try {
      const response = await fetch('/api/pairing/qr');
      if (response.ok) {
        const data = await response.json();
        setPairingData(data);
      }
    } catch {
      console.log('Pairing not available');
    }
    setPairingLoading(false);
  };
  
  const refreshPairing = async () => {
    setPairingLoading(true);
    try {
      const response = await fetch('/api/pairing/refresh', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setPairingData(data);
      }
    } catch {
      console.log('Failed to refresh pairing');
    }
    setPairingLoading(false);
  };
  
  // Fetch pairing data on mount (only on ESP32 local mode)
  useEffect(() => {
    // Only fetch on local ESP32 (not on cloud)
    if (!isSupabaseConfigured) {
      fetchPairingData();
    }
  }, []);

  const checkForUpdates = async () => {
    setCheckingUpdate(true);
    getConnection()?.sendCommand('check_update');
    // Simulate check - in real app, wait for response
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateAvailable(null);
    }, 2000);
  };

  const startOTA = () => {
    if (confirm('Start firmware update? The device will restart after update.')) {
      getConnection()?.sendCommand('ota_start');
    }
  };

  const restartDevice = () => {
    if (confirm('Restart the device?')) {
      getConnection()?.sendCommand('restart');
    }
  };

  const factoryReset = () => {
    if (confirm('This will erase all settings. Are you sure?')) {
      if (confirm('Really? This cannot be undone!')) {
        getConnection()?.sendCommand('factory_reset');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ESP32 Info */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Cpu className="w-5 h-5" />}>ESP32-S3</CardTitle>
            <Badge variant="success">Online</Badge>
          </CardHeader>

          <div className="space-y-3">
            <InfoRow label="Firmware" value={esp32.version || 'Unknown'} />
            <InfoRow label="Uptime" value={formatUptime(esp32.uptime)} />
            <InfoRow label="Free Heap" value={formatBytes(esp32.freeHeap)} />
          </div>
        </Card>

        {/* Pico Info */}
        <Card>
          <CardHeader>
            <CardTitle icon={<HardDrive className="w-5 h-5" />}>Raspberry Pi Pico</CardTitle>
            <Badge variant={pico.connected ? 'success' : 'error'}>
              {pico.connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardHeader>

          <div className="space-y-3">
            <InfoRow label="Firmware" value={pico.version || 'Unknown'} />
            <InfoRow label="Uptime" value={formatUptime(pico.uptime)} />
            <InfoRow 
              label="Status" 
              value={pico.connected ? 'Communicating' : 'No response'} 
            />
          </div>
        </Card>
      </div>

      {/* Cloud Pairing (only on ESP32 local mode) */}
      {pairingData && (
        <Card>
          <CardHeader>
            <CardTitle icon={<Cloud className="w-5 h-5" />}>Cloud Access</CardTitle>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-coffee-600 mb-4">
                Link this device to your BrewOS cloud account to control it from anywhere.
                Scan the QR code with your phone or open the link in a browser.
              </p>
              <div className="bg-cream-100 rounded-xl p-4">
                <InfoRow label="Device ID" value={pairingData.deviceId} />
              </div>
            </div>
            
            <QRCodeDisplay
              url={pairingData.url}
              deviceId={pairingData.deviceId}
              expiresIn={pairingData.expiresIn}
              onRefresh={refreshPairing}
              loading={pairingLoading}
            />
          </div>
        </Card>
      )}

      {/* Firmware Update */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Download className="w-5 h-5" />}>Firmware Update</CardTitle>
        </CardHeader>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-coffee-700 mb-1">
              Current version: <span className="font-mono font-semibold">{esp32.version || 'Unknown'}</span>
            </p>
            {updateAvailable ? (
              <p className="text-sm text-emerald-600">
                <Check className="w-4 h-4 inline mr-1" />
                Update available: {updateAvailable}
              </p>
            ) : (
              <p className="text-sm text-coffee-500">
                Check for the latest firmware updates.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={checkForUpdates}
              loading={checkingUpdate}
            >
              <RefreshCw className="w-4 h-4" />
              Check for Updates
            </Button>
            {updateAvailable && (
              <Button onClick={startOTA}>
                <Download className="w-4 h-4" />
                Install Update
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Clock className="w-5 h-5" />}>Statistics</CardTitle>
        </CardHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox label="Total Shots" value={stats.totalShots} />
          <StatBox label="Today" value={stats.shotsToday} />
          <StatBox 
            label="Since Cleaning" 
            value={stats.shotsSinceCleaning}
            warning={stats.shotsSinceCleaning > 100}
          />
          <StatBox 
            label="Last Cleaning" 
            value={stats.lastCleaning ? new Date(stats.lastCleaning).toLocaleDateString() : 'Never'} 
          />
        </div>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader
          action={
            <Button variant="ghost" size="sm" onClick={clearLogs}>
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          }
        >
          <CardTitle icon={<Terminal className="w-5 h-5" />}>System Logs</CardTitle>
        </CardHeader>

        <div className="max-h-64 overflow-y-auto bg-coffee-900 rounded-xl p-4 font-mono text-xs">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="py-1 border-b border-coffee-800 last:border-0">
                <span className="text-coffee-500">
                  {new Date(log.time).toLocaleTimeString()}
                </span>
                <span className={`ml-2 ${getLogColor(log.level)}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-cream-200 ml-2">{log.message}</span>
              </div>
            ))
          ) : (
            <p className="text-coffee-500 text-center py-4">No logs yet</p>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle icon={<AlertTriangle className="w-5 h-5 text-red-500" />}>
            <span className="text-red-600">Danger Zone</span>
          </CardTitle>
        </CardHeader>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-coffee-800 mb-1">Restart Device</h4>
            <p className="text-sm text-coffee-500">
              Reboot the ESP32. Settings will be preserved.
            </p>
          </div>
          <Button variant="secondary" onClick={restartDevice}>
            <RefreshCw className="w-4 h-4" />
            Restart
          </Button>
        </div>

        <hr className="my-4 border-cream-200" />

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-red-600 mb-1">Factory Reset</h4>
            <p className="text-sm text-coffee-500">
              Erase all settings and return to factory defaults. This cannot be undone.
            </p>
          </div>
          <Button variant="danger" onClick={factoryReset}>
            <Trash2 className="w-4 h-4" />
            Factory Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-cream-200 last:border-0">
      <span className="text-sm text-coffee-500">{label}</span>
      <span className="text-sm font-mono font-medium text-coffee-900">{value}</span>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string | number;
  warning?: boolean;
}

function StatBox({ label, value, warning }: StatBoxProps) {
  return (
    <div className="p-4 bg-cream-100 rounded-xl text-center">
      <div className={`text-2xl font-bold ${warning ? 'text-amber-600' : 'text-coffee-900'}`}>
        {value}
      </div>
      <div className="text-xs text-coffee-500">{label}</div>
    </div>
  );
}

function getLogColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'error': return 'text-red-400';
    case 'warn': 
    case 'warning': return 'text-amber-400';
    case 'info': return 'text-blue-400';
    case 'debug': return 'text-gray-400';
    default: return 'text-cream-400';
  }
}

