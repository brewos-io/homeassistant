import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { DeviceRelay } from './device-relay.js';
import { ClientProxy } from './client-proxy.js';
import { authMiddleware } from './auth.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (the shared web UI)
const webDistPath = process.env.WEB_DIST_PATH || path.join(process.cwd(), '../web/dist');
app.use(express.static(webDistPath));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    devices: deviceRelay.getConnectedDeviceCount(),
    clients: clientProxy.getConnectedClientCount(),
  });
});

// API routes
app.get('/api/devices', authMiddleware, (req, res) => {
  // TODO: Return user's devices from database
  // For now, return connected devices
  const devices = deviceRelay.getConnectedDevices();
  res.json({ devices });
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(webDistPath, 'index.html'));
});

// Create HTTP server
const server = createServer(app);

// WebSocket server for ESP32 devices
const deviceWss = new WebSocketServer({ noServer: true });
const deviceRelay = new DeviceRelay(deviceWss);

// WebSocket server for client apps (web, mobile)
const clientWss = new WebSocketServer({ noServer: true });
const clientProxy = new ClientProxy(clientWss, deviceRelay);

// Route WebSocket upgrades based on path
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  
  if (url.pathname === '/ws/device') {
    // ESP32 device connection
    deviceWss.handleUpgrade(request, socket, head, (ws) => {
      deviceWss.emit('connection', ws, request);
    });
  } else if (url.pathname === '/ws/client' || url.pathname === '/ws') {
    // Client app connection
    clientWss.handleUpgrade(request, socket, head, (ws) => {
      clientWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start server
server.listen(port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  BrewOS Cloud Service                     ║
╠═══════════════════════════════════════════════════════════╣
║  HTTP:    http://localhost:${port}                           ║
║  Device:  ws://localhost:${port}/ws/device                   ║
║  Client:  ws://localhost:${port}/ws/client                   ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Cloud] Shutting down...');
  deviceWss.close();
  clientWss.close();
  server.close();
  process.exit(0);
});
