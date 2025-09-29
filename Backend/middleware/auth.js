const jwt = require('jsonwebtoken');

// Generate JWT Token
function generateToken(user_id, role = 'user') {
    return jwt.sign(
        { user_id, role },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
}

// Middleware to authenticate JWT
function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ Message: 'Missing Authorization Token' });
        }

        jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, decoded) => {
            if (err) {
                return res.status(403).json({ Message: 'Invalid Token' });
            }
            req.user = {
                user_id: decoded.user_id,
                role: decoded.role
            };
            next();
        });
    } catch (error) {
        console.error('ERROR Authenticating JWT:', error);
        res.status(500).json({ Message: 'Error Authenticating JWT' });
    }
}

// Admin authorization
function authorizeAdminJWT(req, res, next) {
    if (req.user.role.toLowerCase() !== 'admin') {
        return res.status(403).json({ Message: 'Forbidden' });
    }
    next();
}

// Refresh Token
function refreshToken(req, res) {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ Message: 'Missing Token' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ Message: 'Invalid Token' });
            }
            const newToken = generateToken(decoded.user_id, decoded.role);
            res.status(200).json({ token: newToken });
        });
    } catch (error) {
        console.error('ERROR Refreshing Token:', error);
        res.status(500).json({ Message: 'Error Refreshing Token' });
    }
}

module.exports = {
    generateToken,
    authenticateJWT,
    authorizeAdminJWT,
    refreshToken
};