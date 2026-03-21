const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');

const generateSessionId = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

const generateToken = (userId, sessionId) => {
  return jwt.sign({ userId, sessionId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Close any existing active sessions
    await Session.updateMany(
      { user: user._id, isActive: true },
      { isActive: false, logoutAt: new Date(), autoLoggedOut: true }
    );

    const sessionId = generateSessionId();
    const token = generateToken(user._id, sessionId);

    // Create session record
    const session = new Session({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      sessionId,
      ip: req.ip,
    });
    await session.save();

    // Update user login time
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    await user.save();

    res.json({
      token,
      sessionId,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const session = await Session.findOne({ sessionId: req.sessionId, isActive: true });
    if (session) {
      session.isActive = false;
      session.logoutAt = new Date();
      session.duration = Math.floor((Date.now() - new Date(session.loginAt).getTime()) / 1000);
      await session.save();
    }

    await User.findByIdAndUpdate(req.user._id, { lastLogout: new Date() });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, logout, getMe, changePassword };
