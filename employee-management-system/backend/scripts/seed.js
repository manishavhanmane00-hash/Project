/**
 * Secure initial admin seed script.
 *
 * Usage:
 *   1. Copy .env.example to .env and set SEED_ADMIN_* values
 *   2. Run: npm run seed
 *
 * This creates the first administrator account with a hashed password.
 * It is idempotent — if an admin with the email already exists, it skips creation.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');

const seed = async () => {
  await connectDB();

  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@company.com').toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';
  const name = process.env.SEED_ADMIN_NAME || 'System Administrator';

  console.log('\n=== EMS Seed Script ===\n');

  // 1. Create the admin user
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`✔  Admin account already exists: ${email}`);
    if (existing.role !== 'Admin') {
      existing.role = 'Admin';
      existing.isActive = true;
      await existing.save();
      console.log('   Promoted existing account to Admin.');
    }
  } else {
    await User.create({
      name,
      email,
      password,           // hashed by pre-save hook
      role: 'Admin',
      isActive: true,
    });
    console.log(`✔  Created admin account:`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ⚠  Change this password after first login.`);
  }

  // 2. Seed default departments (skip any that already exist)
  const defaultDepartments = [
    { name: 'Engineering',     code: 'ENG', description: 'Software development and infrastructure' },
    { name: 'Human Resources', code: 'HR',  description: 'Talent acquisition, employee relations, and HR policies' },
    { name: 'Marketing',       code: 'MKT', description: 'Brand management, campaigns, and digital marketing' },
    { name: 'Sales',           code: 'SAL', description: 'Revenue generation and client relationships' },
    { name: 'Finance',         code: 'FIN', description: 'Financial planning, accounting, and auditing' },
    { name: 'Operations',      code: 'OPS', description: 'Day-to-day operations and process management' },
    { name: 'Design',          code: 'DSG', description: 'UI/UX and graphic design' },
    { name: 'Legal',           code: 'LGL', description: 'Legal compliance and corporate governance' },
  ];

  let deptCount = 0;
  for (const d of defaultDepartments) {
    const exists = await Department.findOne({ name: d.name });
    if (!exists) {
      await Department.create(d);
      deptCount++;
    }
  }
  if (deptCount) {
    console.log(`✔  Seeded ${deptCount} default department(s).`);
  } else {
    console.log('✔  Default departments already present.');
  }

  console.log('\n=== Seed complete ===\n');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
