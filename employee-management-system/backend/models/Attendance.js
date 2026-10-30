const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name:       { type: String },
  email:      { type: String, index: true },
  department: { type: String },
  date:       { type: String, required: true, index: true }, // YYYY-MM-DD
  checkIn:    { type: String, default: null },
  checkOut:   { type: String, default: null },
  hours:      { type: Number, default: 0 },
  overtime:   { type: Number, default: 0 },
  status:     { type: String, enum: ['present', 'absent', 'late', 'half-day', 'leave'], default: 'absent' },
  late:       { type: Boolean, default: false },

  // Admin correction audit trail
  correctedAt:      { type: Date, default: null },
  correctedBy:       { type: String, default: null },
  correctionReason: { type: String, default: '' },
  correctionBefore: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
