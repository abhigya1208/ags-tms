const User = require('../models/User');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const Student = require('../models/Student');

// ======= TEACHER MANAGEMENT (ADMIN ONLY) =======

// GET /api/teachers
const getTeachers = async (req, res, next) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password').sort({ createdAt: -1 });
    res.json({ teachers });
  } catch (err) {
    next(err);
  }
};

// POST /api/teachers
const createTeacher = async (req, res, next) => {
  try {
    const { name, email, password, phone, assignedClasses } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const teacher = new User({
      name, email, password, phone,
      role: 'teacher',
      assignedClasses: assignedClasses || [],
    });
    await teacher.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'CREATE_TEACHER',
      description: `Admin created teacher account for ${name}`,
      targetType: 'Teacher',
      targetId: teacher._id,
      targetName: name,
      sessionId: req.sessionId,
      ip: req.ip,
    });

    res.status(201).json({ teacher: teacher.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// PUT /api/teachers/:id
const updateTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const { name, phone, assignedClasses, isActive, password } = req.body;
    if (name) teacher.name = name;
    if (phone !== undefined) teacher.phone = phone;
    if (assignedClasses !== undefined) teacher.assignedClasses = assignedClasses;
    if (isActive !== undefined) teacher.isActive = isActive;
    if (password) teacher.password = password;

    await teacher.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'UPDATE_TEACHER',
      description: `Admin updated teacher ${teacher.name}`,
      targetType: 'Teacher',
      targetId: teacher._id,
      targetName: teacher.name,
      sessionId: req.sessionId,
      ip: req.ip,
    });

    res.json({ teacher: teacher.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/teachers/:id (Admin only)
const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    await teacher.deleteOne();
    res.json({ message: 'Teacher deleted' });
  } catch (err) {
    next(err);
  }
};

// ======= ADMIN DASHBOARD =======
const getAdminDashboard = async (req, res, next) => {
  try {
    const [totalStudents, activeStudents, archivedStudents, totalTeachers] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ isArchived: false }),
      Student.countDocuments({ isArchived: true }),
      User.countDocuments({ role: 'teacher' }),
    ]);

    // Recent activity
    const recentLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('actor', 'name role');

    // Teacher activity summary
    const teacherSessions = await Session.find({ userRole: 'teacher' })
      .sort({ loginAt: -1 })
      .limit(20)
      .populate('user', 'name');

    // Class-wise student count
    const classStats = await Student.aggregate([
      { $group: { _id: '$class', count: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$isArchived', false] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      stats: { totalStudents, activeStudents, archivedStudents, totalTeachers },
      recentLogs,
      teacherSessions,
      classStats,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/sessions
const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find()
      .sort({ loginAt: -1 })
      .limit(100)
      .populate('user', 'name email role');
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/classes
const getClasses = async (req, res, next) => {
  try {
    const classes = await Student.distinct('class');
    res.json({ classes: classes.sort() });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTeachers, createTeacher, updateTeacher, deleteTeacher,
  getAdminDashboard, getSessions, getClasses,
};
