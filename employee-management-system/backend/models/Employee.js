const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    // Unique, human-readable employee ID (e.g. EMP-0001)
    employeeId:   { type: String, unique: true, sparse: true, trim: true, index: true },

    // Draft support — a draft is a partially-filled employee record that an HR/Admin
    // user is still working on. Drafts relax the required-field rules so a half-finished
    // form can be persisted and resumed later (after refresh/logout/login).
    isDraft:      { type: Boolean, default: false, index: true },
    draftStep:    { type: Number, default: 1 }, // last step the user reached (1-5)
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    // Core identity (required only for finalized employees — see conditional validators)
    name:         { type: String, trim: true },
    firstName:    { type: String, default: '', trim: true },
    lastName:     { type: String, default: '', trim: true },
    email:        { type: String, trim: true, lowercase: true },
    phone:        { type: String, default: '', trim: true },
    altPhone:     { type: String, default: '' },
    gender:       { type: String, default: '' },
    dob:          { type: String, default: '' },

    // Address
    address:      { type: String, default: '' },
    city:         { type: String, default: '' },
    state:        { type: String, default: '' },
    country:      { type: String, default: 'India' },
    postal:       { type: String, default: '' },

    // Employment
    department:   { type: String, default: '', trim: true, index: true },
    designation:  { type: String, default: '', trim: true, index: true },
    position:     { type: String, default: '', trim: true }, // alias for designation
    manager:      { type: String, default: '' },
    joiningDate:  { type: String, default: '' },
    dateOfJoining:{ type: Date,   default: null },
    employmentType: { type: String, default: 'Full-time', enum: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
    workLocation: { type: String, default: '' },
    status:       { type: String, default: 'active', enum: ['active', 'inactive', 'on-leave'], index: true },
    probation:    { type: String, default: '' },

    // Compensation
    salary:       { type: Number, default: 0, min: [0, 'Salary cannot be negative'] },
    hra:          { type: Number, default: 0 },
    allowances:   { type: Number, default: 0 },
    bonus:        { type: Number, default: 0 },
    deductions:   { type: Number, default: 0 },
    paymentMethod:{ type: String, default: 'Bank Transfer' },
    bankAccount:  { type: String, default: '' },
    bankName:     { type: String, default: '' },

    // Link to User account (optional — set when employee registers/logs in)
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    // Avatar
    avatar:       { type: String, default: null },
  },
  { timestamps: true }
);

// Enforce email uniqueness ONLY for real (non-empty) emails. Partial index lets
// multiple drafts exist without an email while still blocking duplicate finalized ones.
employeeSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string', $gt: '' } } }
);

// Derive designation from position when designation is missing, and enforce the
// "required" rules only for finalized employees (drafts may be incomplete).
employeeSchema.pre('save', function (next) {
  if (!this.designation && this.position) this.designation = this.position;
  if (!this.position && this.designation) this.position = this.designation;
  if (!this.name && this.firstName) this.name = `${this.firstName} ${this.lastName || ''}`.trim();

  if (!this.isDraft) {
    if (!this.name)       return next(new Error('Employee name is required'));
    if (!this.email)      return next(new Error('Email is required'));
    if (!this.department) return next(new Error('Department is required'));
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
