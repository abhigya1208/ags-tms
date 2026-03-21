const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const Session = require('../models/Session');

router.use(authenticate);

// GET audit logs (admin sees all, teacher sees own)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, sessionId } = req.query;
    const query = {};

    if (req.user.role === 'teacher') {
      query.actor = req.user._id;
    } else if (req.query.actor) {
      query.actor = req.query.actor;
    }

    if (action) query.action = action;
    if (sessionId) query.sessionId = sessionId;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('actor', 'name role');

    res.json({ logs, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
});

// GET session logs
router.get('/sessions', requireAdmin, async (req, res, next) => {
  try {
    const sessions = await Session.find()
      .sort({ loginAt: -1 })
      .limit(200)
      .populate('user', 'name email');
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

// GET undoable actions for current session
router.get('/undoable', async (req, res, next) => {
  try {
    const logs = await AuditLog.find({
      sessionId: req.sessionId,
      isUndone: false,
      action: { $in: ['UPDATE_STUDENT', 'ARCHIVE_STUDENT', 'UNARCHIVE_STUDENT', 'UPDATE_FEE'] },
    }).sort({ createdAt: -1 }).limit(20);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
