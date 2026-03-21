const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getAdminDashboard, getSessions, getClasses } = require('../controllers/adminController');

router.use(authenticate);

router.get('/dashboard', requireAdmin, getAdminDashboard);
router.get('/sessions', requireAdmin, getSessions);
router.get('/classes', getClasses);

module.exports = router;
