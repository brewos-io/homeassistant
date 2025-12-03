import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useCommand } from '@/lib/useCommand';
import { Card, CardHeader, CardTitle } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Toggle } from '@/components/Toggle';
import { Badge } from '@/components/Badge';
import { Wifi, Radio, X, Check, Network, Pencil } from 'lucide-react';
import { StatusRow } from './StatusRow';

export function NetworkSettings() {
  const wifi = useStore((s) => s.wifi);
  const mqtt = useStore((s) => s.mqtt);
  const { sendCommand, sendCommandWithConfirm } = useCommand();

  // IP configuration state
  const [ipConfig, setIpConfig] = useState({
    staticIp: wifi.staticIp,
    ip: wifi.ip || '',
    gateway: wifi.gateway || '',
    subnet: wifi.subnet || '255.255.255.0',
    dns1: wifi.dns1 || '',
    dns2: wifi.dns2 || '',
  });
  const [savingIp, setSavingIp] = useState(false);
  const [editingIp, setEditingIp] = useState(false);

  // Update local state when wifi state changes from server
  useEffect(() => {
    setIpConfig({
      staticIp: wifi.staticIp,
      ip: wifi.staticIp ? wifi.ip : ipConfig.ip || wifi.ip,
      gateway: wifi.gateway || ipConfig.gateway,
      subnet: wifi.subnet || ipConfig.subnet || '255.255.255.0',
      dns1: wifi.dns1 || ipConfig.dns1,
      dns2: wifi.dns2 || ipConfig.dns2,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wifi.staticIp, wifi.gateway, wifi.subnet, wifi.dns1, wifi.dns2]);

  const [mqttConfig, setMqttConfig] = useState({
    enabled: mqtt.enabled,
    broker: mqtt.broker || '',
    port: 1883,
    username: '',
    password: '',
    topic: mqtt.topic || 'brewos',
    discovery: true,
  });
  const [testingMqtt, setTestingMqtt] = useState(false);
  const [savingMqtt, setSavingMqtt] = useState(false);

  const testMqtt = () => {
    if (testingMqtt) return;
    setTestingMqtt(true);
    sendCommand('mqtt_test', mqttConfig);
    setTimeout(() => setTestingMqtt(false), 3000);
  };

  const saveMqtt = () => {
    if (savingMqtt) return; // Prevent double-click
    setSavingMqtt(true);
    sendCommand('mqtt_config', mqttConfig, { successMessage: 'MQTT settings saved' });
    // Brief visual feedback for fire-and-forget WebSocket command
    setTimeout(() => setSavingMqtt(false), 600);
  };

  const forgetWifi = () => {
    sendCommandWithConfirm(
      'wifi_forget',
      'Are you sure? The device will restart in AP mode.',
      undefined,
      { successMessage: 'WiFi forgotten. Device will restart...' }
    );
  };

  const saveIpConfig = () => {
    if (savingIp) return;
    setSavingIp(true);
    sendCommand('wifi_config', ipConfig, { successMessage: 'IP settings saved. Reconnecting...' });
    setTimeout(() => setSavingIp(false), 600);
  };

  // Validate IP address format
  const isValidIp = (ip: string) => {
    if (!ip) return true; // Empty is OK for optional fields
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
      const num = parseInt(part, 10);
      return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
    });
  };

  const ipConfigValid = !ipConfig.staticIp || (
    isValidIp(ipConfig.ip) && ipConfig.ip !== '' &&
    isValidIp(ipConfig.gateway) && ipConfig.gateway !== '' &&
    isValidIp(ipConfig.subnet) && ipConfig.subnet !== '' &&
    isValidIp(ipConfig.dns1)
  );

  return (
    <>
      {/* WiFi Status */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Wifi className="w-5 h-5" />}>WiFi</CardTitle>
        </CardHeader>

        <div className="space-y-3 mb-6">
          <StatusRow 
            label="Status" 
            value={
              <Badge variant={wifi.connected ? 'success' : wifi.apMode ? 'warning' : 'error'}>
                {wifi.connected ? 'Connected' : wifi.apMode ? 'AP Mode' : 'Disconnected'}
              </Badge>
            }
          />
          <StatusRow label="Network" value={wifi.ssid || '—'} />
          <StatusRow label="IP Address" value={wifi.ip || '—'} mono />
          <StatusRow 
            label="Signal" 
            value={wifi.rssi ? `${wifi.rssi} dBm` : '—'} 
          />
        </div>

        <Button variant="ghost" onClick={forgetWifi}>
          <X className="w-4 h-4" />
          Forget Network
        </Button>
      </Card>

      {/* IP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Network className="w-5 h-5" />}>
            IP Configuration
          </CardTitle>
        </CardHeader>

        {!editingIp ? (
          /* View mode */
          <>
            <div className="space-y-0 mb-4">
              <StatusRow label="Mode" value={wifi.staticIp ? 'Static' : 'DHCP'} />
              <StatusRow label="Gateway" value={wifi.gateway || '—'} mono />
              <StatusRow label="Subnet" value={wifi.subnet || '—'} mono />
              <StatusRow label="DNS" value={wifi.dns1 ? `${wifi.dns1}${wifi.dns2 ? `, ${wifi.dns2}` : ''}` : '—'} mono />
            </div>
            {!wifi.apMode && (
              <Button variant="ghost" onClick={() => setEditingIp(true)}>
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            )}
          </>
        ) : (
          /* Edit mode */
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-theme">
              <span className="text-sm text-theme-muted">Mode</span>
              <Toggle
                checked={ipConfig.staticIp}
                onChange={(checked) => setIpConfig({ ...ipConfig, staticIp: checked })}
                label={ipConfig.staticIp ? 'Static' : 'DHCP'}
              />
            </div>

            {ipConfig.staticIp && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="IP Address"
                    placeholder="192.168.1.100"
                    value={ipConfig.ip}
                    onChange={(e) => setIpConfig({ ...ipConfig, ip: e.target.value })}
                    error={ipConfig.ip && !isValidIp(ipConfig.ip) ? 'Invalid format' : undefined}
                  />
                  <Input
                    label="Gateway"
                    placeholder="192.168.1.1"
                    value={ipConfig.gateway}
                    onChange={(e) => setIpConfig({ ...ipConfig, gateway: e.target.value })}
                    error={ipConfig.gateway && !isValidIp(ipConfig.gateway) ? 'Invalid format' : undefined}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Subnet Mask"
                    placeholder="255.255.255.0"
                    value={ipConfig.subnet}
                    onChange={(e) => setIpConfig({ ...ipConfig, subnet: e.target.value })}
                    error={ipConfig.subnet && !isValidIp(ipConfig.subnet) ? 'Invalid format' : undefined}
                  />
                  <Input
                    label="Primary DNS"
                    placeholder="8.8.8.8"
                    value={ipConfig.dns1}
                    onChange={(e) => setIpConfig({ ...ipConfig, dns1: e.target.value })}
                    error={ipConfig.dns1 && !isValidIp(ipConfig.dns1) ? 'Invalid format' : undefined}
                  />
                  <Input
                    label="Secondary DNS"
                    placeholder="8.8.4.4"
                    value={ipConfig.dns2}
                    onChange={(e) => setIpConfig({ ...ipConfig, dns2: e.target.value })}
                    error={ipConfig.dns2 && !isValidIp(ipConfig.dns2) ? 'Invalid format' : undefined}
                    hint="Optional"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingIp(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  saveIpConfig();
                  setEditingIp(false);
                }} 
                loading={savingIp} 
                disabled={savingIp || !ipConfigValid}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* MQTT Settings */}
      <Card>
        <CardHeader
          action={
            <Toggle
              checked={mqttConfig.enabled}
              onChange={(enabled) => setMqttConfig({ ...mqttConfig, enabled })}
            />
          }
        >
          <CardTitle icon={<Radio className="w-5 h-5" />}>
            MQTT / Home Assistant
          </CardTitle>
        </CardHeader>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Broker Address"
              placeholder="homeassistant.local"
              value={mqttConfig.broker}
              onChange={(e) => setMqttConfig({ ...mqttConfig, broker: e.target.value })}
            />
            <Input
              label="Topic Prefix"
              placeholder="brewos"
              value={mqttConfig.topic}
              onChange={(e) => setMqttConfig({ ...mqttConfig, topic: e.target.value })}
              hint="Topics: {prefix}/status, {prefix}/command"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Port"
              type="number"
              value={mqttConfig.port}
              onChange={(e) => setMqttConfig({ ...mqttConfig, port: parseInt(e.target.value) })}
            />
            <Input
              label="Username"
              placeholder="Optional"
              value={mqttConfig.username}
              onChange={(e) => setMqttConfig({ ...mqttConfig, username: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Optional"
              value={mqttConfig.password}
              onChange={(e) => setMqttConfig({ ...mqttConfig, password: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mqttConfig.discovery}
              onChange={(e) => setMqttConfig({ ...mqttConfig, discovery: e.target.checked })}
              className="w-4 h-4 rounded border-theme text-accent focus:ring-accent"
            />
            <span className="text-sm text-theme-secondary">Enable Home Assistant auto-discovery</span>
          </label>

          <div className="flex items-center gap-2 p-3 bg-theme-secondary rounded-xl">
            {mqtt.connected ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : mqtt.enabled ? (
              <X className="w-4 h-4 text-red-500" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-theme-muted/30" />
            )}
            <span className="text-sm text-theme-secondary">
              {mqtt.connected ? 'Connected to broker' : mqtt.enabled ? 'Disconnected' : 'Disabled'}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={testMqtt} loading={testingMqtt}>
            {testingMqtt ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button onClick={saveMqtt} loading={savingMqtt} disabled={savingMqtt}>Save MQTT Settings</Button>
        </div>
      </Card>
    </>
  );
}

