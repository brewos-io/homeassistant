/**
 * Google OAuth authentication
 * Uses direct Google Sign-In with popup flow
 */

// Google Client ID from environment
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Check if Google auth is configured
export const isGoogleAuthConfigured = !!GOOGLE_CLIENT_ID;

// User type from Google ID token
export interface GoogleUser {
  id: string;        // Google user ID (sub)
  email: string;
  name: string;
  picture: string;
}

// Session stored in localStorage
export interface AuthSession {
  user: GoogleUser;
  idToken: string;
  expiresAt: number;
}

const AUTH_STORAGE_KEY = 'brewos_auth';

/**
 * Get stored session from localStorage
 */
export function getStoredSession(): AuthSession | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored) as AuthSession;
    
    // Check if expired
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

/**
 * Store session in localStorage
 */
export function storeSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Clear stored session
 */
export function clearSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Parse Google ID token payload (JWT)
 * Note: This just decodes, actual verification happens on server
 */
export function parseIdToken(idToken: string): GoogleUser | null {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

/**
 * Handle successful Google sign-in
 */
export function handleGoogleSuccess(credential: string): AuthSession | null {
  const user = parseIdToken(credential);
  if (!user) return null;
  
  // Google ID tokens are valid for 1 hour
  const session: AuthSession = {
    user,
    idToken: credential,
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
  
  storeSession(session);
  return session;
}

