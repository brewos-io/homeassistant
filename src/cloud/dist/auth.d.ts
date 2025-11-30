import type { Request, Response, NextFunction } from 'express';
import type { JWTPayload } from './types.js';
export declare function generateToken(userId: string, email: string): string;
export declare function verifyToken(token: string): JWTPayload | null;
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function extractTokenFromUrl(url: string): string | null;
export declare function extractDeviceFromUrl(url: string): string | null;
//# sourceMappingURL=auth.d.ts.map