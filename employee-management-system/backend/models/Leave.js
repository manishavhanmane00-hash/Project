const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employeeId:  { type: String, required: true, index: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email:       { type: String, index: true },
  employeeName:{ type: String },
  department:  { type: String },
  leaveType:   { type: String, required: true },
  startDate:   { type: String, required: true },
  endDate:     { type: String, required: true },
  days:        { type: Number, required: true },
  reason:      { type: String },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  appliedDate: { type: String },
  approvedBy:  { type: String, default: null },
  approvedAt:  { type: Date, default: null },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
