const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title:       { type: String },
  description: { type: String },
  status:      { type: String, default: 'in-progress' },
  progress:    { type: Number, default: 0 },
  dueDate:     { type: String },
}, { _id: false });

const performanceSchema = new mongoose.Schema({
  employeeId:      { type: String, required: true, index: true },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email:           { type: String },
  employeeName:    { type: String },
  department:      { type: String },
  reviewPeriod:    { type: String },
  reviewDate:      { type: String },
  reviewer:        { type: String },
  overallRating:   { type: Number, min: 0, max: 5, default: 0 },
  goals:           { type: Number, min: 0, max: 5, default: 0 },
  kpis:            { type: Number, min: 0, max: 5, default: 0 },
  strengths:       { type: String, default: '' },
  improvements:    { type: String, default: '' },
  managerComments: { type: String, default: '' },
  employeeComments:{ type: String, default: '' },
  status:          { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'completed', index: true },
  goalsList:       { type: [goalSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Performance', performanceSchema);
