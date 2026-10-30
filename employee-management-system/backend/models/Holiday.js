const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  holidayName: { type: String, required: true },
  type:        { type: String, required: true, enum: ['Weekly', 'Monthly', 'Festival', 'Custom'] },
  // Holiday_Rule: fixed date for Festival/Custom; recurrence spec for Weekly/Monthly
  date:        { type: String, default: null },            // 'YYYY-MM-DD' for Festival/Custom
  recurrence:  {                                           // for Weekly/Monthly
    dayOfWeek:  { type: Number, default: null },           // 0-6 for Weekly
    dayOfMonth: { type: Number, default: null },           // 1-31 for Monthly
  },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  description: { type: String, default: '' },
  paidStatus:  { type: String, enum: ['Paid', 'Unpaid'], default: 'Paid' },
  applicableAll:       { type: Boolean, default: true },
  applicableEmployees: [{ type: String }],                 // employeeId subset when applicableAll=false
  employeeId:  { type: String, index: true },              // convention: creator/owner, optional
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });

module.exports = mongoose.model('Holiday', holidaySchema);
