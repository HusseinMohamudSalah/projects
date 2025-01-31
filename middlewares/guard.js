const jwt = require('jsonwebtoken');

exports.guard = (req, res, next) => {
  
    const authHeader = req.headers?.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server error: No JWT secret configured' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            console.log('Authenticated User:', req.user);
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
        }
    } else {
        return res.status(401).json({ message: 'Unauthorized: No authorization header provided' });
    }
}
