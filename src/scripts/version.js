#!/usr/bin/env node
/**
 * BrewOS Version Management Script
 *
 * Manages firmware and protocol versions from a single source of truth.
 * Updates version definitions in all firmware projects.
 *
 * Usage:
 *   node src/scripts/version.js                 # Show current version
 *   node src/scripts/version.js --bump patch   # Bump patch version
 *   node src/scripts/version.js --bump minor   # Bump minor version
 *   node src/scripts/version.js --bump major   # Bump major version
 *   node src/scripts/version.js --set 1.2.3    # Set specific version
 *   node src/scripts/version.js --protocol 2   # Set protocol version
 */

const fs = require('fs');
const path = require('path');

// Project root (parent of src/scripts/)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const VERSION_FILE = path.join(PROJECT_ROOT, 'VERSION');

// Files to update
const PICO_CONFIG = path.join(PROJECT_ROOT, 'src/pico/include/config.h');
const ESP32_CONFIG = path.join(PROJECT_ROOT, 'src/esp32/include/config.h');
const PROTOCOL_DEFS = path.join(PROJECT_ROOT, 'src/shared/protocol_defs.h');

/**
 * Read version from VERSION file
 */
function readVersionFile() {
  if (!fs.existsSync(VERSION_FILE)) {
    throw new Error(`VERSION file not found at ${VERSION_FILE}`);
  }

  const content = fs.readFileSync(VERSION_FILE, 'utf8');
  let firmwareVersion = null;
  let protocolVersion = null;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('FIRMWARE_VERSION=')) {
      firmwareVersion = trimmed.split('=')[1].trim();
    } else if (trimmed.startsWith('PROTOCOL_VERSION=')) {
      protocolVersion = trimmed.split('=')[1].trim();
    }
  }

  if (!firmwareVersion || !protocolVersion) {
    throw new Error('VERSION file missing FIRMWARE_VERSION or PROTOCOL_VERSION');
  }

  return { firmwareVersion, protocolVersion: parseInt(protocolVersion, 10) };
}

/**
 * Write version to VERSION file
 */
function writeVersionFile(firmwareVersion, protocolVersion) {
  const content = `# BrewOS Firmware Version
# Format: MAJOR.MINOR.PATCH
# Follow semantic versioning: https://semver.org/
#
# MAJOR: Breaking changes (protocol version changes, incompatible API)
# MINOR: New features (backward compatible)
# PATCH: Bug fixes (backward compatible)
#
# Protocol version is tracked separately in src/shared/protocol_defs.h
# Increment ECM_PROTOCOL_VERSION for breaking protocol changes

FIRMWARE_VERSION=${firmwareVersion}
PROTOCOL_VERSION=${protocolVersion}
`;
  fs.writeFileSync(VERSION_FILE, content);
}

/**
 * Parse version string into [major, minor, patch]
 */
function parseVersion(versionStr) {
  const match = versionStr.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${versionStr}. Expected MAJOR.MINOR.PATCH`);
  }
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

/**
 * Format version tuple into string
 */
function formatVersion(major, minor, patch) {
  return `${major}.${minor}.${patch}`;
}

/**
 * Bump version by type (major, minor, patch)
 */
function bumpVersion(versionStr, bumpType) {
  const [major, minor, patch] = parseVersion(versionStr);

  switch (bumpType) {
    case 'major':
      return formatVersion(major + 1, 0, 0);
    case 'minor':
      return formatVersion(major, minor + 1, 0);
    case 'patch':
      return formatVersion(major, minor, patch + 1);
    default:
      throw new Error(`Invalid bump type: ${bumpType}. Use major, minor, or patch`);
  }
}

/**
 * Update Pico config.h with version
 */
function updatePicoConfig(versionStr) {
  const [major, minor, patch] = parseVersion(versionStr);

  let content = fs.readFileSync(PICO_CONFIG, 'utf8');

  content = content.replace(
    /#define FIRMWARE_VERSION_MAJOR\s+\d+/,
    `#define FIRMWARE_VERSION_MAJOR      ${major}`
  );
  content = content.replace(
    /#define FIRMWARE_VERSION_PATCH\s+\d+/,
    `#define FIRMWARE_VERSION_PATCH      ${patch}`
  );
  content = content.replace(
    /#define FIRMWARE_VERSION_MINOR\s+\d+/,
    `#define FIRMWARE_VERSION_MINOR      ${minor}`
  );

  fs.writeFileSync(PICO_CONFIG, content);
  console.log(`✓ Updated ${PICO_CONFIG}`);
}

/**
 * Update ESP32 config.h with version
 */
function updateEsp32Config(versionStr) {
  const [major, minor, patch] = parseVersion(versionStr);

  let content = fs.readFileSync(ESP32_CONFIG, 'utf8');

  content = content.replace(
    /#define ESP32_VERSION_MAJOR\s+\d+/,
    `#define ESP32_VERSION_MAJOR     ${major}`
  );
  content = content.replace(
    /#define ESP32_VERSION_MINOR\s+\d+/,
    `#define ESP32_VERSION_MINOR     ${minor}`
  );
  content = content.replace(
    /#define ESP32_VERSION_PATCH\s+\d+/,
    `#define ESP32_VERSION_PATCH     ${patch}`
  );
  content = content.replace(
    /#define ESP32_VERSION\s+"[^"]+"/,
    `#define ESP32_VERSION           "${versionStr}"`
  );

  fs.writeFileSync(ESP32_CONFIG, content);
  console.log(`✓ Updated ${ESP32_CONFIG}`);
}

/**
 * Update protocol_defs.h with protocol version
 */
function updateProtocolDefs(protocolVersion) {
  let content = fs.readFileSync(PROTOCOL_DEFS, 'utf8');

  content = content.replace(
    /#define ECM_PROTOCOL_VERSION\s+\d+/,
    `#define ECM_PROTOCOL_VERSION    ${protocolVersion}`
  );

  fs.writeFileSync(PROTOCOL_DEFS, content);
  console.log(`✓ Updated ${PROTOCOL_DEFS}`);
}

/**
 * Update all version files
 */
function updateAllVersions(firmwareVersion, protocolVersion) {
  console.log(`Updating versions: firmware=${firmwareVersion}, protocol=${protocolVersion}`);
  console.log();

  updatePicoConfig(firmwareVersion);
  updateEsp32Config(firmwareVersion);
  updateProtocolDefs(protocolVersion);
  writeVersionFile(firmwareVersion, protocolVersion);

  console.log();
  console.log('✓ All versions updated successfully!');
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
BrewOS Version Management

Usage:
  node src/scripts/version.js [options]

Options:
  --bump <type>     Bump version (major, minor, or patch)
  --set <version>   Set specific version (e.g., 1.2.3)
  --protocol <num>  Set protocol version
  --show            Show current versions (default)
  --help, -h        Show this help message

Examples:
  node src/scripts/version.js                 # Show current version
  node src/scripts/version.js --bump patch    # Bump patch version
  node src/scripts/version.js --bump minor    # Bump minor version  
  node src/scripts/version.js --bump major    # Bump major version
  node src/scripts/version.js --set 1.2.3     # Set specific version
  node src/scripts/version.js --protocol 2    # Set protocol version
`);
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let bumpType = null;
  let setVersion = null;
  let setProtocol = null;
  let showOnly = true;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--bump':
        bumpType = args[++i];
        showOnly = false;
        break;
      case '--set':
        setVersion = args[++i];
        showOnly = false;
        break;
      case '--protocol':
        setProtocol = parseInt(args[++i], 10);
        showOnly = false;
        break;
      case '--show':
        showOnly = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}`);
        showHelp();
        process.exit(1);
    }
  }

  // Read current versions
  let firmwareVersion, protocolVersion;
  try {
    const versions = readVersionFile();
    firmwareVersion = versions.firmwareVersion;
    protocolVersion = versions.protocolVersion;
  } catch (err) {
    if (err.message.includes('not found')) {
      console.log('Error: VERSION file not found. Creating default...');
      writeVersionFile('0.1.0', 1);
      const versions = readVersionFile();
      firmwareVersion = versions.firmwareVersion;
      protocolVersion = versions.protocolVersion;
    } else {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  }

  // Handle commands
  if (setVersion) {
    try {
      parseVersion(setVersion); // Validate format
      firmwareVersion = setVersion;
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  }

  if (bumpType) {
    try {
      firmwareVersion = bumpVersion(firmwareVersion, bumpType);
      console.log(`Bumped ${bumpType} version to ${firmwareVersion}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  }

  if (setProtocol !== null) {
    protocolVersion = setProtocol;
    console.log(`Setting protocol version to ${protocolVersion}`);
  }

  // Update files if version changed
  if (!showOnly) {
    updateAllVersions(firmwareVersion, protocolVersion);
  } else {
    // Just show current versions
    console.log(`Firmware Version: ${firmwareVersion}`);
    console.log(`Protocol Version: ${protocolVersion}`);
    const [major, minor, patch] = parseVersion(firmwareVersion);
    console.log();
    console.log('Current version definitions:');
    console.log(`  Pico:     ${major}.${minor}.${patch}`);
    console.log(`  ESP32:    ${major}.${minor}.${patch}`);
    console.log(`  Protocol: ${protocolVersion}`);
  }
}

main();

