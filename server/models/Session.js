const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: ['admin', 'teacher'], required: true },
    sessionId: { type: String, required: true, unique: true },
    loginAt: { type: Date, default: Date.now },
    logoutAt: { type: Date },
    lastActivity: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    duration: { type: Number, default: 0 }, // seconds
    ip: { type: String, default: '' },
    // Auto-logout flag
    autoLoggedOut: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1 });
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ isActive: 1 });

module.exports = mongoose.model('Session', sessionSchema);
