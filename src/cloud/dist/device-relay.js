import { WebSocket } from 'ws';
/**
 * Device Relay
 *
 * Handles WebSocket connections from ESP32 devices.
 * Each device maintains a persistent connection to the cloud.
 */
export class DeviceRelay {
    devices = new Map();
    messageHandlers = new Set();
    constructor(wss) {
        wss.on('connection', (ws, req) => this.handleConnection(ws, req));
    }
    handleConnection(ws, req) {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const deviceId = url.searchParams.get('id');
        const deviceKey = url.searchParams.get('key');
        if (!deviceId || !deviceKey) {
            ws.close(4001, 'Missing device ID or key');
            return;
        }
        // TODO: Validate device key against database
        // For now, accept any device with a key
        // Close existing connection for this device (if any)
        const existing = this.devices.get(deviceId);
        if (existing) {
            console.log(`[Device] Replacing connection for ${deviceId}`);
            existing.ws.close(4002, 'Replaced by new connection');
        }
        const connection = {
            ws,
            deviceId,
            deviceKey,
            connectedAt: new Date(),
            lastSeen: new Date(),
        };
        this.devices.set(deviceId, connection);
        console.log(`[Device] Connected: ${deviceId}`);
        // Handle messages from device
        ws.on('message', (data) => {
            connection.lastSeen = new Date();
            try {
                const message = JSON.parse(data.toString());
                this.handleDeviceMessage(deviceId, message);
            }
            catch (err) {
                console.error(`[Device] Invalid message from ${deviceId}:`, err);
            }
        });
        // Handle disconnect
        ws.on('close', () => {
            this.devices.delete(deviceId);
            console.log(`[Device] Disconnected: ${deviceId}`);
            // Notify handlers of disconnect
            this.notifyHandlers(deviceId, { type: 'device_offline' });
        });
        ws.on('error', (err) => {
            console.error(`[Device] Error from ${deviceId}:`, err);
        });
        // Send welcome
        this.sendToDevice(deviceId, { type: 'connected', timestamp: Date.now() });
        // Notify handlers of connection
        this.notifyHandlers(deviceId, { type: 'device_online' });
    }
    handleDeviceMessage(deviceId, message) {
        // Add device ID to message
        message.deviceId = deviceId;
        message.timestamp = message.timestamp || Date.now();
        // Forward to all handlers (client proxy will receive these)
        this.notifyHandlers(deviceId, message);
    }
    notifyHandlers(deviceId, message) {
        this.messageHandlers.forEach(handler => handler(deviceId, message));
    }
    /**
     * Subscribe to messages from devices
     */
    onDeviceMessage(handler) {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }
    /**
     * Send message to a specific device
     */
    sendToDevice(deviceId, message) {
        const connection = this.devices.get(deviceId);
        if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
            return false;
        }
        connection.ws.send(JSON.stringify(message));
        return true;
    }
    /**
     * Check if device is connected
     */
    isDeviceConnected(deviceId) {
        const connection = this.devices.get(deviceId);
        return connection?.ws.readyState === WebSocket.OPEN;
    }
    /**
     * Get connected device count
     */
    getConnectedDeviceCount() {
        return this.devices.size;
    }
    /**
     * Get list of connected devices
     */
    getConnectedDevices() {
        return Array.from(this.devices.entries()).map(([id, conn]) => ({
            id,
            connectedAt: conn.connectedAt,
            lastSeen: conn.lastSeen,
        }));
    }
}
//# sourceMappingURL=device-relay.js.map