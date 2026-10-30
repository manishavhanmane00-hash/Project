/**
 * Frontend mirror of backend/config/modules.js.
 *
 * Single source of truth for the permission toggle UI (Settings → Roles &
 * Permissions) and for mapping routes/sidebar items to permission keys.
 * Keep in sync with the backend registry.
 */

export const MODULES = [
  { key: 'dashboard', label: 'Dashboard', submodules: [] },
  {
    key: 'employees', label: 'Employees', submodules: [
      { key: 'employees.list', label: 'Employee List' },
      { key: 'employees.add', label: 'Add Employee' },
    ],
  },
  {
    key: 'departments', label: 'Departments', submodules: [
      { key: 'departments.departments', label: 'Departments' },
      { key: 'departments.roles', label: 'Roles & Designations' },
    ],
  },
  {
    key: 'attendance', label: 'Attendance', submodules: [
      { key: 'attendance.daily', label: 'Daily Attendance' },
      { key: 'attendance.history', label: 'Attendance History' },
      { key: 'attendance.reports', label: 'Attendance Reports' },
    ],
  },
  {
    key: 'leave', label: 'Leave Management', submodules: [
      { key: 'leave.requests', label: 'Leave Requests' },
      { key: 'leave.apply', label: 'Apply Leave' },
      { key: 'leave.approval', label: 'Leave Approval' },
      { key: 'leave.balance', label: 'Leave Balance' },
    ],
  },
  {
    key: 'holidays', label: 'Holidays', submodules: [
      { key: 'holidays.records', label: 'Holiday Records' },
      { key: 'holidays.calendar', label: 'Holiday Calendar' },
    ],
  },
  {
    key: 'overtime', label: 'Overtime', submodules: [
      { key: 'overtime.records', label: 'Overtime Records' },
    ],
  },
  {
    key: 'advances', label: 'Advances', submodules: [
      { key: 'advances.records', label: 'Advance Records' },
    ],
  },
  {
    key: 'payroll', label: 'Payroll', submodules: [
      { key: 'payroll.salary', label: 'Salary Structure' },
      { key: 'payroll.generate', label: 'Generate Payroll' },
      { key: 'payroll.history', label: 'Payroll History' },
      { key: 'payroll.payslips', label: 'Payslips' },
    ],
  },
  {
    key: 'performance', label: 'Performance', submodules: [
      { key: 'performance.reviews', label: 'Performance Reviews' },
      { key: 'performance.goals', label: 'Goals & KPIs' },
    ],
  },
  { key: 'reports', label: 'Reports', submodules: [] },
  { key: 'settings', label: 'Settings', submodules: [] },
];

export const MANAGED_ROLES = ['HR', 'Manager', 'Employee'];

// CRUD + manage actions configurable per top-level module (mirrors backend).
export const ACTIONS = ['view', 'add', 'edit', 'delete', 'manage'];
export const ACTION_LABELS = {
  view: 'View', add: 'Add', edit: 'Edit', delete: 'Delete', manage: 'Manage',
};

// Flattened list of every permission key (modules + submodules).
export const ALL_PERMISSION_KEYS = MODULES.reduce((acc, m) => {
  acc.push(m.key);
  for (const s of m.submodules) acc.push(s.key);
  return acc;
}, []);

/**
 * Map an app route path to the permission key that gates it. Used by the route
 * guard. The most specific match wins.
 */
export const ROUTE_PERMISSION_MAP = {
  '/dashboard': 'dashboard',
  '/employees/list': 'employees.list',
  '/employees/add': 'employees.add',
  '/employees': 'employees',
  '/departments': 'departments.departments',
  '/roles': 'departments.roles',
  '/attendance/daily': 'attendance.daily',
  '/attendance/history': 'attendance.history',
  '/attendance/reports': 'attendance.reports',
  '/leave/requests': 'leave.requests',
  '/leave/apply': 'leave.apply',
  '/leave/approval': 'leave.approval',
  '/leave/balance': 'leave.balance',
  '/holidays/records': 'holidays.records',
  '/holidays/calendar': 'holidays.calendar',
  '/overtime/records': 'overtime.records',
  '/advances/records': 'advances.records',
  '/payroll/salary': 'payroll.salary',
  '/payroll/generate': 'payroll.generate',
  '/payroll/history': 'payroll.history',
  '/payroll/payslips': 'payroll.payslips',
  '/performance/reviews': 'performance.reviews',
  '/performance/goals': 'performance.goals',
  '/reports': 'reports',
  '/settings': 'settings',
};
