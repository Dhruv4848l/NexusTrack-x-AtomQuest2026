const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the JWT in the Authorization header and attaches
 * the user document to req.user.
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized — invalid token' });
  }
};

/**
 * Role guard — use after protect().
 * Usage: requireRole('admin') or requireRole('admin', 'manager')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const hasRole = req.user.roles.some((r) => roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ message: `Access denied — requires role: ${roles.join(' or ')}` });
    }
    next();
  };
};

module.exports = { protect, requireRole };
