import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { JWTPayload } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Attach user to request
  (req as Request & { user: JWTPayload }).user = payload;
  next();
}

export function extractTokenFromUrl(url: string): string | null {
  const match = url.match(/[?&]token=([^&]+)/);
  return match ? match[1] : null;
}

export function extractDeviceFromUrl(url: string): string | null {
  const match = url.match(/[?&]device=([^&]+)/);
  return match ? match[1] : null;
}

