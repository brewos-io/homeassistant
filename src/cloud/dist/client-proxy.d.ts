import { WebSocketServer } from 'ws';
import type { DeviceRelay } from './device-relay.js';
/**
 * Client Proxy
 *
 * Handles WebSocket connections from client apps (web, mobile).
 * Routes messages between clients and their associated devices.
 */
export declare class ClientProxy {
    private clients;
    private deviceClients;
    private deviceRelay;
    constructor(wss: WebSocketServer, deviceRelay: DeviceRelay);
    private handleConnection;
    private registerClient;
    private unregisterClient;
    private handleClientMessage;
    private sendToClient;
    private broadcastToDeviceClients;
    /**
     * Get connected client count
     */
    getConnectedClientCount(): number;
}
//# sourceMappingURL=client-proxy.d.ts.map