const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employeeId:   { type: String, required: true, index: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email:        { type: String, index: true },
  employeeName: { type: String },
  department:   { type: String },
  leaveType:    { type: String, required: true, enum: ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave', 'Paternity Leave', 'Compensatory Leave', 'Unpaid Leave'] },
  startDate:    { type: String, required: true },
  endDate:      { type: String, required: true },
  days:         { type: Number, required: true, min: 0.5 },
  reason:       { type: String, default: '' },
  status:       { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', index: true },
  appliedDate:  { type: String },
  approvedBy:   { type: String, default: null },
  approvedAt:   { type: Date, default: null },
  rejectionReason: { type: String, default: '' },
  cancelledAt:  { type: Date, default: null },
  balanceBefore: { type: Number, default: null }, // leave balance snapshot at approval time
}, { timestamps: true });

leaveSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
