exports.isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        req.user = { id: req.session.userId, role: req.session.role };
        return next();
    }
    return res.status(401).json({ message: 'Not authenticated' });
};

exports.isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied: Admins only' });
};
