import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

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
 * Middleware to verify Supabase JWT token
 */
export async function supabaseAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || '',
    };

    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth - doesn't require auth but attaches user if present
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email || '',
        };
      }
    } catch {
      // Ignore errors - just continue without user
    }
  }

  next();
}

