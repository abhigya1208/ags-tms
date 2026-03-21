const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { exportStudents, exportDefaulters } = require('../controllers/exportController');

router.use(authenticate, requireAdmin);

router.get('/students', exportStudents);
router.get('/defaulters', exportDefaulters);

module.exports = router;
