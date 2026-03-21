const mongoose = require('mongoose');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Fee entry per month
const feeEntrySchema = new mongoose.Schema({
  month: { type: String, enum: MONTHS, required: true },
  year: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
  slipNumber: { type: String, default: '' },
  amount: { type: Number, default: 0 }, // future fee amount field
  paidAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    rollNumber: { type: String, unique: true },
    remarks: { type: String, default: '' },

    // Sibling linking
    siblings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],

    // Fee records (array of monthly entries)
    feeRecords: [feeEntrySchema],

    // Archive system
    isArchived: { type: Boolean, default: false },
    archivedFrom: { type: String, default: '' }, // e.g. "March 2025"
    archivedAt: { type: Date },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Who created
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Future: branch support
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },

    // For WhatsApp future feature
    whatsappOptIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for search performance
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ name: 'text', fatherName: 'text' });
studentSchema.index({ phone: 1 });
studentSchema.index({ class: 1 });
studentSchema.index({ isArchived: 1 });

// Auto-generate roll number: YYMM + ClassCode + SerialNumber
studentSchema.statics.generateRollNumber = async function (studentClass, createdAt) {
  const date = createdAt || new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  // Class code: take numeric part or hash first 2 chars
  const classCode = studentClass.replace(/\D/g, '').padStart(2, '0').slice(0, 2) ||
    String(studentClass.charCodeAt(0)).slice(-2);
  
  // Count existing students in this class in this month
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  
  const count = await this.countDocuments({
    class: studentClass,
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });
  
  const serial = String(count + 1).padStart(2, '0');
  return `${yy}${mm}${classCode}${serial}`;
};

module.exports = mongoose.model('Student', studentSchema);
