# BrewOS Cloud Service

The BrewOS cloud service is a WebSocket relay that enables remote access to your espresso machine from anywhere in the world, with Supabase for authentication and device management.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLOUD SERVICE                                   │
│              (WebSocket Relay + Supabase Auth/Database)                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   /ws/device                              /ws/client                    │
│   (ESP32 connects here)                   (Apps connect here)           │
│         │                                        │                      │
│         ▼                                        ▼                      │
│   ┌─────────────┐                         ┌─────────────┐              │
│   │ DeviceRelay │ ◄────── messages ──────► │ ClientProxy │              │
│   └─────────────┘                         └─────────────┘              │
│         │                                        │                      │
│         └────────────────┬───────────────────────┘                      │
│                          ▼                                              │
│                    ┌───────────┐                                        │
│                    │  Supabase │                                        │
│                    │ (Auth+DB) │                                        │
│                    └───────────┘                                        │
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

- **Supabase Auth** - Google, Apple, email sign-in via Supabase
- **PostgreSQL** - Device and user management with RLS
- **QR Code Pairing** - Scan to link devices to your account
- **Pure WebSocket** - No MQTT dependency, deploy anywhere
- **Low Latency** - Direct message relay between clients and devices
- **Multi-Client** - Multiple apps can connect to the same device

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
- Supabase account (free tier works)

### Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your Project URL and API keys

2. **Run Database Migration**
   - Go to SQL Editor in Supabase Dashboard
   - Copy contents of `src/cloud/supabase/migrations/001_initial_schema.sql`
   - Run the SQL

3. **Enable Google Auth**
   - Go to Authentication → Providers → Google
   - Enable Google provider
   - Add your Google OAuth credentials
   - Set redirect URL to your app's callback URL

### Installation

```bash
cd src/cloud
npm install
```

### Configuration

Create a `.env` file (see `env.example`):

```env
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Web UI path
WEB_DIST_PATH=../web/dist
```

For the web app, create `src/web/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
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

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | No | Health check with connection stats |
| `/api/devices` | GET | Yes | List user's devices |
| `/api/devices/claim` | POST | Yes | Claim a device with QR token |
| `/api/devices/register-claim` | POST | No | ESP32 registers claim token |
| `/api/devices/:id` | GET | Yes | Get device details |
| `/api/devices/:id` | PATCH | Yes | Rename device |
| `/api/devices/:id` | DELETE | Yes | Remove device from account |
| `/*` | GET | No | Serve web UI (SPA) |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `/ws/device` | ESP32 device connections |
| `/ws/client` | Client app connections |

## Device Pairing Flow

1. **ESP32 generates QR code**
   - Generates random claim token
   - Calls `/api/devices/register-claim` to store token hash
   - Displays QR code with URL: `https://app.brewos.dev/pair?id=BRW-XXXXX&token=TOKEN`

2. **User scans QR code**
   - Opens pairing URL in browser
   - Redirects to login (Google/Apple) if not authenticated
   - Shows device confirmation screen

3. **User claims device**
   - App calls `/api/devices/claim` with device ID and token
   - Server verifies token hash matches
   - Device is added to user's account
   - ESP32 receives confirmation via WebSocket

```
┌──────────┐      ┌───────────┐      ┌────────────┐
│  ESP32   │      │   Cloud   │      │  Web App   │
└────┬─────┘      └─────┬─────┘      └──────┬─────┘
     │                  │                   │
     │ Generate token   │                   │
     │─────────────────>│                   │
     │                  │ Store hash        │
     │                  │                   │
     │ Display QR       │                   │
     │                  │                   │
     │                  │    Scan QR code   │
     │                  │<──────────────────│
     │                  │                   │
     │                  │    Sign in        │
     │                  │<──────────────────│
     │                  │                   │
     │                  │    Claim device   │
     │                  │<──────────────────│
     │                  │                   │
     │ Device claimed!  │    Success!       │
     │<─────────────────│──────────────────>│
     │                  │                   │
```

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
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | - | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Yes | - | Supabase service key (server-side) |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |
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

