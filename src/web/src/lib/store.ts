import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  ConnectionState,
  MachineStatus,
  Temperatures,
  PowerStatus,
  WaterStatus,
  ScaleStatus,
  BBWSettings,
  ShotStatus,
  WiFiStatus,
  MQTTStatus,
  ESP32Info,
  PicoInfo,
  DeviceInfo,
  Statistics,
  Alert,
  LogEntry,
  ScaleScanResult,
  WebSocketMessage,
  UserPreferences,
} from './types';
import { Connection } from './connection';

interface BrewOSState {
  // Connection
  connectionState: ConnectionState;
  
  // Device identity
  device: DeviceInfo;
  
  // Machine
  machine: MachineStatus;
  temps: Temperatures;
  pressure: number;
  power: PowerStatus;
  water: WaterStatus;
  
  // Scale
  scale: ScaleStatus;
  scaleScanning: boolean;
  scanResults: ScaleScanResult[];
  
  // Brew-by-weight
  bbw: BBWSettings;
  shot: ShotStatus;
  
  // Network
  wifi: WiFiStatus;
  mqtt: MQTTStatus;
  
  // Device info
  esp32: ESP32Info;
  pico: PicoInfo;
  
  // Stats & logs
  stats: Statistics;
  alerts: Alert[];
  logs: LogEntry[];
  
  // User preferences (localStorage)
  preferences: UserPreferences;
  
  // Actions
  setConnectionState: (state: ConnectionState) => void;
  processMessage: (message: WebSocketMessage) => void;
  dismissAlert: (id: number) => void;
  clearLogs: () => void;
  addScanResult: (result: ScaleScanResult) => void;
  setScaleScanning: (scanning: boolean) => void;
  clearScanResults: () => void;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

// Default state
const defaultMachine: MachineStatus = {
  state: 'unknown',
  mode: 'standby',
  isHeating: false,
  isBrewing: false,
};

const defaultTemps: Temperatures = {
  brew: { current: 0, setpoint: 93.5, max: 105 },
  steam: { current: 0, setpoint: 145, max: 160 },
};

const defaultPower: PowerStatus = {
  current: 0,
  voltage: 220,
  todayKwh: 0,
  totalKwh: 0,
};

const defaultWater: WaterStatus = {
  tankLevel: 'ok',
  dripTrayFull: false,
};

const defaultScale: ScaleStatus = {
  connected: false,
  name: '',
  type: '',
  weight: 0,
  flowRate: 0,
  stable: false,
  battery: 0,
};

const defaultBBW: BBWSettings = {
  enabled: false,
  targetWeight: 36,
  doseWeight: 18,
  stopOffset: 2,
  autoTare: true,
};

const defaultShot: ShotStatus = {
  active: false,
  startTime: 0,
  duration: 0,
  weight: 0,
  flowRate: 0,
};

const defaultWifi: WiFiStatus = {
  connected: false,
  ssid: '',
  ip: '',
  rssi: 0,
  apMode: false,
};

const defaultMqtt: MQTTStatus = {
  enabled: false,
  connected: false,
  broker: '',
  topic: 'brewos',
};

const defaultEsp32: ESP32Info = {
  version: '',
  freeHeap: 0,
  uptime: 0,
};

const defaultPico: PicoInfo = {
  connected: false,
  version: '',
  uptime: 0,
};

const defaultStats: Statistics = {
  totalShots: 0,
  shotsToday: 0,
  lastCleaning: null,
  shotsSinceCleaning: 0,
};

const defaultDevice: DeviceInfo = {
  deviceId: '',
  deviceName: 'My BrewOS',
  machineBrand: '',
  machineModel: '',
  machineType: '',
  firmwareVersion: '',
};

// Load preferences from localStorage
const loadPreferences = (): UserPreferences => {
  const defaults: UserPreferences = {
    firstDayOfWeek: 'sunday',
    use24HourTime: false,
  };
  
  try {
    const saved = localStorage.getItem('brewos_preferences');
    if (saved) {
      return { ...defaults, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load preferences:', e);
  }
  return defaults;
};

const savePreferences = (prefs: UserPreferences) => {
  try {
    localStorage.setItem('brewos_preferences', JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save preferences:', e);
  }
};

export const useStore = create<BrewOSState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    connectionState: 'disconnected',
    device: defaultDevice,
    machine: defaultMachine,
    temps: defaultTemps,
    pressure: 0,
    power: defaultPower,
    water: defaultWater,
    scale: defaultScale,
    scaleScanning: false,
    scanResults: [],
    bbw: defaultBBW,
    shot: defaultShot,
    wifi: defaultWifi,
    mqtt: defaultMqtt,
    esp32: defaultEsp32,
    pico: defaultPico,
    stats: defaultStats,
    alerts: [],
    logs: [],
    preferences: loadPreferences(),

    // Actions
    setConnectionState: (state) => set({ connectionState: state }),

    processMessage: (message) => {
      const { type, ...data } = message;
      
      switch (type) {
        case 'status':
          set((state) => ({
            machine: { ...state.machine, ...(data.machine as Partial<MachineStatus>) },
            temps: data.temps ? { ...state.temps, ...(data.temps as Partial<Temperatures>) } : state.temps,
            pressure: (data.pressure as number) ?? state.pressure,
            power: data.power ? { ...state.power, ...(data.power as Partial<PowerStatus>) } : state.power,
            scale: data.scale ? { ...state.scale, ...(data.scale as Partial<ScaleStatus>) } : state.scale,
          }));
          break;

        case 'esp_status':
          set((state) => ({
            esp32: {
              version: (data.version as string) || state.esp32.version,
              freeHeap: (data.freeHeap as number) || state.esp32.freeHeap,
              uptime: (data.uptime as number) || state.esp32.uptime,
            },
            wifi: data.wifi ? {
              ...state.wifi,
              ...(data.wifi as Partial<WiFiStatus>),
            } : state.wifi,
            mqtt: data.mqtt ? {
              ...state.mqtt,
              ...(data.mqtt as Partial<MQTTStatus>),
            } : state.mqtt,
          }));
          break;

        case 'pico_status':
          set((state) => ({
            pico: {
              connected: true,
              version: (data.version as string) || state.pico.version,
              uptime: (data.uptime as number) || state.pico.uptime,
            },
            machine: {
              ...state.machine,
              state: (data.state as MachineStatus['state']) || state.machine.state,
              isHeating: (data.isHeating as boolean) ?? state.machine.isHeating,
              isBrewing: (data.isBrewing as boolean) ?? state.machine.isBrewing,
            },
            temps: {
              brew: {
                current: (data.brewTemp as number) ?? state.temps.brew.current,
                setpoint: (data.brewSetpoint as number) ?? state.temps.brew.setpoint,
                max: state.temps.brew.max,
              },
              steam: {
                current: (data.steamTemp as number) ?? state.temps.steam.current,
                setpoint: (data.steamSetpoint as number) ?? state.temps.steam.setpoint,
                max: state.temps.steam.max,
              },
            },
            pressure: (data.pressure as number) ?? state.pressure,
            power: {
              ...state.power,
              current: (data.power as number) ?? state.power.current,
              voltage: (data.voltage as number) ?? state.power.voltage,
            },
            water: {
              tankLevel: (data.waterLevel as WaterStatus['tankLevel']) || state.water.tankLevel,
              dripTrayFull: (data.dripTrayFull as boolean) ?? state.water.dripTrayFull,
            },
          }));
          break;

        case 'scale_status':
          set((state) => ({
            scale: {
              connected: (data.connected as boolean) ?? state.scale.connected,
              name: (data.name as string) || state.scale.name,
              type: (data.type as string) || state.scale.type,
              weight: (data.weight as number) ?? state.scale.weight,
              flowRate: (data.flowRate as number) ?? state.scale.flowRate,
              stable: (data.stable as boolean) ?? state.scale.stable,
              battery: (data.battery as number) ?? state.scale.battery,
            },
          }));
          break;

        case 'scan_result':
          get().addScanResult(data as unknown as ScaleScanResult);
          break;

        case 'scan_complete':
          set({ scaleScanning: false });
          break;

        case 'event':
          handleEvent(data, set, get);
          break;

        case 'log':
          addLog(data, set, get);
          break;

        case 'error':
          addAlert('error', data.message as string, set, get);
          break;

        case 'device_info':
          set((state) => ({
            device: {
              deviceId: (data.deviceId as string) || state.device.deviceId,
              deviceName: (data.deviceName as string) || state.device.deviceName,
              machineBrand: (data.machineBrand as string) || state.device.machineBrand,
              machineModel: (data.machineModel as string) || state.device.machineModel,
              machineType: (data.machineType as string) || state.device.machineType,
              firmwareVersion: (data.firmwareVersion as string) || state.device.firmwareVersion,
            },
          }));
          break;
      }
    },

    dismissAlert: (id) => set((state) => ({
      alerts: state.alerts.map(a => 
        a.id === id ? { ...a, dismissed: true } : a
      ),
    })),

    clearLogs: () => set({ logs: [] }),

    addScanResult: (result) => set((state) => ({
      scanResults: [...state.scanResults, result],
    })),

    setScaleScanning: (scanning) => set({ scaleScanning: scanning }),

    clearScanResults: () => set({ scanResults: [] }),

    setPreference: (key, value) => {
      set((state) => {
        const newPrefs = { ...state.preferences, [key]: value };
        savePreferences(newPrefs);
        return { preferences: newPrefs };
      });
    },
  }))
);

// Helper functions
type SetState = (
  partial: Partial<BrewOSState> | ((state: BrewOSState) => Partial<BrewOSState>)
) => void;

function handleEvent(
  data: Record<string, unknown>,
  set: SetState,
  get: () => BrewOSState
) {
  switch (data.event) {
    case 'shot_start':
      set({
        shot: {
          active: true,
          startTime: Date.now(),
          duration: 0,
          weight: 0,
          flowRate: 0,
        },
      });
      break;

    case 'shot_end': {
      const state = get();
      set({
        shot: { ...state.shot, active: false },
        stats: {
          ...state.stats,
          totalShots: state.stats.totalShots + 1,
          shotsToday: state.stats.shotsToday + 1,
          shotsSinceCleaning: state.stats.shotsSinceCleaning + 1,
        },
      });
      break;
    }

    case 'alert':
      addAlert(
        (data.level as Alert['level']) || 'warning',
        data.message as string,
        set,
        get
      );
      break;
  }
}

function addLog(
  data: Record<string, unknown>,
  set: SetState,
  get: () => BrewOSState
) {
  const log: LogEntry = {
    id: Date.now(),
    time: new Date().toISOString(),
    level: (data.level as string) || 'info',
    message: data.message as string,
  };
  set({ logs: [log, ...get().logs.slice(0, 99)] });
}

function addAlert(
  level: Alert['level'],
  message: string,
  set: SetState,
  get: () => BrewOSState
) {
  const alert: Alert = {
    id: Date.now(),
    time: new Date().toISOString(),
    level,
    message,
    dismissed: false,
  };
  set({ alerts: [alert, ...get().alerts] });
}

// Connection helper
export function initializeStore(connection: Connection) {
  connection.onStateChange((state) => {
    useStore.getState().setConnectionState(state);
  });

  connection.onMessage((message) => {
    useStore.getState().processMessage(message);
  });
}

