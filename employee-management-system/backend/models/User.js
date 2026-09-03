const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['Admin', 'HR', 'Manager', 'Employee'], default: 'Employee' },
  designation: { type: String, default: '' },
  department:  { type: String, default: '' },
  phone:    { type: String, default: '' },
  address:  { type: String, default: '' },
  city:     { type: String, default: '' },
  state:    { type: String, default: '' },
  country:  { type: String, default: '' },
  avatar:   { type: String, default: null },
  googleId: { type: String, default: null },
  employeeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
