# BrewOS Cloud Service

The BrewOS cloud service is a WebSocket relay that enables remote access to your espresso machine from anywhere in the world.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLOUD SERVICE                                   │
│              (WebSocket Relay + SQLite + Google Auth)                   │
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
│                    │  SQLite   │  (device ownership, profiles)          │
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

- **SQLite Database** - Embedded, file-based, no external DB needed
- **Google OAuth** - Direct Google Sign-In, no extra services needed
- **QR Code Pairing** - Scan to link devices to your account
- **Pure WebSocket** - No MQTT dependency, deploy anywhere
- **Low Latency** - Direct message relay between clients and devices

## Project Structure

```
src/cloud/
├── src/
│   ├── server.ts          # Express + WebSocket server
│   ├── device-relay.ts    # ESP32 device connection handler
│   ├── client-proxy.ts    # Client app connection handler
│   ├── lib/
│   │   └── database.ts    # SQLite database (sql.js)
│   ├── middleware/
│   │   └── auth.ts        # Google ID token verification
│   ├── routes/
│   │   └── devices.ts     # Device management API
│   ├── services/
│   │   └── device.ts      # Device CRUD operations
│   └── types/
│       └── sql.js.d.ts    # TypeScript types
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud Console account (for OAuth)

### Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select existing

2. **Configure OAuth Consent Screen**
   - Go to APIs & Services → OAuth consent screen
   - Choose "External" user type
   - Fill in app name, support email
   - Add scopes: email, profile, openid

3. **Create OAuth 2.0 Client ID**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   - Add authorized JavaScript origins:
     - `https://cloud.brewos.io`
     - `http://localhost:5173` (for development)
   - Copy the **Client ID** (you'll need this for both frontend and backend)

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

# Data directory for SQLite database
DATA_DIR=./data

# Google OAuth Client ID
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# CORS
CORS_ORIGIN=http://localhost:5173

# Web UI path
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

## Database

The service uses **SQLite** (via sql.js) for data storage:

```sql
-- Device ownership
devices (id, owner_id, name, machine_brand, machine_model, is_online, ...)

-- QR code pairing tokens
device_claim_tokens (device_id, token_hash, expires_at)

-- User profiles (synced from Google Auth)
profiles (id, email, display_name, avatar_url)
```

**Data is stored in a single file:** `brewos.db`

For persistence on cloud platforms, mount a volume to `DATA_DIR`.

## API Endpoints

### HTTP

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | No | Health check with connection stats |
| `/api/devices` | GET | Yes | List user's devices |
| `/api/devices/claim` | POST | Yes | Claim a device with QR token |
| `/api/devices/register-claim` | POST | No | ESP32 registers claim token |
| `/api/devices/:id` | GET | Yes | Get device details |
| `/api/devices/:id` | PATCH | Yes | Update device (name, brand, model) |
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
   - Displays QR code with URL: `https://cloud.brewos.io/pair?id=BRW-XXXXX&token=TOKEN`

2. **User scans QR code**
   - Opens pairing URL in browser
   - Redirects to login (Google) if not authenticated
   - Shows device confirmation screen

3. **User claims device**
   - App calls `/api/devices/claim` with device ID and token
   - Server verifies token hash matches
   - Device is added to user's account

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Create data directory
RUN mkdir -p /data

COPY package*.json ./
RUN npm ci --production

COPY dist ./dist

ENV DATA_DIR=/data
ENV PORT=3001

EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Platform Guides

**Railway:**
```bash
railway init
railway add
# Add volume for SQLite: /data
railway up
```

**Fly.io:**
```bash
fly launch
fly volumes create brewos_data --size 1
# Update fly.toml to mount volume
fly deploy
```

**Render:**
- Connect GitHub repo
- Add persistent disk mounted at `/data`
- Set `DATA_DIR=/data`

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | HTTP/WS port |
| `DATA_DIR` | No | `.` | Directory for SQLite database |
| `GOOGLE_CLIENT_ID` | Yes | - | Google OAuth Client ID |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |
| `WEB_DIST_PATH` | No | `../web/dist` | Path to web UI build |

## Security Considerations

1. **Use HTTPS/WSS in production** - Terminate TLS at load balancer
2. **Keep Client ID secret** - Don't expose in public repos with sensitive data
3. **Validate device ownership** - Check user has access to device
4. **Rate limiting** - Add rate limiting for API endpoints
5. **Backup SQLite** - Regular backups of `brewos.db` file
