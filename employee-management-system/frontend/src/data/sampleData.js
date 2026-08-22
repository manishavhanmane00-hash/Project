// =============================================
// EMS — Reference / Master Data (no demo employees, no demo accounts)
// Currency: INR (₹)
// =============================================

// ── Department master data (structure only, manager field empty) ─────────────
export const DEPARTMENTS = [
  { id: 1, name: 'Engineering',      manager: '', employeeCount: 0, status: 'active', description: 'Software development and infrastructure' },
  { id: 2, name: 'Human Resources',  manager: '', employeeCount: 0, status: 'active', description: 'Talent acquisition, employee relations, and HR policies' },
  { id: 3, name: 'Marketing',        manager: '', employeeCount: 0, status: 'active', description: 'Brand management, campaigns, and digital marketing' },
  { id: 4, name: 'Sales',            manager: '', employeeCount: 0, status: 'active', description: 'Revenue generation and client relationships' },
  { id: 5, name: 'Finance',          manager: '', employeeCount: 0, status: 'active', description: 'Financial planning, accounting, and auditing' },
  { id: 6, name: 'Operations',       manager: '', employeeCount: 0, status: 'active', description: 'Day-to-day operations and process management' },
  { id: 7, name: 'Design',           manager: '', employeeCount: 0, status: 'active', description: 'UI/UX and graphic design' },
  { id: 8, name: 'Legal',            manager: '', employeeCount: 0, status: 'active', description: 'Legal compliance and corporate governance' },
];

// ── Designation master data (role catalogue) ─────────────────────────────────
export const DESIGNATIONS = [
  { id: 1,  name: 'Software Engineer',         department: 'Engineering',     employeeCount: 0, status: 'active' },
  { id: 2,  name: 'Senior Software Engineer',  department: 'Engineering',     employeeCount: 0, status: 'active' },
  { id: 3,  name: 'Engineering Manager',       department: 'Engineering',     employeeCount: 0, status: 'active' },
  { id: 4,  name: 'DevOps Engineer',           department: 'Engineering',     employeeCount: 0, status: 'active' },
  { id: 5,  name: 'HR Manager',               department: 'Human Resources', employeeCount: 0, status: 'active' },
  { id: 6,  name: 'HR Executive',             department: 'Human Resources', employeeCount: 0, status: 'active' },
  { id: 7,  name: 'Recruiter',                department: 'Human Resources', employeeCount: 0, status: 'active' },
  { id: 8,  name: 'Marketing Manager',        department: 'Marketing',        employeeCount: 0, status: 'active' },
  { id: 9,  name: 'Marketing Executive',      department: 'Marketing',        employeeCount: 0, status: 'active' },
  { id: 10, name: 'Content Writer',           department: 'Marketing',        employeeCount: 0, status: 'active' },
  { id: 11, name: 'Sales Manager',            department: 'Sales',            employeeCount: 0, status: 'active' },
  { id: 12, name: 'Sales Executive',          department: 'Sales',            employeeCount: 0, status: 'active' },
  { id: 13, name: 'Finance Manager',          department: 'Finance',          employeeCount: 0, status: 'active' },
  { id: 14, name: 'Accountant',              department: 'Finance',          employeeCount: 0, status: 'active' },
  { id: 15, name: 'UI/UX Designer',           department: 'Design',           employeeCount: 0, status: 'active' },
  { id: 16, name: 'Product Manager',          department: 'Engineering',     employeeCount: 0, status: 'active' },
];

// ── No demo employees — starts empty ─────────────────────────────────────────
export const EMPLOYEES = [];

// ── Leave type master data (policy) ──────────────────────────────────────────
export const LEAVE_TYPES = [
  { id: 1, name: 'Annual Leave',        days: 18, color: 'primary' },
  { id: 2, name: 'Sick Leave',          days: 10, color: 'danger'  },
  { id: 3, name: 'Casual Leave',        days: 6,  color: 'info'    },
  { id: 4, name: 'Maternity Leave',     days: 90, color: 'purple'  },
  { id: 5, name: 'Paternity Leave',     days: 10, color: 'teal'    },
  { id: 6, name: 'Compensatory Leave',  days: 5,  color: 'warning' },
];

// ── No demo leave requests / balances ────────────────────────────────────────
export const LEAVE_REQUESTS  = [];
export const LEAVE_BALANCES  = [];

// ── No demo attendance ───────────────────────────────────────────────────────
export const ATTENDANCE_DATA = [];

// ── No demo payroll records ──────────────────────────────────────────────────
export const PAYROLL_DATA = [];

// ── No demo performance reviews ──────────────────────────────────────────────
export const PERFORMANCE_REVIEWS = [];

// ── Dashboard stats — all zero for clean start ───────────────────────────────
export const DASHBOARD_STATS = {
  totalEmployees:  0,
  activeEmployees: 0,
  onLeave:         0,
  presentToday:    0,
  absentToday:     0,
  pendingLeave:    0,
  monthlyPayroll:  0,   // ₹ INR
  avgAttendance:   0,
};

// ── Chart seed data — empty arrays so charts render cleanly ──────────────────
export const EMPLOYEE_GROWTH    = [];
export const ATTENDANCE_OVERVIEW = [];
export const LEAVE_STATS         = [];
export const DEPT_DISTRIBUTION   = [];
export const PAYROLL_OVERVIEW    = [];

// ── Activity feed and events — empty ─────────────────────────────────────────
export const RECENT_ACTIVITIES = [];
export const UPCOMING_EVENTS   = [];
