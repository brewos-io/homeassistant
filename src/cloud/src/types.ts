export interface DeviceMessage {
  type: string;
  deviceId?: string;
  timestamp?: number;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export interface Device {
  id: string;
  name: string;
  ownerId: string;
  lastSeen?: Date;
  online: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

