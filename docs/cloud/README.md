# BrewOS Cloud Service

The BrewOS cloud service is a stateless WebSocket relay that enables remote access to your espresso machine from anywhere in the world.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLOUD SERVICE                                   │
│                    (Stateless WebSocket Relay)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   /ws/device                              /ws/client                    │
│   (ESP32 connects here)                   (Apps connect here)           │
│         │                                        │                      │
│         ▼                                        ▼                      │
│   ┌─────────────┐                         ┌─────────────┐              │
│   │ DeviceRelay │ ◄────── messages ──────► │ ClientProxy │              │
│   └─────────────┘                         └─────────────┘              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
         ▲                                        ▲
         │ WebSocket                    WebSocket │
         │                                        │
┌────────┴────────┐                    ┌─────────┴─────────┐
│     ESP32       │                    │    Web/Mobile     │
│ (your machine)  │                    │   (your app)      │
└─────────────────┘                    └───────────────────┘
```

## Key Features

- **Stateless** - No database required, scales horizontally
- **Pure WebSocket** - No MQTT dependency, deploy anywhere
- **Low Latency** - Direct message relay between clients and devices
- **Multi-Client** - Multiple apps can connect to the same device
- **JWT Authentication** - Secure token-based auth for clients

## Project Structure

```
src/cloud/
├── src/
│   ├── server.ts          # Express + WebSocket server
│   ├── device-relay.ts    # ESP32 device connection handler
│   ├── client-proxy.ts    # Client app connection handler
│   ├── auth.ts            # JWT authentication
│   └── types.ts           # TypeScript interfaces
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd src/cloud
npm install
```

### Configuration

Create a `.env` file (see `.env.example`):

```env
PORT=3001
JWT_SECRET=your-super-secret-key
WEB_DIST_PATH=../web/dist
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### HTTP

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with connection stats |
| `/api/devices` | GET | List user's devices (requires auth) |
| `/*` | GET | Serve web UI (SPA) |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `/ws/device` | ESP32 device connections |
| `/ws/client` | Client app connections |

## Connection Protocol

### Device Connection (ESP32)

ESP32 devices connect to establish a persistent WebSocket:

```
ws://cloud.brewos.dev/ws/device?id=DEVICE_ID&key=DEVICE_KEY
```

Parameters:
- `id` - Unique device identifier
- `key` - Device authentication key

### Client Connection (Web/Mobile)

Client apps connect with JWT authentication:

```
wss://cloud.brewos.dev/ws/client?token=JWT_TOKEN&device=DEVICE_ID
```

Parameters:
- `token` - JWT authentication token
- `device` - Target device ID

## Message Flow

1. **ESP32 → Cloud → Client**
   - Device sends status updates
   - Cloud broadcasts to all connected clients for that device

2. **Client → Cloud → ESP32**
   - Client sends commands
   - Cloud forwards to the target device
   - If device offline, client receives error

## Authentication

### JWT Tokens

Generate tokens for clients:

```typescript
import { generateToken } from './auth.js';

const token = generateToken(userId, email);
// Returns: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token payload:
```json
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "iat": 1699876543,
  "exp": 1700481343
}
```

### Device Keys

Devices authenticate with a pre-shared key. In production, validate against a database.

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Platform Guides

**Fly.io:**
```bash
fly launch
fly secrets set JWT_SECRET=your-secret
fly deploy
```

**Railway:**
```bash
railway init
railway add
railway up
```

**Render:**
- Connect GitHub repo
- Set build command: `npm run build`
- Set start command: `npm start`

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | HTTP/WS port |
| `JWT_SECRET` | Yes | - | Secret for JWT signing |
| `WEB_DIST_PATH` | No | `../web/dist` | Path to web UI build |

## Scaling

The service is stateless by design:

- **Horizontal Scaling** - Run multiple instances behind a load balancer
- **Sticky Sessions** - Not required, but improves efficiency
- **State** - All state is in-memory (active connections)

For high availability, consider:
- Redis for session/device state sharing
- Database for device/user management

## Monitoring

### Health Check

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "devices": 5,
  "clients": 12
}
```

### Logging

The service logs to stdout:
- Device connections/disconnections
- Client connections/disconnections
- Message routing (debug level)
- Errors

## Security Considerations

1. **Use HTTPS/WSS in production** - Terminate TLS at load balancer
2. **Rotate JWT secrets** - Use short-lived tokens
3. **Validate device ownership** - Check user has access to device
4. **Rate limiting** - Add rate limiting for API endpoints
5. **Input validation** - Sanitize all incoming messages

