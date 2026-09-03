const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    // Core identity
    name:         { type: String, required: [true, 'Employee name is required'], trim: true },
    firstName:    { type: String, default: '', trim: true },
    lastName:     { type: String, default: '', trim: true },
    email:        { type: String, required: [true, 'Email is required'], unique: true, trim: true, lowercase: true },
    phone:        { type: String, default: '', trim: true },
    altPhone:     { type: String, default: '' },
    gender:       { type: String, default: '' },
    dob:          { type: String, default: '' },

    // Address
    address:      { type: String, default: '' },
    city:         { type: String, default: '' },
    state:        { type: String, default: '' },
    country:      { type: String, default: '' },
    postal:       { type: String, default: '' },

    // Employment
    department:   { type: String, required: [true, 'Department is required'], trim: true },
    designation:  { type: String, default: '', trim: true },
    position:     { type: String, default: '', trim: true }, // alias for designation
    manager:      { type: String, default: '' },
    joiningDate:  { type: String, default: '' },
    dateOfJoining:{ type: Date,   default: null },
    employmentType: { type: String, default: 'Full-time' },
    workLocation: { type: String, default: '' },
    status:       { type: String, default: 'active', index: true },
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

// Derive designation from position when designation is missing
employeeSchema.pre('save', function (next) {
  if (!this.designation && this.position) this.designation = this.position;
  if (!this.position && this.designation) this.position = this.designation;
  if (!this.name && this.firstName) this.name = `${this.firstName} ${this.lastName || ''}`.trim();
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
