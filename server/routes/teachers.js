const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  getTeachers, createTeacher, updateTeacher, deleteTeacher,
} = require('../controllers/adminController');

router.use(authenticate, requireAdmin);

router.get('/', getTeachers);
router.post('/', createTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

module.exports = router;
