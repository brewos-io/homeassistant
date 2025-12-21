#include "cloud_connection.h"
#include <WiFi.h>

// Logging macros (match project convention)
#define LOG_I(fmt, ...) Serial.printf("[Cloud] " fmt "\n", ##__VA_ARGS__)
#define LOG_W(fmt, ...) Serial.printf("[Cloud] WARN: " fmt "\n", ##__VA_ARGS__)
#define LOG_E(fmt, ...) Serial.printf("[Cloud] ERROR: " fmt "\n", ##__VA_ARGS__)
#define LOG_D(fmt, ...) Serial.printf("[Cloud] DEBUG: " fmt "\n", ##__VA_ARGS__)

// Simple, robust reconnection settings
#define RECONNECT_DELAY_MS 30000  // Wait 30 seconds between connection attempts (prevents UI freeze loop)

CloudConnection::CloudConnection() {
}

void CloudConnection::begin(const String& serverUrl, const String& deviceId, const String& deviceKey) {
    _serverUrl = serverUrl;
    _deviceId = deviceId;
    _deviceKey = deviceKey;
    _enabled = true;
    _reconnectDelay = RECONNECT_DELAY_MS;
    
    // Set up event handler ONCE here
    _ws.onEvent([this](WStype_t type, uint8_t* payload, size_t length) {
        handleEvent(type, payload, length);
    });
    
    // Disable automatic reconnection - we handle it ourselves
    _ws.setReconnectInterval(0);
    
    LOG_I("Initialized: server=%s, device=%s", serverUrl.c_str(), deviceId.c_str());
}

void CloudConnection::end() {
    // Step 1: Disable immediately to prevent loop() from interfering
    _enabled = false;
    
    // Step 2: Mark as not connected/connecting to prevent send() calls
    bool wasConnected = _connected;
    bool wasConnecting = _connecting;
    _connected = false;
    _connecting = false;
    
    if (wasConnected || wasConnecting) {
        // Step 3: Give any in-flight SSL operations time to complete
        // This prevents the "CIPHER - Bad input parameters" error
        yield();
        delay(100);
        yield();
        
        // Step 4: Process pending WebSocket events before disconnect
        // This allows clean shutdown of the SSL layer
        for (int i = 0; i < 5; i++) {
            _ws.loop();
            yield();
            delay(20);
        }
        
        // Step 5: Now safely disconnect
        _ws.disconnect();
        
        // Step 6: Allow disconnect to fully complete
        yield();
        delay(100);
        yield();
    }
    
    LOG_I("Disabled");
}

void CloudConnection::loop() {
    if (!_enabled) {
        return;
    }
    
    // Check WiFi
    if (WiFi.status() != WL_CONNECTED || WiFi.localIP() == IPAddress(0, 0, 0, 0)) {
        if (_connected) {
            _connected = false;
            _connecting = false;
            LOG_W("WiFi disconnected");
        }
        return;
    }
    
    // If not connected, try to connect after delay
    if (!_connected && !_connecting) {
        unsigned long now = millis();
        if (now - _lastConnectAttempt >= _reconnectDelay) {
            connect();
        }
        return;
    }
    
    // Process WebSocket events
    _ws.loop();
}

void CloudConnection::connect() {
    if (_serverUrl.isEmpty() || _deviceId.isEmpty()) {
        LOG_W("Cannot connect: missing server URL or device ID");
        return;
    }
    
    // Register device with cloud on first connection
    if (!_registered && _onRegister) {
        LOG_I("Registering device with cloud...");
        _registered = _onRegister();
    }
    
    _lastConnectAttempt = millis();
    _connecting = true;
    
    // Parse URL
    String host;
    uint16_t port;
    String path;
    bool useSSL;
    
    if (!parseUrl(_serverUrl, host, port, path, useSSL)) {
        LOG_E("Invalid server URL: %s", _serverUrl.c_str());
        _connecting = false;
        return;
    }
    
    // Build WebSocket path with auth params
    String wsPath = "/ws/device?id=" + _deviceId;
    if (!_deviceKey.isEmpty()) {
        wsPath += "&key=" + _deviceKey;
    }
    
    LOG_I("Connecting to %s:%d (SSL=%d)", host.c_str(), port, useSSL);
    
    // Enable heartbeat (ping every 30s, timeout 15s, 2 failures to disconnect)
    _ws.enableHeartbeat(30000, 15000, 2);
    
    // Connect
    if (useSSL) {
        _ws.beginSSL(host.c_str(), port, wsPath.c_str());
    } else {
        _ws.begin(host.c_str(), port, wsPath.c_str());
    }
}

void CloudConnection::pause() {
    if (_connected || _connecting) {
        LOG_I("Pausing cloud connection to free resources");
        _ws.disconnect();
        _connected = false;
        _connecting = false;
        
        // Wait 30 seconds before reconnecting
        _reconnectDelay = 30000;
        _lastConnectAttempt = millis();
    }
}

bool CloudConnection::parseUrl(const String& url, String& host, uint16_t& port, String& path, bool& useSSL) {
    // Determine protocol (case-insensitive, only check first 8 chars)
    String proto = url.substring(0, 8);
    proto.toLowerCase();
    int protoEnd;
    if (proto.startsWith("https://") || proto.startsWith("wss://")) {
        useSSL = true;
        protoEnd = proto.startsWith("https://") ? 8 : 6;
        port = 443;
    } else if (proto.startsWith("http://") || proto.startsWith("ws://")) {
        useSSL = false;
        protoEnd = proto.startsWith("http://") ? 7 : 5;
        port = 80;
    } else {
        // Assume https if no protocol
        useSSL = true;
        protoEnd = 0;
        port = 443;
    }
    
    // Extract host and optional port
    String remainder = url.substring(protoEnd);
    int pathStart = remainder.indexOf('/');
    String hostPort;
    
    if (pathStart >= 0) {
        hostPort = remainder.substring(0, pathStart);
        path = remainder.substring(pathStart);
    } else {
        hostPort = remainder;
        path = "/";
    }
    
    // Check for port in host
    int colonPos = hostPort.indexOf(':');
    if (colonPos >= 0) {
        host = hostPort.substring(0, colonPos);
        port = hostPort.substring(colonPos + 1).toInt();
    } else {
        host = hostPort;
    }
    
    return !host.isEmpty();
}

void CloudConnection::handleEvent(WStype_t type, uint8_t* payload, size_t length) {
    if (!_enabled && type != WStype_DISCONNECTED) {
        return;
    }
    
    switch (type) {
        case WStype_DISCONNECTED:
            if (_connected) {
                LOG_W("Disconnected from cloud");
            }
            _connected = false;
            _connecting = false;
            _lastConnectAttempt = millis();  // Will reconnect after RECONNECT_DELAY_MS
            break;
            
        case WStype_CONNECTED:
            LOG_I("Connected to cloud!");
            _connected = true;
            _connecting = false;
            break;
            
        case WStype_TEXT:
            handleMessage(payload, length);
            break;
            
        case WStype_BIN:
            break;
            
        case WStype_ERROR:
            {
                String errorMsg = (length > 0 && payload) ? String((char*)payload, length) : "unknown";
                LOG_E("WebSocket error: %s", errorMsg.c_str());
                _connecting = false;
            }
            break;
            
        case WStype_PING:
        case WStype_PONG:
            // Heartbeat handled by library
            break;
            
        default:
            break;
    }
}

void CloudConnection::handleMessage(uint8_t* payload, size_t length) {
    // Parse JSON
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    
    if (error) {
        LOG_W("Invalid JSON message: %s", error.c_str());
        return;
    }
    
    String type = doc["type"] | "";
    
    // Handle cloud-specific messages
    if (type == "connected") {
        LOG_I("Cloud acknowledged connection");
        return;
    }
    
    if (type == "error") {
        String errorMsg = doc["error"] | "Unknown error";
        LOG_E("Cloud error: %s", errorMsg.c_str());
        return;
    }
    
    // Forward commands to callback
    if (_onCommand) {
        _onCommand(type, doc);
    } else {
        LOG_D("Received message type=%s (no handler)", type.c_str());
    }
}

void CloudConnection::send(const String& json) {
    if (!_connected) {
        return;
    }
    
    // Use const char* overload to avoid unnecessary string copy
    _ws.sendTXT(json.c_str(), json.length());
}

void CloudConnection::send(const char* json) {
    if (!_connected || !json) {
        return;
    }
    
    // Send directly without String allocation
    _ws.sendTXT(json, strlen(json));
}

void CloudConnection::send(const JsonDocument& doc) {
    if (!_connected) {
        return;
    }
    
    // Use PSRAM for serialization buffer to save Internal RAM
    size_t jsonSize = measureJson(doc) + 1;
    char* jsonBuffer = (char*)heap_caps_malloc(jsonSize, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
    
    if (!jsonBuffer) {
        // Fallback to internal RAM if PSRAM allocation fails
        jsonBuffer = (char*)malloc(jsonSize);
    }
    
    if (jsonBuffer) {
        serializeJson(doc, jsonBuffer, jsonSize);
        _ws.sendTXT(jsonBuffer); // library calculates strlen
        free(jsonBuffer);
    }
}

void CloudConnection::onCommand(CommandCallback callback) {
    _onCommand = callback;
}

void CloudConnection::onRegister(RegisterCallback callback) {
    _onRegister = callback;
}

bool CloudConnection::isConnected() const {
    return _connected;
}

String CloudConnection::getStatus() const {
    if (!_enabled) {
        return "disabled";
    }
    if (_connected) {
        return "connected";
    }
    if (_connecting) {
        return "connecting";
    }
    return "disconnected";
}

void CloudConnection::setEnabled(bool enabled) {
    if (enabled && !_enabled) {
        _enabled = true;
        _reconnectDelay = 1000;
        LOG_I("Enabled");
    } else if (!enabled && _enabled) {
        end();
    }
}

bool CloudConnection::isEnabled() const {
    return _enabled;
}

