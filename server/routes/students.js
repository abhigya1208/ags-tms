const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getStudents, getStudent, createStudent, updateStudent,
  deleteStudent, archiveStudent, updateFee, getDefaulters, undoAction,
} = require('../controllers/studentController');

router.use(authenticate);

router.get('/', getStudents);
router.get('/defaulters', getDefaulters);
router.get('/:id', getStudent);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.put('/:id/archive', archiveStudent);
router.put('/:id/fee', updateFee);
router.post('/undo/:logId', undoAction);

module.exports = router;
