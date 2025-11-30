# Cloud Service Deployment Guide

This guide covers deploying the BrewOS cloud service to various platforms.

## Prerequisites

1. Build the web UI:
   ```bash
   cd src/web
   npm install
   npm run build
   ```

2. Build the cloud service:
   ```bash
   cd src/cloud
   npm install
   npm run build
   ```

## Local Development

```bash
cd src/cloud
npm run dev
```

Access at `http://localhost:3001`

## Docker Deployment

### Dockerfile

Create `src/cloud/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production

# Copy web UI (pre-built)
COPY ../web/dist ./web

ENV NODE_ENV=production
ENV WEB_DIST_PATH=./web
EXPOSE 3001

CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  brewos-cloud:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
```

### Build and Run

```bash
docker build -t brewos-cloud .
docker run -p 3001:3001 -e JWT_SECRET=your-secret brewos-cloud
```

## Fly.io

### Setup

```bash
cd src/cloud
fly launch --no-deploy
```

### Configure

Edit `fly.toml`:

```toml
app = "brewos-cloud"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"
  WEB_DIST_PATH = "./web"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.http_checks]]
    path = "/api/health"
    interval = 10000
    timeout = 2000
```

### Deploy

```bash
fly secrets set JWT_SECRET=your-super-secret-key
fly deploy
```

## Railway

### Setup

1. Connect your GitHub repository
2. Select the `src/cloud` directory as root

### Configure

Add environment variables:
- `JWT_SECRET` - Your secret key
- `WEB_DIST_PATH` - `./web`

### Build Settings

- Build command: `npm run build`
- Start command: `npm start`

## Render

### Web Service

1. New → Web Service
2. Connect repository
3. Configure:
   - **Root Directory**: `src/cloud`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`

### Environment Variables

Add in dashboard:
- `JWT_SECRET`
- `WEB_DIST_PATH=./web`

## AWS (Elastic Beanstalk)

### Setup

```bash
cd src/cloud
eb init brewos-cloud --platform node.js
eb create production
```

### Configure

`.ebextensions/env.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    JWT_SECRET: your-secret
    WEB_DIST_PATH: ./web
```

## Google Cloud Run

### Build Container

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/brewos-cloud
```

### Deploy

```bash
gcloud run deploy brewos-cloud \
  --image gcr.io/PROJECT_ID/brewos-cloud \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars JWT_SECRET=your-secret
```

## Kubernetes

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brewos-cloud
spec:
  replicas: 2
  selector:
    matchLabels:
      app: brewos-cloud
  template:
    metadata:
      labels:
        app: brewos-cloud
    spec:
      containers:
      - name: brewos-cloud
        image: brewos-cloud:latest
        ports:
        - containerPort: 3001
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: brewos-secrets
              key: jwt-secret
        - name: WEB_DIST_PATH
          value: "./web"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: brewos-cloud
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3001
  selector:
    app: brewos-cloud
```

## SSL/TLS Configuration

### Using Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name cloud.brewos.dev;

    ssl_certificate /etc/letsencrypt/live/cloud.brewos.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cloud.brewos.dev/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Cloudflare Tunnel

```bash
cloudflared tunnel create brewos
cloudflared tunnel route dns brewos cloud.brewos.dev
cloudflared tunnel run --url http://localhost:3001 brewos
```

## Monitoring & Logging

### Health Checks

All platforms should use `/api/health` for health checks.

### Structured Logging

For production, consider adding structured logging:

```typescript
import pino from 'pino';
const logger = pino({ level: 'info' });

logger.info({ event: 'device_connected', deviceId });
```

### Metrics

Consider adding Prometheus metrics:
- `brewos_devices_connected` - Gauge of connected devices
- `brewos_clients_connected` - Gauge of connected clients
- `brewos_messages_relayed` - Counter of relayed messages

