const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema({
  employeeId:      { type: String, required: true, index: true },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email:           { type: String, index: true },
  employeeName:    { type: String },
  date:            { type: String, required: true },       // 'YYYY-MM-DD'
  durationHours:   { type: Number, default: 0, min: 0 },
  durationMinutes: { type: Number, default: 0, min: 0 },
  ratePerHour:     { type: Number, required: true, min: 0 },
  totalAmount:     { type: Number, default: 0 },           // (hours + minutes/60) * ratePerHour
  reason:          { type: String, default: '' },
  status:          { type: String, enum: ['Pending', 'Paid'], default: 'Pending', index: true },
  // payroll-sync bookkeeping
  counted:         { type: Boolean, default: false, index: true },
  countedMonth:    { type: String, default: null },
  countedYear:     { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Overtime', overtimeSchema);
