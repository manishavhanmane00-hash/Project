import React from 'react';

const statusConfig = {
  active: { label: 'Active', cls: 'badge-success' },
  inactive: { label: 'Inactive', cls: 'badge-gray' },
  'on-leave': { label: 'On Leave', cls: 'badge-warning' },
  pending: { label: 'Pending', cls: 'badge-warning' },
  approved: { label: 'Approved', cls: 'badge-success' },
  rejected: { label: 'Rejected', cls: 'badge-danger' },
  present: { label: 'Present', cls: 'badge-success' },
  absent: { label: 'Absent', cls: 'badge-danger' },
  late: { label: 'Late', cls: 'badge-warning' },
  leave: { label: 'On Leave', cls: 'badge-info' },
  'half-day': { label: 'Half Day', cls: 'badge-orange' },
  generated: { label: 'Generated', cls: 'badge-info' },
  processing: { label: 'Processing', cls: 'badge-warning' },
  paid: { label: 'Paid', cls: 'badge-success' },
  completed: { label: 'Completed', cls: 'badge-success' },
  'in-progress': { label: 'In Progress', cls: 'badge-info' },
  'full-time': { label: 'Full-time', cls: 'badge-primary' },
  'part-time': { label: 'Part-time', cls: 'badge-purple' },
  contract: { label: 'Contract', cls: 'badge-orange' },
  intern: { label: 'Intern', cls: 'badge-teal' },
  admin: { label: 'Admin', cls: 'badge-primary' },
  hr: { label: 'HR', cls: 'badge-purple' },
  manager: { label: 'Manager', cls: 'badge-info' },
  employee: { label: 'Employee', cls: 'badge-gray' },
};

const Badge = ({ status, label, variant, dot = true, className = '' }) => {
  const key = (status || '').toLowerCase();
  const config = statusConfig[key] || { label: label || status || '', cls: variant || 'badge-gray' };
  const displayLabel = label || config.label;
  const cls = variant || config.cls;

  return (
    <span className={`badge ${cls} ${className}`}>
      {dot && <span className="badge-dot" />}
      {displayLabel}
    </span>
  );
};

export default Badge;
