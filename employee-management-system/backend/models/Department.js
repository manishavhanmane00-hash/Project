const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name:        { type: String, required: [true, 'Department name is required'], unique: true, trim: true },
  code:        { type: String, default: '', trim: true, uppercase: true },
  description: { type: String, default: '', trim: true },
  manager:     { type: String, default: '', trim: true },
  managerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('Department', departmentSchema);
