import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getConnection } from '@/lib/connection';
import { Card, CardHeader, CardTitle } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Toggle } from '@/components/Toggle';
import { Badge } from '@/components/Badge';
import { 
  Thermometer, 
  Zap, 
  Wifi, 
  Radio, 
  Leaf,
  Check,
  X,
} from 'lucide-react';

export function Settings() {
  const temps = useStore((s) => s.temps);
  const power = useStore((s) => s.power);
  const wifi = useStore((s) => s.wifi);
  const mqtt = useStore((s) => s.mqtt);

  // Local state for forms
  const [brewTemp, setBrewTemp] = useState(temps.brew.setpoint);
  const [steamTemp, setSteamTemp] = useState(temps.steam.setpoint);
  const [voltage, setVoltage] = useState(power.voltage);
  const [maxCurrent, setMaxCurrent] = useState(13);
  const [mqttConfig, setMqttConfig] = useState({
    enabled: mqtt.enabled,
    broker: mqtt.broker || '',
    port: 1883,
    username: '',
    password: '',
    discovery: true,
  });
  const [ecoSettings, setEcoSettings] = useState({
    brewTemp: 80,
    timeout: 30,
  });
  const [testingMqtt, setTestingMqtt] = useState(false);

  const saveTemps = () => {
    getConnection()?.sendCommand('set_temp', { boiler: 'brew', temp: brewTemp });
    getConnection()?.sendCommand('set_temp', { boiler: 'steam', temp: steamTemp });
  };

  const savePower = () => {
    getConnection()?.sendCommand('set_power', { voltage, maxCurrent });
  };

  const testMqtt = async () => {
    setTestingMqtt(true);
    getConnection()?.sendCommand('mqtt_test', mqttConfig);
    setTimeout(() => setTestingMqtt(false), 3000);
  };

  const saveMqtt = () => {
    getConnection()?.sendCommand('mqtt_config', mqttConfig);
  };

  const saveEco = () => {
    getConnection()?.sendCommand('set_eco', ecoSettings);
  };

  const forgetWifi = () => {
    if (confirm('Are you sure? The device will restart in AP mode.')) {
      getConnection()?.sendCommand('wifi_forget');
    }
  };

  return (
    <div className="space-y-6">
      {/* Temperature Settings */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Thermometer className="w-5 h-5" />}>
            Temperature
          </CardTitle>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Input
            label="Brew Temperature"
            type="number"
            min={80}
            max={105}
            step={0.5}
            value={brewTemp}
            onChange={(e) => setBrewTemp(parseFloat(e.target.value))}
            unit="°C"
            hint="Recommended: 92-96°C"
          />
          <Input
            label="Steam Temperature"
            type="number"
            min={120}
            max={160}
            step={1}
            value={steamTemp}
            onChange={(e) => setSteamTemp(parseFloat(e.target.value))}
            unit="°C"
            hint="For milk frothing"
          />
        </div>

        <Button onClick={saveTemps}>Save Temperatures</Button>
      </Card>

      {/* Power Settings */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Zap className="w-5 h-5" />}>Power</CardTitle>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-500">
              Mains Voltage
            </label>
            <select
              value={voltage}
              onChange={(e) => setVoltage(parseInt(e.target.value))}
              className="input"
            >
              <option value="110">110V (US)</option>
              <option value="220">220V (EU/AU)</option>
              <option value="240">240V (UK)</option>
            </select>
          </div>
          <Input
            label="Max Current"
            type="number"
            min={5}
            max={20}
            step={0.5}
            value={maxCurrent}
            onChange={(e) => setMaxCurrent(parseFloat(e.target.value))}
            unit="A"
            hint="Limit for your circuit"
          />
        </div>

        <Button onClick={savePower}>Save Power Settings</Button>
      </Card>

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
          <Input
            label="Broker Address"
            placeholder="homeassistant.local"
            value={mqttConfig.broker}
            onChange={(e) => setMqttConfig({ ...mqttConfig, broker: e.target.value })}
          />

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
              className="w-4 h-4 rounded border-cream-300 text-accent focus:ring-accent"
            />
            <span className="text-sm text-coffee-700">Enable Home Assistant auto-discovery</span>
          </label>

          <div className="flex items-center gap-2 p-3 bg-cream-100 rounded-xl">
            {mqtt.connected ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : mqtt.enabled ? (
              <X className="w-4 h-4 text-red-500" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-cream-300" />
            )}
            <span className="text-sm text-coffee-700">
              {mqtt.connected ? 'Connected to broker' : mqtt.enabled ? 'Disconnected' : 'Disabled'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={testMqtt} loading={testingMqtt}>
            {testingMqtt ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button onClick={saveMqtt}>Save MQTT Settings</Button>
        </div>
      </Card>

      {/* Eco Mode */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Leaf className="w-5 h-5" />}>Eco Mode</CardTitle>
        </CardHeader>

        <p className="text-sm text-coffee-500 mb-4">
          Reduce power consumption when idle by lowering boiler temperatures.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Input
            label="Eco Brew Temp"
            type="number"
            min={60}
            max={90}
            value={ecoSettings.brewTemp}
            onChange={(e) => setEcoSettings({ ...ecoSettings, brewTemp: parseFloat(e.target.value) })}
            unit="°C"
          />
          <Input
            label="Auto-Eco After"
            type="number"
            min={5}
            max={120}
            step={5}
            value={ecoSettings.timeout}
            onChange={(e) => setEcoSettings({ ...ecoSettings, timeout: parseInt(e.target.value) })}
            unit="min"
          />
        </div>

        <Button onClick={saveEco}>Save Eco Settings</Button>
      </Card>
    </div>
  );
}

interface StatusRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

function StatusRow({ label, value, mono }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-cream-200 last:border-0">
      <span className="text-sm text-coffee-500">{label}</span>
      <span className={`text-sm font-medium text-coffee-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

