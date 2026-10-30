const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema({
  employeeId:    { type: String, required: true, index: true },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email:         { type: String, index: true },
  employeeName:  { type: String },
  date:          { type: String, required: true },         // 'YYYY-MM-DD'
  amount:        { type: Number, required: true, min: 0.01 },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank'], default: 'Cash' },
  reason:        { type: String, default: '' },
  status:        { type: String, enum: ['Pending', 'Settled/Returned', 'Salary Adjustment'], default: 'Pending', index: true },
  // payroll-sync bookkeeping
  deducted:      { type: Boolean, default: false, index: true },
  deductedMonth: { type: String, default: null },
  deductedYear:  { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Advance', advanceSchema);
