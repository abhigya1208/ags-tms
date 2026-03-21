const XLSX = require('xlsx');
const Student = require('../models/Student');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getFileName = (prefix) => {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const weekNum = Math.ceil(now.getDate() / 7);
  return `AGS_${month}_Week${weekNum}_${prefix}.xlsx`;
};

// GET /api/export/students
const exportStudents = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { class: cls } = req.query;
    const query = cls ? { class: cls } : {};
    const students = await Student.find(query).populate('siblings', 'name rollNumber').sort({ class: 1, rollNumber: 1 });

    const data = students.map(s => ({
      'Roll Number': s.rollNumber,
      'Name': s.name,
      'Father Name': s.fatherName,
      'Class': s.class,
      'Phone': s.phone,
      'Remarks': s.remarks,
      'Status': s.isArchived ? `Archived (${s.archivedFrom})` : 'Active',
      'Siblings': s.siblings.map(sib => sib.name).join(', '),
      'Enrolled Date': new Date(s.createdAt).toLocaleDateString(),
      ...MONTHS.reduce((acc, m) => {
        const record = s.feeRecords.find(fr => fr.month === m && fr.year === new Date().getFullYear());
        acc[`Fee-${m}`] = record ? record.status : 'Unpaid';
        return acc;
      }, {}),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, cls ? `Class ${cls}` : 'All Students');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = getFileName(cls ? `Class${cls}` : 'AllStudents');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// GET /api/export/defaulters
const exportDefaulters = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { month, year } = req.query;
    const students = await Student.find({ isArchived: false });
    const defaulters = [];

    students.forEach(student => {
      const pendingMonths = [];
      const targetYear = parseInt(year) || new Date().getFullYear();

      if (month) {
        const record = student.feeRecords.find(fr => fr.month === month && fr.year === targetYear);
        if (!record || record.status === 'Unpaid') pendingMonths.push(`${month} ${targetYear}`);
      } else {
        MONTHS.forEach(m => {
          const record = student.feeRecords.find(fr => fr.month === m && fr.year === targetYear);
          if (!record || record.status === 'Unpaid') pendingMonths.push(`${m} ${targetYear}`);
        });
      }

      if (pendingMonths.length > 0) {
        defaulters.push({
          'Roll Number': student.rollNumber,
          'Name': student.name,
          'Father Name': student.fatherName,
          'Class': student.class,
          'Phone': student.phone,
          'Pending Months': pendingMonths.join(', '),
          'Pending Count': pendingMonths.length,
        });
      }
    });

    defaulters.sort((a, b) => b['Pending Count'] - a['Pending Count']);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(defaulters);
    XLSX.utils.book_append_sheet(wb, ws, 'Defaulters');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = getFileName('Defaulters');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { exportStudents, exportDefaulters };
