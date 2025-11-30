import { verifyToken } from "../utils/jwtManager.js";
import { readData } from "../utils/databaseManager.js";

export async function authMiddleware(req, res, next) {
    try {
        const { authorization } = req.headers;
        let tokenString = null;

        if (authorization && authorization.startsWith('Bearer ')) {
            tokenString = authorization.slice(7).trim();
        } else if (req.query && (req.query.token || req.query.access_token)) {
            tokenString = (req.query.token || req.query.access_token).toString().trim();
        } else {
            return res.status(401).json({ message: 'Authorization token missing' });
        }

        // basic structural validation
        if (!tokenString || tokenString.split('.').length !== 3) {
            return res.status(401).json({ message: 'Malformed token' });
        }

        let payload;
        try {
            payload = verifyToken(tokenString);
        } catch (err) {
            // jwt.verify throws JsonWebTokenError / TokenExpiredError
            return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
        }

        const users = await readData('usuarios');
        const user = users.find(u => u.id_usuario === payload.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('authMiddleware error:', err);
        return res.status(500).json({ message: 'Authentication error' });
    }
}
