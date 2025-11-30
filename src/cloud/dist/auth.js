import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
export function generateToken(userId, email) {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
export function authMiddleware(req, res, next) {
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
    req.user = payload;
    next();
}
export function extractTokenFromUrl(url) {
    const match = url.match(/[?&]token=([^&]+)/);
    return match ? match[1] : null;
}
export function extractDeviceFromUrl(url) {
    const match = url.match(/[?&]device=([^&]+)/);
    return match ? match[1] : null;
}
//# sourceMappingURL=auth.js.map