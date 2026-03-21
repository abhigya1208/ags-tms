const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { canAccessClass } = require('../middleware/auth');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const logAction = async ({ actor, action, description, targetId, targetName, previousData, newData, sessionId, ip, targetType = 'Student' }) => {
  await AuditLog.create({
    actor: actor._id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    description,
    targetType,
    targetId,
    targetName,
    previousData,
    newData,
    sessionId,
    ip,
  });
};

// GET /api/students
const getStudents = async (req, res, next) => {
  try {
    const { search, class: cls, archived, page = 1, limit = 50 } = req.query;
    const query = {};

    // Role-based class filter
    if (req.user.role === 'teacher') {
      const allowedClasses = req.user.assignedClasses;
      if (allowedClasses.length === 0) return res.json({ students: [], total: 0 });
      query.class = { $in: allowedClasses };
      if (cls && allowedClasses.includes(cls)) query.class = cls;
    } else if (cls) {
      query.class = cls;
    }

    if (archived === 'true') query.isArchived = true;
    else if (archived === 'false') query.isArchived = false;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { fatherName: searchRegex },
        { phone: search },
        { rollNumber: search },
      ];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('siblings', 'name rollNumber class')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Strip fee amounts for teachers
    const result = students.map(s => {
      const obj = s.toObject();
      if (req.user.role === 'teacher') {
        obj.feeRecords = obj.feeRecords.map(fr => ({ ...fr, amount: undefined }));
      }
      return obj;
    });

    res.json({ students: result, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/students/:id
const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('siblings', 'name rollNumber class fatherName phone')
      .populate('createdBy', 'name')
      .populate('feeRecords.updatedBy', 'name');

    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!canAccessClass(req.user, student.class)) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }

    const obj = student.toObject();
    if (req.user.role === 'teacher') {
      obj.feeRecords = obj.feeRecords.map(fr => ({ ...fr, amount: undefined }));
    }
    res.json({ student: obj });
  } catch (err) {
    next(err);
  }
};

// POST /api/students
const createStudent = async (req, res, next) => {
  try {
    const { name, fatherName, class: cls, phone, remarks, siblings } = req.body;
    if (!name || !fatherName || !cls) {
      return res.status(400).json({ error: 'Name, father name, and class are required' });
    }
    if (!canAccessClass(req.user, cls)) {
      return res.status(403).json({ error: 'You cannot add students to this class' });
    }

    const rollNumber = await Student.generateRollNumber(cls);
    const student = new Student({
      name, fatherName, class: cls, phone, remarks,
      rollNumber,
      siblings: siblings || [],
      createdBy: req.user._id,
    });
    await student.save();

    // Update sibling references (bidirectional)
    if (siblings && siblings.length > 0) {
      await Student.updateMany(
        { _id: { $in: siblings } },
        { $addToSet: { siblings: student._id } }
      );
    }

    await logAction({
      actor: req.user,
      action: 'CREATE_STUDENT',
      description: `Added new student ${name} (${rollNumber}) to class ${cls}`,
      targetId: student._id,
      targetName: name,
      newData: student.toObject(),
      sessionId: req.sessionId,
      ip: req.ip,
    });

    const populated = await Student.findById(student._id).populate('siblings', 'name rollNumber class');
    res.status(201).json({ student: populated });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Roll number conflict, please retry' });
    next(err);
  }
};

// PUT /api/students/:id
const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!canAccessClass(req.user, student.class)) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }

    const previousData = student.toObject();
    const allowedFields = ['name', 'fatherName', 'phone', 'remarks', 'siblings'];
    // Admin can change class too
    if (req.user.role === 'admin') allowedFields.push('class');

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Handle sibling updates
    if (updates.siblings !== undefined) {
      const oldSiblings = student.siblings.map(s => s.toString());
      const newSiblings = updates.siblings.map(s => s.toString());

      // Remove from old siblings
      const removed = oldSiblings.filter(s => !newSiblings.includes(s));
      if (removed.length > 0) {
        await Student.updateMany({ _id: { $in: removed } }, { $pull: { siblings: student._id } });
      }
      // Add to new siblings
      const added = newSiblings.filter(s => !oldSiblings.includes(s));
      if (added.length > 0) {
        await Student.updateMany({ _id: { $in: added } }, { $addToSet: { siblings: student._id } });
      }
    }

    Object.assign(student, updates);
    await student.save();

    await logAction({
      actor: req.user,
      action: 'UPDATE_STUDENT',
      description: `${req.user.name} updated details of student ${student.name}`,
      targetId: student._id,
      targetName: student.name,
      previousData,
      newData: student.toObject(),
      sessionId: req.sessionId,
      ip: req.ip,
    });

    const populated = await Student.findById(student._id).populate('siblings', 'name rollNumber class');
    res.json({ student: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/students/:id (ADMIN ONLY)
const deleteStudent = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admin can delete students' });

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    await Student.updateMany({ siblings: student._id }, { $pull: { siblings: student._id } });

    await logAction({
      actor: req.user,
      action: 'DELETE_STUDENT',
      description: `Admin deleted student ${student.name} (${student.rollNumber})`,
      targetId: student._id,
      targetName: student.name,
      previousData: student.toObject(),
      sessionId: req.sessionId,
      ip: req.ip,
    });

    await student.deleteOne();
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/students/:id/archive
const archiveStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!canAccessClass(req.user, student.class)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { archive, month } = req.body; // archive: true/false
    const previousData = { isArchived: student.isArchived, archivedFrom: student.archivedFrom };

    student.isArchived = archive;
    if (archive) {
      student.archivedFrom = month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      student.archivedAt = new Date();
      student.archivedBy = req.user._id;
    } else {
      student.archivedFrom = '';
      student.archivedAt = null;
    }
    await student.save();

    const action = archive ? 'ARCHIVE_STUDENT' : 'UNARCHIVE_STUDENT';
    const desc = archive
      ? `${req.user.name} archived student ${student.name} from ${student.archivedFrom}`
      : `${req.user.name} unarchived student ${student.name}`;

    await logAction({
      actor: req.user,
      action,
      description: desc,
      targetId: student._id,
      targetName: student.name,
      previousData,
      newData: { isArchived: student.isArchived, archivedFrom: student.archivedFrom },
      sessionId: req.sessionId,
      ip: req.ip,
    });

    res.json({ student });
  } catch (err) {
    next(err);
  }
};

// PUT /api/students/:id/fee
const updateFee = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!canAccessClass(req.user, student.class)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { month, year, status, slipNumber, amount } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Month and year are required' });
    if (!MONTHS.includes(month)) return res.status(400).json({ error: 'Invalid month' });

    const previousData = { feeRecords: [...student.feeRecords] };

    // Check slip number uniqueness per student per month
    if (slipNumber) {
      const existingSlip = student.feeRecords.find(
        fr => fr.slipNumber === slipNumber && fr.month === month && fr.year === parseInt(year) && fr.slipNumber !== ''
      );
      if (existingSlip) {
        return res.status(400).json({ error: `Slip number ${slipNumber} already used for this month` });
      }
    }

    const existingIdx = student.feeRecords.findIndex(
      fr => fr.month === month && fr.year === parseInt(year)
    );

    const feeEntry = {
      month,
      year: parseInt(year),
      status: slipNumber ? 'Paid' : (status || 'Unpaid'),
      slipNumber: slipNumber || '',
      amount: req.user.role === 'admin' ? (amount || 0) : undefined,
      paidAt: slipNumber ? new Date() : undefined,
      updatedBy: req.user._id,
    };

    if (existingIdx >= 0) {
      student.feeRecords[existingIdx] = { ...student.feeRecords[existingIdx].toObject(), ...feeEntry };
    } else {
      student.feeRecords.push(feeEntry);
    }

    await student.save();

    const desc = slipNumber
      ? `${req.user.name} marked ${month} ${year} fee as Paid with slip #${slipNumber} for ${student.name}`
      : `${req.user.name} updated ${month} ${year} fee status to ${feeEntry.status} for ${student.name}`;

    await logAction({
      actor: req.user,
      action: 'UPDATE_FEE',
      description: desc,
      targetId: student._id,
      targetName: student.name,
      previousData,
      newData: { feeRecords: student.feeRecords },
      sessionId: req.sessionId,
      ip: req.ip,
    });

    const obj = student.toObject();
    if (req.user.role === 'teacher') {
      obj.feeRecords = obj.feeRecords.map(fr => ({ ...fr, amount: undefined }));
    }
    res.json({ student: obj });
  } catch (err) {
    next(err);
  }
};

// GET /api/students/defaulters
const getDefaulters = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { month, year, tillMonth, tillYear } = req.query;
    const students = await Student.find({ isArchived: false });

    const defaulters = [];
    students.forEach(student => {
      const pendingMonths = [];

      if (month && year) {
        // Specific month
        const feeRecord = student.feeRecords.find(
          fr => fr.month === month && fr.year === parseInt(year)
        );
        if (!feeRecord || feeRecord.status === 'Unpaid') {
          pendingMonths.push(`${month} ${year}`);
        }
      } else if (tillMonth && tillYear) {
        // Till selected month: check all months from student creation till that month
        const tillDate = new Date(`${tillMonth} 1, ${tillYear}`);
        const startDate = new Date(student.createdAt);
        startDate.setDate(1);

        let current = new Date(startDate);
        while (current <= tillDate) {
          const m = MONTHS[current.getMonth()];
          const y = current.getFullYear();
          const feeRecord = student.feeRecords.find(fr => fr.month === m && fr.year === y);
          if (!feeRecord || feeRecord.status === 'Unpaid') {
            pendingMonths.push(`${m} ${y}`);
          }
          current.setMonth(current.getMonth() + 1);
        }
      }

      if (pendingMonths.length > 0) {
        defaulters.push({
          _id: student._id,
          name: student.name,
          fatherName: student.fatherName,
          class: student.class,
          rollNumber: student.rollNumber,
          phone: student.phone,
          pendingMonths,
          pendingCount: pendingMonths.length,
        });
      }
    });

    defaulters.sort((a, b) => b.pendingCount - a.pendingCount);
    res.json({ defaulters, total: defaulters.length });
  } catch (err) {
    next(err);
  }
};

// POST /api/students/:logId/undo
const undoAction = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.logId);
    if (!log) return res.status(404).json({ error: 'Log not found' });
    if (log.sessionId !== req.sessionId) {
      return res.status(403).json({ error: 'Cannot undo actions from other sessions' });
    }
    if (log.isUndone) return res.status(400).json({ error: 'Action already undone' });
    if (!['UPDATE_STUDENT', 'ARCHIVE_STUDENT', 'UNARCHIVE_STUDENT', 'UPDATE_FEE'].includes(log.action)) {
      return res.status(400).json({ error: 'This action cannot be undone' });
    }

    const student = await Student.findById(log.targetId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Restore previous data
    if (log.previousData) {
      if (log.action === 'UPDATE_STUDENT') {
        Object.assign(student, {
          name: log.previousData.name,
          fatherName: log.previousData.fatherName,
          phone: log.previousData.phone,
          remarks: log.previousData.remarks,
        });
      } else if (log.action.includes('ARCHIVE')) {
        student.isArchived = log.previousData.isArchived;
        student.archivedFrom = log.previousData.archivedFrom;
      } else if (log.action === 'UPDATE_FEE') {
        student.feeRecords = log.previousData.feeRecords;
      }
      await student.save();
    }

    log.isUndone = true;
    log.undoneAt = new Date();
    log.undoneBy = req.user._id;
    await log.save();

    await logAction({
      actor: req.user,
      action: 'UNDO_ACTION',
      description: `${req.user.name} undid action: ${log.description}`,
      targetId: student._id,
      targetName: student.name,
      sessionId: req.sessionId,
      ip: req.ip,
    });

    res.json({ message: 'Action undone successfully', student });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  archiveStudent, updateFee, getDefaulters, undoAction,
};
