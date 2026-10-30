const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: [true, 'Task title is required'], trim: true },
  description: { type: String, default: '', trim: true },
  assignedTo:  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:     { type: String },
    email:    { type: String },
  },
  assignedBy:  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:     { type: String },
  },
  department:  { type: String, default: '' },
  priority:    { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status:      { type: String, enum: ['todo', 'in-progress', 'completed', 'cancelled'], default: 'todo', index: true },
  dueDate:     { type: String, default: null },
  completedAt: { type: Date, default: null },
  notes:       { type: String, default: '' },
}, { timestamps: true });

taskSchema.index({ 'assignedTo.userId': 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
