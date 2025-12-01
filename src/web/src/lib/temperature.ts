/**
 * Temperature Conversion Utilities
 * 
 * All internal values are stored in Celsius.
 * These utilities convert for display based on user preference.
 */

import type { TemperatureUnit } from './types';

// =============================================================================
// Conversion Functions
// =============================================================================

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * 5/9;
}

/**
 * Convert temperature from Celsius to the target unit
 */
export function convertFromCelsius(celsius: number, unit: TemperatureUnit): number {
  if (unit === 'fahrenheit') {
    return celsiusToFahrenheit(celsius);
  }
  return celsius;
}

/**
 * Convert temperature from the given unit to Celsius
 */
export function convertToCelsius(value: number, unit: TemperatureUnit): number {
  if (unit === 'fahrenheit') {
    return fahrenheitToCelsius(value);
  }
  return value;
}

// =============================================================================
// Display Functions
// =============================================================================

/**
 * Format temperature for display with appropriate precision
 */
export function formatTemperature(
  celsius: number, 
  unit: TemperatureUnit, 
  decimals: number = 1
): string {
  const value = convertFromCelsius(celsius, unit);
  return value.toFixed(decimals);
}

/**
 * Format temperature with unit symbol
 */
export function formatTemperatureWithUnit(
  celsius: number, 
  unit: TemperatureUnit, 
  decimals: number = 1
): string {
  const value = formatTemperature(celsius, unit, decimals);
  return `${value}°${unit === 'celsius' ? 'C' : 'F'}`;
}

/**
 * Get the unit symbol
 */
export function getUnitSymbol(unit: TemperatureUnit): string {
  return unit === 'celsius' ? '°C' : '°F';
}

/**
 * Get short unit label
 */
export function getUnitLabel(unit: TemperatureUnit): string {
  return unit === 'celsius' ? 'Celsius' : 'Fahrenheit';
}

// =============================================================================
// Range Conversion (for inputs, gauges, etc.)
// =============================================================================

/**
 * Convert a temperature range from Celsius to the target unit
 */
export function convertRange(
  min: number, 
  max: number, 
  unit: TemperatureUnit
): { min: number; max: number } {
  return {
    min: convertFromCelsius(min, unit),
    max: convertFromCelsius(max, unit),
  };
}

/**
 * Get common temperature ranges in the specified unit
 */
export function getTemperatureRanges(unit: TemperatureUnit) {
  return {
    brew: {
      min: convertFromCelsius(80, unit),
      max: convertFromCelsius(105, unit),
      recommended: {
        min: convertFromCelsius(92, unit),
        max: convertFromCelsius(96, unit),
      },
    },
    steam: {
      min: convertFromCelsius(120, unit),
      max: convertFromCelsius(160, unit),
    },
    boiler: {
      min: convertFromCelsius(80, unit),
      max: convertFromCelsius(160, unit),
    },
  };
}

/**
 * Get step value for temperature inputs based on unit
 * Fahrenheit uses whole numbers, Celsius uses 0.5
 */
export function getTemperatureStep(unit: TemperatureUnit): number {
  return unit === 'celsius' ? 0.5 : 1;
}

