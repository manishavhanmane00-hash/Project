const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:        { type: String, required: [true, 'Name is required'], trim: true },
  // Email is optional for employee accounts that log in with an Employee ID.
  // When present it must be unique (sparse index allows multiple nulls).
  email:       { type: String, unique: true, sparse: true, trim: true, lowercase: true, default: undefined },
  // Human-readable Employee ID used as a login identifier (e.g. EMP-0001).
  // Unique + sparse so staff accounts (Admin/HR/Manager) without one are allowed.
  employeeId:  { type: String, unique: true, sparse: true, trim: true, index: true, default: undefined },
  // Flag set true when the initial password was set by HR/Admin and the
  // employee has not yet changed it. Used to prompt a password change on first login.
  mustChangePassword: { type: Boolean, default: false },
  password:    { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role:        { type: String, enum: ['Admin', 'HR', 'Manager', 'Employee'], default: 'Employee' },
  designation: { type: String, default: '', trim: true },
  department:  { type: String, default: '', trim: true },
  phone:       { type: String, default: '' },
  address:     { type: String, default: '' },
  city:        { type: String, default: '' },
  state:       { type: String, default: '' },
  country:     { type: String, default: '' },
  avatar:      { type: String, default: null },
  googleId:    { type: String, default: null },
  isActive:    { type: Boolean, default: true, index: true },
  employeeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null, index: true },
}, { timestamps: true });

// Hash password before saving — never store plaintext
userSchema.pre('save', async function (next) {
  // Only hash if the password field was modified
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare a plaintext candidate against the stored hash
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never return the password hash in any JSON response
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
