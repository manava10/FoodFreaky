const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({ success: false, msg: 'Not authorized to access this route' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = await User.findById(decoded.id);

        // Check if user exists
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                msg: 'User no longer exists. Please login again.' 
            });
        }

        // Grant access to the next middleware
        next();
    } catch (error) {
        res.status(401).json({ success: false, msg: 'Not authorized, token failed' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // Safety check: ensure user exists (should always be true if protect middleware ran first)
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                msg: 'Authentication required' 
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                msg: `User role '${req.user.role}' is not authorized to access this route` 
            });
        }
        next();
    };
};
