import { useStore } from '@/lib/store';
import { getConnection } from '@/lib/connection';
import { Card, CardHeader, CardTitle } from '@/components/Card';
import { Gauge } from '@/components/Gauge';
import { Badge } from '@/components/Badge';
import { 
  Flame, 
  Wind, 
  Gauge as GaugeIcon, 
  Zap, 
  Droplets,
  Coffee,
  Clock,
  Scale,
  Power,
} from 'lucide-react';
import { formatUptime, getMachineStateLabel, getMachineStateColor } from '@/lib/utils';

export function Dashboard() {
  const machine = useStore((s) => s.machine);
  const temps = useStore((s) => s.temps);
  const pressure = useStore((s) => s.pressure);
  const power = useStore((s) => s.power);
  const water = useStore((s) => s.water);
  const scale = useStore((s) => s.scale);
  const stats = useStore((s) => s.stats);
  const esp32 = useStore((s) => s.esp32);

  const setMode = (mode: string) => {
    getConnection()?.sendCommand('set_mode', { mode });
  };

  return (
    <div className="space-y-6">
      {/* Machine Status */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-coffee-900 mb-2">Machine Status</h2>
            <Badge className={getMachineStateColor(machine.state)}>
              {getMachineStateLabel(machine.state)}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            {['standby', 'on', 'eco'].map((mode) => (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-semibold transition-all
                  ${machine.mode === mode
                    ? 'bg-coffee-800 text-white shadow-soft'
                    : 'bg-cream-200 text-coffee-600 hover:bg-cream-300'
                  }
                `}
              >
                {mode === 'standby' && <Power className="w-4 h-4 inline mr-1.5" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Temperature Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Gauge
          value={temps.brew.current}
          max={temps.brew.max}
          setpoint={temps.brew.setpoint}
          label="Brew Boiler"
          unit="°C"
          icon={<Flame className="w-5 h-5" />}
          variant="default"
        />
        <Gauge
          value={temps.steam.current}
          max={temps.steam.max}
          setpoint={temps.steam.setpoint}
          label="Steam Boiler"
          unit="°C"
          icon={<Wind className="w-5 h-5" />}
          variant="steam"
        />
      </div>

      {/* Pressure & Power */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pressure */}
        <Card>
          <CardHeader>
            <CardTitle icon={<GaugeIcon className="w-5 h-5" />}>Pressure</CardTitle>
          </CardHeader>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-bold text-coffee-900 tabular-nums">
              {pressure.toFixed(1)}
            </span>
            <span className="text-2xl text-coffee-500">bar</span>
          </div>
          <div className="relative h-4 bg-cream-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (pressure / 15) * 100)}%` }}
            />
            {/* Markers */}
            <div className="absolute inset-0 flex justify-between px-1 text-[8px] text-coffee-500">
              {[0, 5, 10, 15].map((mark) => (
                <span key={mark} className="relative top-5">{mark}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Power */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Zap className="w-5 h-5" />}>Power</CardTitle>
          </CardHeader>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-bold text-coffee-900 tabular-nums">
              {Math.round(power.current)}
            </span>
            <span className="text-2xl text-coffee-500">W</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-coffee-400">Today</span>
              <p className="font-semibold text-coffee-700">{power.todayKwh.toFixed(1)} kWh</p>
            </div>
            <div>
              <span className="text-coffee-400">Voltage</span>
              <p className="font-semibold text-coffee-700">{power.voltage} V</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          icon={<Coffee className="w-5 h-5" />}
          label="Shots Today"
          value={stats.shotsToday.toString()}
        />
        <QuickStat
          icon={<Clock className="w-5 h-5" />}
          label="Uptime"
          value={formatUptime(esp32.uptime)}
        />
        <QuickStat
          icon={<Droplets className="w-5 h-5" />}
          label="Water Tank"
          value={water.tankLevel.toUpperCase()}
          status={water.tankLevel === 'ok' ? 'success' : water.tankLevel === 'low' ? 'warning' : 'error'}
        />
        <QuickStat
          icon={<Scale className="w-5 h-5" />}
          label="Scale"
          value={scale.connected ? `${scale.weight.toFixed(1)}g` : 'Not connected'}
          status={scale.connected ? 'success' : undefined}
        />
      </div>
    </div>
  );
}

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status?: 'success' | 'warning' | 'error';
}

function QuickStat({ icon, label, value, status }: QuickStatProps) {
  const statusColors = {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
  };

  return (
    <Card className="flex flex-col items-center text-center p-4">
      <span className="text-accent mb-2">{icon}</span>
      <span className={`text-lg font-bold ${status ? statusColors[status] : 'text-coffee-900'}`}>
        {value}
      </span>
      <span className="text-xs text-coffee-500">{label}</span>
    </Card>
  );
}

