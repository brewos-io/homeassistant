import { WebSocketServer } from 'ws';
import type { DeviceMessage } from './types.js';
/**
 * Device Relay
 *
 * Handles WebSocket connections from ESP32 devices.
 * Each device maintains a persistent connection to the cloud.
 */
export declare class DeviceRelay {
    private devices;
    private messageHandlers;
    constructor(wss: WebSocketServer);
    private handleConnection;
    private handleDeviceMessage;
    private notifyHandlers;
    /**
     * Subscribe to messages from devices
     */
    onDeviceMessage(handler: (deviceId: string, message: DeviceMessage) => void): () => void;
    /**
     * Send message to a specific device
     */
    sendToDevice(deviceId: string, message: DeviceMessage): boolean;
    /**
     * Check if device is connected
     */
    isDeviceConnected(deviceId: string): boolean;
    /**
     * Get connected device count
     */
    getConnectedDeviceCount(): number;
    /**
     * Get list of connected devices
     */
    getConnectedDevices(): Array<{
        id: string;
        connectedAt: Date;
        lastSeen: Date;
    }>;
}
//# sourceMappingURL=device-relay.d.ts.map