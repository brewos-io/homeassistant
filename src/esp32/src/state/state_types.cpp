#include "state/state_types.h"

namespace BrewOS {

// =============================================================================
// TemperatureSettings
// =============================================================================

void TemperatureSettings::toJson(JsonObject& obj) const {
    obj["brewSetpoint"] = brewSetpoint;
    obj["steamSetpoint"] = steamSetpoint;
    obj["brewOffset"] = brewOffset;
    obj["steamOffset"] = steamOffset;
    obj["ecoBrewTemp"] = ecoBrewTemp;
    obj["ecoTimeoutMinutes"] = ecoTimeoutMinutes;
}

bool TemperatureSettings::fromJson(const JsonObject& obj) {
    if (obj.containsKey("brewSetpoint")) brewSetpoint = obj["brewSetpoint"];
    if (obj.containsKey("steamSetpoint")) steamSetpoint = obj["steamSetpoint"];
    if (obj.containsKey("brewOffset")) brewOffset = obj["brewOffset"];
    if (obj.containsKey("steamOffset")) steamOffset = obj["steamOffset"];
    if (obj.containsKey("ecoBrewTemp")) ecoBrewTemp = obj["ecoBrewTemp"];
    if (obj.containsKey("ecoTimeoutMinutes")) ecoTimeoutMinutes = obj["ecoTimeoutMinutes"];
    return true;
}

// =============================================================================
// BrewSettings
// =============================================================================

void BrewSettings::toJson(JsonObject& obj) const {
    obj["bbwEnabled"] = bbwEnabled;
    obj["doseWeight"] = doseWeight;
    obj["targetWeight"] = targetWeight;
    obj["stopOffset"] = stopOffset;
    obj["autoTare"] = autoTare;
    obj["preinfusionTime"] = preinfusionTime;
    obj["preinfusionPressure"] = preinfusionPressure;
}

bool BrewSettings::fromJson(const JsonObject& obj) {
    if (obj.containsKey("bbwEnabled")) bbwEnabled = obj["bbwEnabled"];
    if (obj.containsKey("doseWeight")) doseWeight = obj["doseWeight"];
    if (obj.containsKey("targetWeight")) targetWeight = obj["targetWeight"];
    if (obj.containsKey("stopOffset")) stopOffset = obj["stopOffset"];
    if (obj.containsKey("autoTare")) autoTare = obj["autoTare"];
    if (obj.containsKey("preinfusionTime")) preinfusionTime = obj["preinfusionTime"];
    if (obj.containsKey("preinfusionPressure")) preinfusionPressure = obj["preinfusionPressure"];
    return true;
}

// =============================================================================
// PowerSettings
// =============================================================================

void PowerSettings::toJson(JsonObject& obj) const {
    obj["mainsVoltage"] = mainsVoltage;
    obj["maxCurrent"] = maxCurrent;
    obj["powerOnBoot"] = powerOnBoot;
}

bool PowerSettings::fromJson(const JsonObject& obj) {
    if (obj.containsKey("mainsVoltage")) mainsVoltage = obj["mainsVoltage"];
    if (obj.containsKey("maxCurrent")) maxCurrent = obj["maxCurrent"];
    if (obj.containsKey("powerOnBoot")) powerOnBoot = obj["powerOnBoot"];
    return true;
}

// =============================================================================
// NetworkSettings
// =============================================================================

void NetworkSettings::toJson(JsonObject& obj) const {
    obj["wifiSsid"] = wifiSsid;
    // Don't expose password
    obj["wifiConfigured"] = wifiConfigured;
    obj["hostname"] = hostname;
}

bool NetworkSettings::fromJson(const JsonObject& obj) {
    if (obj.containsKey("wifiSsid")) {
        strncpy(wifiSsid, obj["wifiSsid"] | "", sizeof(wifiSsid) - 1);
    }
    if (obj.containsKey("wifiPassword")) {
        strncpy(wifiPassword, obj["wifiPassword"] | "", sizeof(wifiPassword) - 1);
        wifiConfigured = strlen(wifiSsid) > 0;
    }
    if (obj.containsKey("hostname")) {
        strncpy(hostname, obj["hostname"] | "brewos", sizeof(hostname) - 1);
    }
    return true;
}

// =============================================================================
// MQTTSettings
// =============================================================================

void MQTTSettings::toJson(JsonObject& obj) const {
    obj["enabled"] = enabled;
    obj["broker"] = broker;
    obj["port"] = port;
    obj["username"] = username;
    // Don't expose password
    obj["baseTopic"] = baseTopic;
    obj["discovery"] = discovery;
}

bool MQTTSettings::fromJson(const JsonObject& obj) {
    if (obj.containsKey("enabled")) enabled = obj["enabled"];
    if (obj.containsKey("broker")) strncpy(broker, obj["broker"] | "", sizeof(broker) - 1);
    if (obj.containsKey("port")) port = obj["port"];
    if (obj.containsKey("username")) strncpy(username, obj["username"] | "", sizeof(username) - 1);
    if (obj.containsKey("password")) strncpy(password, obj["password"] | "", sizeof(password) - 1);
    if (obj.containsKey("baseTopic")) strncpy(baseTopic, obj["baseTopic"] | "brewos", sizeof(baseTopic) - 1);
    if (obj.containsKey("discovery")) discovery = obj["discovery"];
    return true;
}

// =============================================================================
// CloudSettings
// =============================================================================

void CloudSettings::toJson(JsonObject& obj) const {
    obj["enabled"] = enabled;
    obj["serverUrl"] = serverUrl;
    obj["deviceId"] = deviceId;
    // Don't expose deviceKey
}

bool CloudSettings::fromJson(const JsonObject& obj) {
    if (obj.containsKey("enabled")) enabled = obj["enabled"];
    if (obj.containsKey("serverUrl")) strncpy(serverUrl, obj["serverUrl"] | "", sizeof(serverUrl) - 1);
    if (obj.containsKey("deviceId")) strncpy(deviceId, obj["deviceId"] | "", sizeof(deviceId) - 1);
    if (obj.containsKey("deviceKey")) strncpy(deviceKey, obj["deviceKey"] | "", sizeof(deviceKey) - 1);
    return true;
}

// =============================================================================
// ScaleSettings
// =============================================================================

void ScaleSettings::toJson(JsonObject& obj) const {
    obj["enabled"] = enabled;
    obj["pairedAddress"] = pairedAddress;
    obj["pairedName"] = pairedName;
    obj["scaleType"] = scaleType;
}

bool ScaleSettings::fromJson(const JsonObject& obj) {
    if (obj.containsKey("enabled")) enabled = obj["enabled"];
    if (obj.containsKey("pairedAddress")) strncpy(pairedAddress, obj["pairedAddress"] | "", sizeof(pairedAddress) - 1);
    if (obj.containsKey("pairedName")) strncpy(pairedName, obj["pairedName"] | "", sizeof(pairedName) - 1);
    if (obj.containsKey("scaleType")) scaleType = obj["scaleType"];
    return true;
}

// =============================================================================
// DisplaySettings
// =============================================================================

void DisplaySettings::toJson(JsonObject& obj) const {
    obj["brightness"] = brightness;
    obj["screenTimeout"] = screenTimeout;
    obj["showShotTimer"] = showShotTimer;
    obj["showWeight"] = showWeight;
    obj["showPressure"] = showPressure;
}

bool DisplaySettings::fromJson(const JsonObject& obj) {
    if (obj.containsKey("brightness")) brightness = obj["brightness"];
    if (obj.containsKey("screenTimeout")) screenTimeout = obj["screenTimeout"];
    if (obj.containsKey("showShotTimer")) showShotTimer = obj["showShotTimer"];
    if (obj.containsKey("showWeight")) showWeight = obj["showWeight"];
    if (obj.containsKey("showPressure")) showPressure = obj["showPressure"];
    return true;
}

// =============================================================================
// Settings (combined)
// =============================================================================

void Settings::toJson(JsonDocument& doc) const {
    JsonObject tempObj = doc.createNestedObject("temperature");
    temperature.toJson(tempObj);
    
    JsonObject brewObj = doc.createNestedObject("brew");
    brew.toJson(brewObj);
    
    JsonObject powerObj = doc.createNestedObject("power");
    power.toJson(powerObj);
    
    JsonObject networkObj = doc.createNestedObject("network");
    network.toJson(networkObj);
    
    JsonObject mqttObj = doc.createNestedObject("mqtt");
    mqtt.toJson(mqttObj);
    
    JsonObject cloudObj = doc.createNestedObject("cloud");
    cloud.toJson(cloudObj);
    
    JsonObject scaleObj = doc.createNestedObject("scale");
    scale.toJson(scaleObj);
    
    JsonObject displayObj = doc.createNestedObject("display");
    display.toJson(displayObj);
}

bool Settings::fromJson(const JsonDocument& doc) {
    if (doc.containsKey("temperature")) temperature.fromJson(doc["temperature"]);
    if (doc.containsKey("brew")) brew.fromJson(doc["brew"]);
    if (doc.containsKey("power")) power.fromJson(doc["power"]);
    if (doc.containsKey("network")) network.fromJson(doc["network"]);
    if (doc.containsKey("mqtt")) mqtt.fromJson(doc["mqtt"]);
    if (doc.containsKey("cloud")) cloud.fromJson(doc["cloud"]);
    if (doc.containsKey("scale")) scale.fromJson(doc["scale"]);
    if (doc.containsKey("display")) display.fromJson(doc["display"]);
    return true;
}

// =============================================================================
// Statistics
// =============================================================================

void Statistics::toJson(JsonObject& obj) const {
    // Lifetime
    obj["totalShots"] = totalShots;
    obj["totalSteamCycles"] = totalSteamCycles;
    obj["totalKwh"] = totalKwh;
    obj["totalOnTimeMinutes"] = totalOnTimeMinutes;
    
    // Daily
    obj["shotsToday"] = shotsToday;
    obj["kwhToday"] = kwhToday;
    obj["onTimeToday"] = onTimeToday;
    
    // Maintenance
    obj["shotsSinceDescale"] = shotsSinceDescale;
    obj["shotsSinceGroupClean"] = shotsSinceGroupClean;
    obj["shotsSinceBackflush"] = shotsSinceBackflush;
    obj["lastDescaleTimestamp"] = lastDescaleTimestamp;
    obj["lastGroupCleanTimestamp"] = lastGroupCleanTimestamp;
    obj["lastBackflushTimestamp"] = lastBackflushTimestamp;
    
    // Session
    obj["sessionStartTimestamp"] = sessionStartTimestamp;
    obj["sessionShots"] = sessionShots;
}

bool Statistics::fromJson(const JsonObject& obj) {
    if (obj.containsKey("totalShots")) totalShots = obj["totalShots"];
    if (obj.containsKey("totalSteamCycles")) totalSteamCycles = obj["totalSteamCycles"];
    if (obj.containsKey("totalKwh")) totalKwh = obj["totalKwh"];
    if (obj.containsKey("totalOnTimeMinutes")) totalOnTimeMinutes = obj["totalOnTimeMinutes"];
    if (obj.containsKey("shotsSinceDescale")) shotsSinceDescale = obj["shotsSinceDescale"];
    if (obj.containsKey("shotsSinceGroupClean")) shotsSinceGroupClean = obj["shotsSinceGroupClean"];
    if (obj.containsKey("shotsSinceBackflush")) shotsSinceBackflush = obj["shotsSinceBackflush"];
    if (obj.containsKey("lastDescaleTimestamp")) lastDescaleTimestamp = obj["lastDescaleTimestamp"];
    if (obj.containsKey("lastGroupCleanTimestamp")) lastGroupCleanTimestamp = obj["lastGroupCleanTimestamp"];
    if (obj.containsKey("lastBackflushTimestamp")) lastBackflushTimestamp = obj["lastBackflushTimestamp"];
    return true;
}

void Statistics::resetDaily() {
    shotsToday = 0;
    kwhToday = 0;
    onTimeToday = 0;
}

void Statistics::recordMaintenance(const char* type) {
    uint32_t now = time(nullptr);
    if (strcmp(type, "descale") == 0) {
        shotsSinceDescale = 0;
        lastDescaleTimestamp = now;
    } else if (strcmp(type, "groupclean") == 0) {
        shotsSinceGroupClean = 0;
        lastGroupCleanTimestamp = now;
    } else if (strcmp(type, "backflush") == 0) {
        shotsSinceBackflush = 0;
        lastBackflushTimestamp = now;
    }
}

// =============================================================================
// ShotRecord
// =============================================================================

void ShotRecord::toJson(JsonObject& obj) const {
    obj["timestamp"] = timestamp;
    obj["doseWeight"] = doseWeight;
    obj["yieldWeight"] = yieldWeight;
    obj["durationMs"] = durationMs;
    obj["preinfusionMs"] = preinfusionMs;
    obj["avgFlowRate"] = avgFlowRate;
    obj["peakPressure"] = peakPressure;
    obj["avgTemperature"] = avgTemperature;
    obj["rating"] = rating;
    obj["ratio"] = ratio();
}

bool ShotRecord::fromJson(const JsonObject& obj) {
    if (obj.containsKey("timestamp")) timestamp = obj["timestamp"];
    if (obj.containsKey("doseWeight")) doseWeight = obj["doseWeight"];
    if (obj.containsKey("yieldWeight")) yieldWeight = obj["yieldWeight"];
    if (obj.containsKey("durationMs")) durationMs = obj["durationMs"];
    if (obj.containsKey("preinfusionMs")) preinfusionMs = obj["preinfusionMs"];
    if (obj.containsKey("avgFlowRate")) avgFlowRate = obj["avgFlowRate"];
    if (obj.containsKey("peakPressure")) peakPressure = obj["peakPressure"];
    if (obj.containsKey("avgTemperature")) avgTemperature = obj["avgTemperature"];
    if (obj.containsKey("rating")) rating = obj["rating"];
    return true;
}

// =============================================================================
// ShotHistory
// =============================================================================

void ShotHistory::addShot(const ShotRecord& shot) {
    shots[head] = shot;
    head = (head + 1) % MAX_SHOT_HISTORY;
    if (count < MAX_SHOT_HISTORY) count++;
}

const ShotRecord* ShotHistory::getShot(uint8_t index) const {
    if (index >= count) return nullptr;
    // Most recent is at (head - 1), going backwards
    int actualIndex = (head - 1 - index + MAX_SHOT_HISTORY) % MAX_SHOT_HISTORY;
    return &shots[actualIndex];
}

void ShotHistory::toJson(JsonArray& arr) const {
    for (uint8_t i = 0; i < count; i++) {
        const ShotRecord* shot = getShot(i);
        if (shot) {
            JsonObject obj = arr.createNestedObject();
            shot->toJson(obj);
        }
    }
}

bool ShotHistory::fromJson(const JsonArray& arr) {
    clear();
    for (JsonObject obj : arr) {
        ShotRecord shot;
        shot.fromJson(obj);
        addShot(shot);
    }
    return true;
}

void ShotHistory::clear() {
    head = 0;
    count = 0;
}

// =============================================================================
// RuntimeState
// =============================================================================

void RuntimeState::toJson(JsonObject& obj) const {
    obj["state"] = machineStateToString(state);
    obj["mode"] = machineModeToString(mode);
    obj["brewTemp"] = brewTemp;
    obj["steamTemp"] = steamTemp;
    obj["brewHeating"] = brewHeating;
    obj["steamHeating"] = steamHeating;
    obj["pressure"] = pressure;
    obj["flowRate"] = flowRate;
    obj["powerWatts"] = powerWatts;
    obj["voltage"] = voltage;
    obj["waterLevel"] = waterLevel;
    obj["dripTrayFull"] = dripTrayFull;
    obj["scaleConnected"] = scaleConnected;
    obj["scaleWeight"] = scaleWeight;
    obj["scaleFlowRate"] = scaleFlowRate;
    obj["scaleStable"] = scaleStable;
    obj["shotActive"] = shotActive;
    obj["shotStartTime"] = shotStartTime;
    obj["shotWeight"] = shotWeight;
    obj["wifiConnected"] = wifiConnected;
    obj["mqttConnected"] = mqttConnected;
    obj["cloudConnected"] = cloudConnected;
    obj["picoConnected"] = picoConnected;
    obj["uptime"] = uptime;
}

// =============================================================================
// Enum Helpers
// =============================================================================

const char* machineStateToString(MachineState state) {
    switch (state) {
        case MachineState::INIT: return "init";
        case MachineState::IDLE: return "idle";
        case MachineState::HEATING: return "heating";
        case MachineState::READY: return "ready";
        case MachineState::BREWING: return "brewing";
        case MachineState::STEAMING: return "steaming";
        case MachineState::COOLDOWN: return "cooldown";
        case MachineState::ECO: return "eco";
        case MachineState::FAULT: return "fault";
        default: return "unknown";
    }
}

const char* machineModeToString(MachineMode mode) {
    switch (mode) {
        case MachineMode::STANDBY: return "standby";
        case MachineMode::ON: return "on";
        case MachineMode::ECO: return "eco";
        default: return "unknown";
    }
}

MachineState stringToMachineState(const char* str) {
    if (strcmp(str, "init") == 0) return MachineState::INIT;
    if (strcmp(str, "idle") == 0) return MachineState::IDLE;
    if (strcmp(str, "heating") == 0) return MachineState::HEATING;
    if (strcmp(str, "ready") == 0) return MachineState::READY;
    if (strcmp(str, "brewing") == 0) return MachineState::BREWING;
    if (strcmp(str, "steaming") == 0) return MachineState::STEAMING;
    if (strcmp(str, "cooldown") == 0) return MachineState::COOLDOWN;
    if (strcmp(str, "eco") == 0) return MachineState::ECO;
    if (strcmp(str, "fault") == 0) return MachineState::FAULT;
    return MachineState::INIT;
}

MachineMode stringToMachineMode(const char* str) {
    if (strcmp(str, "standby") == 0) return MachineMode::STANDBY;
    if (strcmp(str, "on") == 0) return MachineMode::ON;
    if (strcmp(str, "eco") == 0) return MachineMode::ECO;
    return MachineMode::STANDBY;
}

} // namespace BrewOS

