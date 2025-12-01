/**
 * Supported Machines Database
 * 
 * This file defines all supported espresso machines and their configurations.
 * When a user selects a machine, the corresponding machine type and default
 * settings are automatically applied.
 */

import type { MachineType } from './types';

// =============================================================================
// Machine Definition Types
// =============================================================================

export interface MachineDefinition {
  id: string;                    // Unique identifier (e.g., "ecm_synchronika")
  brand: string;                 // Brand name (e.g., "ECM")
  model: string;                 // Model name (e.g., "Synchronika")
  type: MachineType;             // Machine type for firmware
  description: string;           // Short description
  
  // Default setpoints (can be overridden by user)
  defaults: {
    brewTemp: number;            // Default brew temperature (°C)
    steamTemp: number;           // Default steam temperature (°C)
  };
  
  // Hardware info for reference
  specs: {
    brewPowerWatts?: number;     // Brew boiler power
    steamPowerWatts?: number;    // Steam boiler power
    boilerVolumeMl?: number;     // Boiler volume
  };
}

export interface BrandGroup {
  brand: string;
  machines: MachineDefinition[];
}

// =============================================================================
// Supported Machines Database
// =============================================================================

export const SUPPORTED_MACHINES: MachineDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ECM
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ecm_synchronika',
    brand: 'ECM',
    model: 'Synchronika',
    type: 'dual_boiler',
    description: 'Dual boiler E61 with rotary pump',
    defaults: { brewTemp: 93.5, steamTemp: 127 },
    specs: { brewPowerWatts: 1400, steamPowerWatts: 1000, boilerVolumeMl: 600 },
  },
  {
    id: 'ecm_classika',
    brand: 'ECM',
    model: 'Classika PID',
    type: 'single_boiler',
    description: 'Single boiler with PID control',
    defaults: { brewTemp: 93, steamTemp: 140 },
    specs: { brewPowerWatts: 1200, boilerVolumeMl: 400 },
  },
  {
    id: 'ecm_mechanika',
    brand: 'ECM',
    model: 'Mechanika V Slim',
    type: 'heat_exchanger',
    description: 'Heat exchanger E61 with vibration pump',
    defaults: { brewTemp: 93, steamTemp: 125 },
    specs: { steamPowerWatts: 1200, boilerVolumeMl: 1800 },
  },
  {
    id: 'ecm_technika',
    brand: 'ECM',
    model: 'Technika V Profi PID',
    type: 'heat_exchanger',
    description: 'Heat exchanger E61 with rotary pump and PID',
    defaults: { brewTemp: 93, steamTemp: 125 },
    specs: { steamPowerWatts: 1400, boilerVolumeMl: 2100 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Profitec
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'profitec_pro700',
    brand: 'Profitec',
    model: 'Pro 700',
    type: 'dual_boiler',
    description: 'Dual boiler E61 with rotary pump',
    defaults: { brewTemp: 93.5, steamTemp: 127 },
    specs: { brewPowerWatts: 1400, steamPowerWatts: 1000, boilerVolumeMl: 750 },
  },
  {
    id: 'profitec_pro600',
    brand: 'Profitec',
    model: 'Pro 600',
    type: 'dual_boiler',
    description: 'Dual boiler E61 with vibration pump',
    defaults: { brewTemp: 93.5, steamTemp: 127 },
    specs: { brewPowerWatts: 1200, steamPowerWatts: 800, boilerVolumeMl: 500 },
  },
  {
    id: 'profitec_pro500',
    brand: 'Profitec',
    model: 'Pro 500',
    type: 'heat_exchanger',
    description: 'Heat exchanger E61 with vibration pump',
    defaults: { brewTemp: 93, steamTemp: 125 },
    specs: { steamPowerWatts: 1000, boilerVolumeMl: 750 },
  },
  {
    id: 'profitec_pro300',
    brand: 'Profitec',
    model: 'Pro 300',
    type: 'single_boiler',
    description: 'Single boiler with PID control',
    defaults: { brewTemp: 93, steamTemp: 140 },
    specs: { brewPowerWatts: 1000, boilerVolumeMl: 325 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Rancilio
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'rancilio_silvia',
    brand: 'Rancilio',
    model: 'Silvia',
    type: 'single_boiler',
    description: 'Classic single boiler espresso machine',
    defaults: { brewTemp: 93, steamTemp: 140 },
    specs: { brewPowerWatts: 1100, boilerVolumeMl: 300 },
  },
  {
    id: 'rancilio_silvia_pro',
    brand: 'Rancilio',
    model: 'Silvia Pro',
    type: 'dual_boiler',
    description: 'Dual boiler upgrade of the classic Silvia',
    defaults: { brewTemp: 93, steamTemp: 127 },
    specs: { brewPowerWatts: 1000, steamPowerWatts: 1000, boilerVolumeMl: 300 },
  },
  {
    id: 'rancilio_silvia_pro_x',
    brand: 'Rancilio',
    model: 'Silvia Pro X',
    type: 'dual_boiler',
    description: 'Premium dual boiler with advanced features',
    defaults: { brewTemp: 93, steamTemp: 127 },
    specs: { brewPowerWatts: 1000, steamPowerWatts: 1000, boilerVolumeMl: 300 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Gaggia
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'gaggia_classic',
    brand: 'Gaggia',
    model: 'Classic',
    type: 'single_boiler',
    description: 'Entry-level single boiler machine',
    defaults: { brewTemp: 93, steamTemp: 140 },
    specs: { brewPowerWatts: 1300, boilerVolumeMl: 100 },
  },
  {
    id: 'gaggia_classic_pro',
    brand: 'Gaggia',
    model: 'Classic Pro',
    type: 'single_boiler',
    description: 'Updated Classic with improved internals',
    defaults: { brewTemp: 93, steamTemp: 140 },
    specs: { brewPowerWatts: 1200, boilerVolumeMl: 100 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Lelit
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lelit_bianca',
    brand: 'Lelit',
    model: 'Bianca',
    type: 'dual_boiler',
    description: 'Dual boiler with flow control paddle',
    defaults: { brewTemp: 93.5, steamTemp: 127 },
    specs: { brewPowerWatts: 1200, steamPowerWatts: 1400, boilerVolumeMl: 800 },
  },
  {
    id: 'lelit_elizabeth',
    brand: 'Lelit',
    model: 'Elizabeth',
    type: 'dual_boiler',
    description: 'Compact dual boiler with LCC controller',
    defaults: { brewTemp: 93, steamTemp: 127 },
    specs: { brewPowerWatts: 1000, steamPowerWatts: 1400, boilerVolumeMl: 600 },
  },
  {
    id: 'lelit_mara_x',
    brand: 'Lelit',
    model: 'Mara X',
    type: 'heat_exchanger',
    description: 'Heat exchanger with smart temperature system',
    defaults: { brewTemp: 93, steamTemp: 124 },
    specs: { steamPowerWatts: 1400, boilerVolumeMl: 1800 },
  },
  {
    id: 'lelit_victoria',
    brand: 'Lelit',
    model: 'Victoria',
    type: 'single_boiler',
    description: 'Single boiler with LCC controller',
    defaults: { brewTemp: 93, steamTemp: 140 },
    specs: { brewPowerWatts: 1200, boilerVolumeMl: 250 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Bezzera
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bezzera_bz10',
    brand: 'Bezzera',
    model: 'BZ10',
    type: 'heat_exchanger',
    description: 'Heat exchanger E61 with vibration pump',
    defaults: { brewTemp: 93, steamTemp: 125 },
    specs: { steamPowerWatts: 1200, boilerVolumeMl: 1500 },
  },
  {
    id: 'bezzera_duo',
    brand: 'Bezzera',
    model: 'Duo',
    type: 'dual_boiler',
    description: 'Dual boiler with independent temperature control',
    defaults: { brewTemp: 93, steamTemp: 127 },
    specs: { brewPowerWatts: 1400, steamPowerWatts: 1400, boilerVolumeMl: 600 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Rocket
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'rocket_appartamento',
    brand: 'Rocket',
    model: 'Appartamento',
    type: 'heat_exchanger',
    description: 'Compact heat exchanger E61',
    defaults: { brewTemp: 93, steamTemp: 125 },
    specs: { steamPowerWatts: 1200, boilerVolumeMl: 1800 },
  },
  {
    id: 'rocket_r58',
    brand: 'Rocket',
    model: 'R58',
    type: 'dual_boiler',
    description: 'Dual boiler with dual PID control',
    defaults: { brewTemp: 93.5, steamTemp: 127 },
    specs: { brewPowerWatts: 1200, steamPowerWatts: 1400, boilerVolumeMl: 580 },
  },
  {
    id: 'rocket_mozzafiato',
    brand: 'Rocket',
    model: 'Mozzafiato',
    type: 'heat_exchanger',
    description: 'Heat exchanger E61 with timer',
    defaults: { brewTemp: 93, steamTemp: 125 },
    specs: { steamPowerWatts: 1200, boilerVolumeMl: 1800 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Ascaso
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ascaso_steel_duo',
    brand: 'Ascaso',
    model: 'Steel Duo PID',
    type: 'dual_boiler',
    description: 'Compact dual boiler with thermoblock steam',
    defaults: { brewTemp: 93, steamTemp: 145 },
    specs: { brewPowerWatts: 1050, steamPowerWatts: 1400, boilerVolumeMl: 600 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // La Marzocco
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lamarzocco_linea_mini',
    brand: 'La Marzocco',
    model: 'Linea Mini',
    type: 'dual_boiler',
    description: 'Commercial-grade dual boiler for home',
    defaults: { brewTemp: 93, steamTemp: 127 },
    specs: { brewPowerWatts: 1400, steamPowerWatts: 1600, boilerVolumeMl: 600 },
  },
  {
    id: 'lamarzocco_gs3',
    brand: 'La Marzocco',
    model: 'GS3',
    type: 'dual_boiler',
    description: 'Premium dual boiler with paddle',
    defaults: { brewTemp: 93.5, steamTemp: 127 },
    specs: { brewPowerWatts: 1400, steamPowerWatts: 1600, boilerVolumeMl: 850 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Decent
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'decent_de1',
    brand: 'Decent',
    model: 'DE1',
    type: 'dual_boiler',  // Technically thermoblock but behaves as dual
    description: 'Digital espresso machine with full profiling',
    defaults: { brewTemp: 93, steamTemp: 140 },
    specs: { brewPowerWatts: 1500, steamPowerWatts: 1500 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Quick Mill
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'quickmill_vetrano',
    brand: 'Quick Mill',
    model: 'Vetrano 2B',
    type: 'dual_boiler',
    description: 'Dual boiler E61 machine',
    defaults: { brewTemp: 93, steamTemp: 127 },
    specs: { brewPowerWatts: 1200, steamPowerWatts: 1400, boilerVolumeMl: 750 },
  },
  {
    id: 'quickmill_andreja',
    brand: 'Quick Mill',
    model: 'Andreja Premium',
    type: 'heat_exchanger',
    description: 'Heat exchanger E61 machine',
    defaults: { brewTemp: 93, steamTemp: 125 },
    specs: { steamPowerWatts: 1200, boilerVolumeMl: 1800 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Nuova Simonelli
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'nuovasimonelli_oscar_ii',
    brand: 'Nuova Simonelli',
    model: 'Oscar II',
    type: 'heat_exchanger',
    description: 'Heat exchanger with professional heritage',
    defaults: { brewTemp: 93, steamTemp: 125 },
    specs: { steamPowerWatts: 1200, boilerVolumeMl: 2000 },
  },
  {
    id: 'nuovasimonelli_musica',
    brand: 'Nuova Simonelli',
    model: 'Musica',
    type: 'heat_exchanger',
    description: 'Pour-over heat exchanger',
    defaults: { brewTemp: 93, steamTemp: 125 },
    specs: { steamPowerWatts: 1200, boilerVolumeMl: 2000 },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Breville / Sage
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'breville_dual_boiler',
    brand: 'Breville',
    model: 'Dual Boiler (BES920)',
    type: 'dual_boiler',
    description: 'Dual boiler with integrated grinder',
    defaults: { brewTemp: 93, steamTemp: 127 },
    specs: { brewPowerWatts: 1600, steamPowerWatts: 1600, boilerVolumeMl: 400 },
  },
  {
    id: 'breville_barista_express',
    brand: 'Breville',
    model: 'Barista Express',
    type: 'single_boiler',
    description: 'Single boiler with integrated grinder',
    defaults: { brewTemp: 93, steamTemp: 140 },
    specs: { brewPowerWatts: 1600, boilerVolumeMl: 200 },
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get all unique brands from the supported machines list
 */
export function getBrands(): string[] {
  const brands = new Set(SUPPORTED_MACHINES.map(m => m.brand));
  return Array.from(brands).sort();
}

/**
 * Get all machines for a specific brand
 */
export function getMachinesByBrand(brand: string): MachineDefinition[] {
  return SUPPORTED_MACHINES.filter(m => m.brand === brand);
}

/**
 * Get machines grouped by brand
 */
export function getMachinesGroupedByBrand(): BrandGroup[] {
  const brands = getBrands();
  return brands.map(brand => ({
    brand,
    machines: getMachinesByBrand(brand),
  }));
}

/**
 * Find a machine by its ID
 */
export function getMachineById(id: string): MachineDefinition | undefined {
  return SUPPORTED_MACHINES.find(m => m.id === id);
}

/**
 * Find a machine by brand and model
 */
export function getMachineByBrandModel(brand: string, model: string): MachineDefinition | undefined {
  return SUPPORTED_MACHINES.find(
    m => m.brand.toLowerCase() === brand.toLowerCase() && 
         m.model.toLowerCase() === model.toLowerCase()
  );
}

/**
 * Get all machines of a specific type
 */
export function getMachinesByType(type: MachineType): MachineDefinition[] {
  return SUPPORTED_MACHINES.filter(m => m.type === type);
}

/**
 * Get display name for a machine (Brand + Model)
 */
export function getMachineDisplayName(machine: MachineDefinition): string {
  return `${machine.brand} ${machine.model}`;
}

/**
 * Get machine type label for display
 */
export function getMachineTypeLabel(type: MachineType): string {
  switch (type) {
    case 'dual_boiler': return 'Dual Boiler';
    case 'single_boiler': return 'Single Boiler';
    case 'heat_exchanger': return 'Heat Exchanger';
    default: return 'Unknown';
  }
}

