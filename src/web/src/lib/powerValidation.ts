/**
 * Power Validation Utilities
 * 
 * Validates heating strategies against power settings to prevent
 * circuit breaker trips and ensure safe operation.
 * 
 * User-facing modes:
 * - "brew_only": Heat only brew boiler (for espresso without steam)
 * - "brew_steam": Heat both boilers (for espresso + milk drinks)
 * 
 * Internal heating strategies (auto-selected based on power config):
 * - BREW_ONLY (0): Only brew heater
 * - SEQUENTIAL (1): Brew first, then steam
 * - PARALLEL (2): Both heaters simultaneously  
 * - SMART_STAGGER (3): Power-aware staggering
 */

import type { MachineDefinition } from './machines';

// Safety margin for combined current (5% below max)
const SAFETY_MARGIN = 0.95;

// User-facing power modes
export const POWER_MODES = {
  BREW_ONLY: 'brew_only',
  BREW_STEAM: 'brew_steam',
} as const;

export type PowerMode = typeof POWER_MODES[keyof typeof POWER_MODES];

// Internal heating strategy values (matches protocol_defs.h)
// These are implementation details - not shown to users
export const HEATING_STRATEGIES = {
  BREW_ONLY: 0,
  SEQUENTIAL: 1,
  PARALLEL: 2,
  SMART_STAGGER: 3,
} as const;

export type HeatingStrategy = typeof HEATING_STRATEGIES[keyof typeof HEATING_STRATEGIES];

export interface PowerConfig {
  voltage: number;      // Mains voltage (110, 220, 240)
  maxCurrent: number;   // Max current limit (Amps)
}

export interface HeaterCurrents {
  brewCurrent: number;  // Brew heater current (Amps)
  steamCurrent: number; // Steam heater current (Amps)
}

/**
 * Calculate heater currents from machine specs and voltage
 */
export function calculateHeaterCurrents(
  machine: MachineDefinition | undefined,
  voltage: number
): HeaterCurrents {
  if (!machine || voltage <= 0) {
    return { brewCurrent: 0, steamCurrent: 0 };
  }
  
  const brewPower = machine.specs.brewPowerWatts ?? 0;
  const steamPower = machine.specs.steamPowerWatts ?? 0;
  
  return {
    brewCurrent: brewPower / voltage,
    steamCurrent: steamPower / voltage,
  };
}

/**
 * Check if a heating strategy is safe given the power configuration
 */
export function isHeatingStrategySafe(
  strategy: HeatingStrategy,
  powerConfig: PowerConfig,
  heaterCurrents: HeaterCurrents
): boolean {
  const { maxCurrent } = powerConfig;
  const { brewCurrent, steamCurrent } = heaterCurrents;
  const combinedCurrent = brewCurrent + steamCurrent;
  const safeLimit = maxCurrent * SAFETY_MARGIN;
  
  switch (strategy) {
    case HEATING_STRATEGIES.BREW_ONLY:
      // Only uses brew heater - always safe if brew heater alone fits
      return brewCurrent <= safeLimit;
      
    case HEATING_STRATEGIES.SEQUENTIAL:
      // Only one heater at a time - safe if max single heater fits
      return Math.max(brewCurrent, steamCurrent) <= safeLimit;
      
    case HEATING_STRATEGIES.PARALLEL:
    case HEATING_STRATEGIES.SMART_STAGGER:
      // Both heaters can run together - need combined current check
      return combinedCurrent <= safeLimit;
      
    default:
      return false;
  }
}

/**
 * Get validation result with detailed info for a heating strategy
 */
export interface StrategyValidation {
  isAllowed: boolean;
  reason?: string;
  combinedCurrent?: number;
  safeLimit?: number;
}

export function validateHeatingStrategy(
  strategy: HeatingStrategy,
  powerConfig: PowerConfig,
  heaterCurrents: HeaterCurrents
): StrategyValidation {
  const { maxCurrent } = powerConfig;
  const { brewCurrent, steamCurrent } = heaterCurrents;
  const combinedCurrent = brewCurrent + steamCurrent;
  const safeLimit = maxCurrent * SAFETY_MARGIN;
  
  // Check if we have valid heater data
  if (brewCurrent <= 0 && steamCurrent <= 0) {
    return {
      isAllowed: true,
      reason: 'Machine heater specs not available - validation skipped',
    };
  }
  
  switch (strategy) {
    case HEATING_STRATEGIES.BREW_ONLY:
      return {
        isAllowed: brewCurrent <= safeLimit,
        reason: brewCurrent > safeLimit 
          ? `Brew heater draws ${brewCurrent.toFixed(1)}A, exceeds ${safeLimit.toFixed(1)}A limit`
          : undefined,
      };
      
    case HEATING_STRATEGIES.SEQUENTIAL: {
      const maxSingle = Math.max(brewCurrent, steamCurrent);
      return {
        isAllowed: maxSingle <= safeLimit,
        reason: maxSingle > safeLimit
          ? `Single heater draws ${maxSingle.toFixed(1)}A, exceeds ${safeLimit.toFixed(1)}A limit`
          : undefined,
      };
    }
      
    case HEATING_STRATEGIES.PARALLEL:
    case HEATING_STRATEGIES.SMART_STAGGER:
      return {
        isAllowed: combinedCurrent <= safeLimit,
        combinedCurrent,
        safeLimit,
        reason: combinedCurrent > safeLimit
          ? `Combined ${combinedCurrent.toFixed(1)}A exceeds ${safeLimit.toFixed(1)}A limit (${maxCurrent}A × 95%)`
          : undefined,
      };
      
    default:
      return { isAllowed: false, reason: 'Unknown strategy' };
  }
}

/**
 * Get all allowed heating strategies for given power config
 */
export function getAllowedStrategies(
  powerConfig: PowerConfig,
  heaterCurrents: HeaterCurrents
): HeatingStrategy[] {
  const strategies = Object.values(HEATING_STRATEGIES);
  return strategies.filter(strategy => 
    isHeatingStrategySafe(strategy, powerConfig, heaterCurrents)
  );
}

/**
 * Check if parallel heating is possible with current power settings
 * This is a quick check used by UI to show/hide parallel options
 */
export function canUseParallelHeating(
  machine: MachineDefinition | undefined,
  voltage: number,
  maxCurrent: number
): boolean {
  if (!machine || machine.type !== 'dual_boiler') {
    return false;
  }
  
  const heaterCurrents = calculateHeaterCurrents(machine, voltage);
  return isHeatingStrategySafe(
    HEATING_STRATEGIES.PARALLEL,
    { voltage, maxCurrent },
    heaterCurrents
  );
}

/**
 * Format a warning message for unsafe strategy selection
 */
export function formatPowerWarning(
  machine: MachineDefinition | undefined,
  powerConfig: PowerConfig,
  strategy: HeatingStrategy
): string | null {
  if (!machine) return null;
  
  const heaterCurrents = calculateHeaterCurrents(machine, powerConfig.voltage);
  const validation = validateHeatingStrategy(strategy, powerConfig, heaterCurrents);
  
  if (validation.isAllowed) return null;
  
  const strategyNames: Record<HeatingStrategy, string> = {
    [HEATING_STRATEGIES.BREW_ONLY]: 'Brew Only',
    [HEATING_STRATEGIES.SEQUENTIAL]: 'Sequential',
    [HEATING_STRATEGIES.PARALLEL]: 'Parallel',
    [HEATING_STRATEGIES.SMART_STAGGER]: 'Smart Stagger',
  };
  
  return `${strategyNames[strategy]} heating is not safe with current power settings. ${validation.reason}`;
}

/**
 * Get the best heating strategy for a given power mode and configuration.
 * 
 * For "brew_only" mode: Always returns BREW_ONLY (0)
 * For "brew_steam" mode: Returns the best strategy based on power limits:
 *   - Prefers PARALLEL (fastest) if power allows
 *   - Falls back to SMART_STAGGER if power is borderline
 *   - Falls back to SEQUENTIAL if neither parallel option is safe
 */
export function getHeatingStrategyForPowerMode(
  mode: PowerMode,
  machine: MachineDefinition | undefined,
  powerConfig: PowerConfig
): HeatingStrategy {
  // Brew only mode always uses BREW_ONLY strategy
  if (mode === POWER_MODES.BREW_ONLY) {
    return HEATING_STRATEGIES.BREW_ONLY;
  }
  
  // Brew & Steam mode - auto-select best strategy based on power
  if (!machine) {
    // No machine info - default to SEQUENTIAL (safest)
    return HEATING_STRATEGIES.SEQUENTIAL;
  }
  
  const heaterCurrents = calculateHeaterCurrents(machine, powerConfig.voltage);
  
  // Try PARALLEL first (fastest heating)
  if (isHeatingStrategySafe(HEATING_STRATEGIES.PARALLEL, powerConfig, heaterCurrents)) {
    return HEATING_STRATEGIES.PARALLEL;
  }
  
  // Try SMART_STAGGER (good balance of speed and safety)
  if (isHeatingStrategySafe(HEATING_STRATEGIES.SMART_STAGGER, powerConfig, heaterCurrents)) {
    return HEATING_STRATEGIES.SMART_STAGGER;
  }
  
  // Fall back to SEQUENTIAL (always safe for individual heaters)
  return HEATING_STRATEGIES.SEQUENTIAL;
}

/**
 * User-friendly power mode definitions for UI
 */
export interface PowerModeDefinition {
  value: PowerMode;
  label: string;
  shortLabel: string;
  description: string;
  detail: string;
}

export const POWER_MODE_DEFINITIONS: PowerModeDefinition[] = [
  {
    value: POWER_MODES.BREW_ONLY,
    label: 'Brew Only',
    shortLabel: 'Brew',
    description: 'Espresso without steam',
    detail: 'Heats only the brew boiler. Faster warm-up when you don\'t need steam.',
  },
  {
    value: POWER_MODES.BREW_STEAM,
    label: 'Brew & Steam',
    shortLabel: 'Full',
    description: 'Espresso + milk drinks',
    detail: 'Heats both boilers for complete functionality. Strategy auto-selected based on your power settings.',
  },
];

/**
 * Get power mode from heating strategy
 * Maps internal strategy back to user-facing mode for display
 */
export function getPowerModeFromStrategy(strategy: HeatingStrategy): PowerMode {
  return strategy === HEATING_STRATEGIES.BREW_ONLY 
    ? POWER_MODES.BREW_ONLY 
    : POWER_MODES.BREW_STEAM;
}

/**
 * Get a description of the auto-selected strategy for informational purposes
 */
export function getAutoSelectedStrategyDescription(
  mode: PowerMode,
  machine: MachineDefinition | undefined,
  powerConfig: PowerConfig
): string | null {
  if (mode === POWER_MODES.BREW_ONLY) {
    return null;
  }
  
  const strategy = getHeatingStrategyForPowerMode(mode, machine, powerConfig);
  
  switch (strategy) {
    case HEATING_STRATEGIES.PARALLEL:
      return 'Both boilers will heat simultaneously (fastest)';
    case HEATING_STRATEGIES.SMART_STAGGER:
      return 'Power-efficient staggered heating';
    case HEATING_STRATEGIES.SEQUENTIAL:
      return 'Brew boiler heats first, then steam';
    default:
      return null;
  }
}

