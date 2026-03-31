const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const INACTIVITY_TIMEOUT = parseInt(process.env.INACTIVITY_TIMEOUT) || 3600000; // 1 hour

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const session = await Session.findOne({ sessionId: decoded.sessionId, isActive: true });
    if (!session) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    const now = Date.now();
    const lastActivity = new Date(session.lastActivity).getTime();
    if (now - lastActivity > INACTIVITY_TIMEOUT) {
      session.isActive = false;
      session.logoutAt = new Date();
      session.autoLoggedOut = true;
      session.duration = Math.floor((now - new Date(session.loginAt).getTime()) / 1000);
      await session.save();
      await User.findByIdAndUpdate(user._id, { lastLogout: new Date() });
      return res.status(401).json({ error: 'Session expired due to inactivity. Please login again.' });
    }

    session.lastActivity = new Date();
    await session.save();
    await User.findByIdAndUpdate(user._id, { lastActivity: new Date() });

    req.user = user;
    req.sessionId = decoded.sessionId;
    req.session = session;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(err);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireTeacherOrAdmin = (req, res, next) => {
  if (!['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

const canAccessClass = (user, studentClass) => {
  if (user.role === 'admin') return true;
  return user.assignedClasses.includes(studentClass);
};

// Exporting all functions
module.exports = { authenticate, requireAdmin, requireTeacherOrAdmin, canAccessClass };