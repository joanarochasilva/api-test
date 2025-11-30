import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';

export function generateToken(payload, expiresIn = '1h') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
    if (!token || typeof token !== 'string') {
        throw new Error('Token missing');
    }
    // quick structural check before calling jwt.verify
    if (token.split('.').length !== 3) {
        throw new jwt.JsonWebTokenError('jwt malformed');
    }
    return jwt.verify(token, JWT_SECRET);
}