const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const tokenHeader = req.header('Authorization');
    if (!tokenHeader) return res.status(401).json({ error: 'Access denied. No token provided.' });

    const token = tokenHeader.replace('Bearer ', '');

    // Demo Bypass Logic
    if (token === 'demo_bypass_token_123') {
        req.user = { id: 'demo', role: 'student' };
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};
