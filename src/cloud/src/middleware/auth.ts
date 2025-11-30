import { Request, Response, NextFunction } from 'express';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ensureProfile } from '../services/device.js';

// Google OAuth client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Verify Google ID token
 */
async function verifyGoogleToken(idToken: string): Promise<TokenPayload | null> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload() || null;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Middleware to verify Google ID token
 */
export function googleAuthMiddleware(
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

  if (!GOOGLE_CLIENT_ID) {
    console.error('[Auth] GOOGLE_CLIENT_ID not configured');
    res.status(500).json({ error: 'Auth not configured' });
    return;
  }

  verifyGoogleToken(token)
    .then(payload => {
      if (!payload || !payload.sub) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      req.user = {
        id: payload.sub,
        email: payload.email || '',
      };

      // Ensure user profile exists in database
      ensureProfile(
        payload.sub,
        payload.email,
        payload.name,
        payload.picture
      );

      next();
    })
    .catch(error => {
      console.error('[Auth] Token verification failed:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
    });
}

/**
 * Optional auth - doesn't require auth but attaches user if present
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ') && GOOGLE_CLIENT_ID) {
    const token = authHeader.slice(7);

    verifyGoogleToken(token)
      .then(payload => {
        if (payload && payload.sub) {
          req.user = {
            id: payload.sub,
            email: payload.email || '',
          };
        }
      })
      .catch(() => {
        // Ignore errors - just continue without user
      })
      .finally(() => next());
    return;
  }

  next();
}
