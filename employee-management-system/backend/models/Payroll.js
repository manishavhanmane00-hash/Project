const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId:   { type: String, required: true, index: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email:        { type: String },
  employeeName: { type: String },
  department:   { type: String },
  month:        { type: String, required: true },
  year:         { type: Number, required: true },
  basic:        { type: Number, default: 0 },
  hra:          { type: Number, default: 0 },
  allowances:   { type: Number, default: 0 },
  bonus:        { type: Number, default: 0 },
  tax:          { type: Number, default: 0 },
  insurance:    { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  paymentDate:  { type: String, default: null },
  status:       { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending', index: true },
}, { timestamps: true });

payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
