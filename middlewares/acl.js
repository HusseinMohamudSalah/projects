exports.allowedRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: No user found' });
        }
        if (!roles.includes(req.user.role)) {
            console.log('Unauthorized access attempt:', req.user.role, roles);
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};



