const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, enum: ['admin', 'teacher'], required: true },
    action: { type: String, required: true }, // e.g. 'UPDATE_STUDENT', 'ARCHIVE_STUDENT'
    description: { type: String, required: true }, // human-readable
    targetType: { type: String, enum: ['Student', 'Teacher', 'User', 'System'], default: 'Student' },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetName: { type: String, default: '' },
    // Snapshot for undo
    previousData: { type: mongoose.Schema.Types.Mixed, default: null },
    newData: { type: mongoose.Schema.Types.Mixed, default: null },
    // Session reference for undo eligibility
    sessionId: { type: String, required: true },
    isUndone: { type: Boolean, default: false },
    undoneAt: { type: Date },
    undoneBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // IP for security
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ sessionId: 1 });
auditLogSchema.index({ targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
