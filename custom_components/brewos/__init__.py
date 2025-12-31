"""BrewOS Espresso Machine Integration for Home Assistant."""
from __future__ import annotations

import logging
import os
import shutil
from pathlib import Path
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr

from .const import DOMAIN, CONF_TOPIC_PREFIX, DEFAULT_TOPIC_PREFIX
from .coordinator import BrewOSCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [
    Platform.SENSOR,
    Platform.BINARY_SENSOR,
    Platform.SWITCH,
    Platform.BUTTON,
    Platform.NUMBER,
    Platform.SELECT,
]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up BrewOS from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    
    topic_prefix = entry.data.get(CONF_TOPIC_PREFIX, DEFAULT_TOPIC_PREFIX)
    device_id = entry.data.get("device_id", "")
    
    coordinator = BrewOSCoordinator(hass, topic_prefix, device_id)
    await coordinator.async_setup()
    
    hass.data[DOMAIN][entry.entry_id] = coordinator
    
    # Register device with information from config entry
    device_registry = dr.async_get(hass)
    device_info = {
        "config_entry_id": entry.entry_id,
        "identifiers": {(DOMAIN, device_id or topic_prefix)},
        "manufacturer": entry.data.get("manufacturer", "BrewOS"),
        "model": entry.data.get("model", "ECM Controller"),
        "name": entry.data.get("name", entry.title or "BrewOS Espresso Machine"),
    }
    
    # Add software version if available
    sw_version = coordinator.data.get("sw_version")
    if sw_version and sw_version != "unknown":
        device_info["sw_version"] = sw_version
    
    # Add configuration URL if device has IP
    # This would need to be extracted from discovery or status messages
    # For now, we'll skip it as it requires additional MQTT subscription
    
    device_registry.async_get_or_create(**device_info)
    
    # Install Lovelace card if not already present
    await _install_lovelace_card(hass)
    
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    
    return True


async def _install_lovelace_card(hass: HomeAssistant) -> None:
    """Install the Lovelace card to www directory if not already present."""
    try:
        # Get the integration directory (custom_components/brewos/)
        integration_dir = Path(__file__).parent
        
        # Try multiple possible locations for the card source
        # 1. In the repo structure: homeassistant/lovelace/brewos-card.js
        # 2. In installed structure: custom_components/brewos/lovelace/brewos-card.js
        possible_sources = [
            integration_dir.parent.parent / "lovelace" / "brewos-card.js",  # Repo structure
            integration_dir / "lovelace" / "brewos-card.js",  # Installed structure
        ]
        
        card_source = None
        for source in possible_sources:
            if source.exists():
                card_source = source
                break
        
        if not card_source:
            _LOGGER.debug("Lovelace card source not found, skipping installation")
            return
        
        # Get Home Assistant config directory
        config_dir = Path(hass.config.config_dir)
        www_dir = config_dir / "www"
        card_dest = www_dir / "brewos-card.js"
        
        # Check if card already exists
        if card_dest.exists():
            _LOGGER.debug("Lovelace card already exists at %s", card_dest)
            return
        
        # Use hass.async_add_executor_job for file I/O
        def copy_card():
            www_dir.mkdir(exist_ok=True)
            shutil.copy2(card_source, card_dest)
            _LOGGER.info("Lovelace card installed to %s", card_dest)
        
        await hass.async_add_executor_job(copy_card)
        _LOGGER.info(
            "BrewOS Lovelace card installed to %s. "
            "Add it to your Lovelace resources: "
            "Settings → Dashboards → Resources → Add Resource → "
            "URL: /local/brewos-card.js, Type: JavaScript Module",
            card_dest
        )
    except Exception as err:
        _LOGGER.warning("Failed to install Lovelace card: %s", err)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        coordinator = hass.data[DOMAIN].pop(entry.entry_id)
        await coordinator.async_shutdown()
    
    return unload_ok

