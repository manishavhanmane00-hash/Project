import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Download, Mail, Phone, MapPin, Calendar, Briefcase, Building2, Star, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import { formatINR } from '../../utils/currency';

const TABS = ['Personal Info', 'Employment', 'Attendance', 'Leave', 'Payroll', 'Performance', 'Documents'];

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
    <span style={{ width: 180, flexShrink: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{value || '—'}</span>
  </div>
);

const StatMini = ({ label, value, color = 'var(--primary)' }) => (
  <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
    <div style={{ fontSize: '1.4rem', fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
  </div>
);

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { employees, attendanceData, leaveRequests, payrollData, performanceReviews } = useApp();
  const [activeTab, setActiveTab] = useState(0);

  const emp = employees.find(e => e._id === id || e._id?.toString() === id);
  if (!emp) return (
    <div className="empty-state">
      <div className="empty-state-title">Employee not found</div>
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/employees/list')}>Back to List</button>
    </div>
  );

  // Match by _id, email, or userId — all are stored on attendance/leave/payroll/performance records
  const matchEmp = (record) =>
    record.employeeId === emp._id?.toString() ||
    record.employeeId === emp._id ||
    record.email      === emp.email;

  const empAttendance = attendanceData.filter(matchEmp);
  const empLeave      = leaveRequests.filter(matchEmp);
  const empPayroll    = payrollData.filter(matchEmp);
  const empPerf       = performanceReviews.filter(matchEmp);

  const gross = (emp.salary || 0) + (emp.hra || 0) + (emp.allowances || 0) + (emp.bonus || 0);
  const net   = gross - (emp.deductions || 0);

  // Derive current rating from latest performance review
  const latestReview   = empPerf.sort((a, b) => (b.reviewDate || '').localeCompare(a.reviewDate || ''))[0] || null;
  const currentRating  = latestReview ? `${latestReview.overallRating}/5` : 'N/A';
  const lastReviewDate = latestReview?.reviewDate || null;

  const empIdDisplay = String(emp._id || '').slice(-8).toUpperCase();

  const tabs = {
    'Personal Info': (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Personal Details</h4>
          <InfoRow label="Full Name"       value={emp.name}     />
          <InfoRow label="Date of Birth"   value={emp.dob}      />
          <InfoRow label="Gender"          value={emp.gender}   />
          <InfoRow label="Email"           value={emp.email}    />
          <InfoRow label="Phone"           value={emp.phone}    />
          <InfoRow label="Alternate Phone" value={emp.altPhone} />
        </div>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Address</h4>
          <InfoRow label="Street Address" value={emp.address} />
          <InfoRow label="City"           value={emp.city}    />
          <InfoRow label="State"          value={emp.state}   />
          <InfoRow label="Country"        value={emp.country} />
          <InfoRow label="Postal Code"    value={emp.postal}  />
        </div>
      </div>
    ),
    'Employment': (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Employment Details</h4>
          <InfoRow label="Employee ID"     value={empIdDisplay}       />
          <InfoRow label="Department"      value={emp.department}     />
          <InfoRow label="Designation"     value={emp.designation || emp.position} />
          <InfoRow label="Manager"         value={emp.manager}        />
          <InfoRow label="Joining Date"    value={emp.joiningDate}    />
          <InfoRow label="Employment Type" value={emp.employmentType} />
          <InfoRow label="Work Location"   value={emp.workLocation}   />
          <InfoRow label="Probation Period"value={emp.probation}      />
          <InfoRow label="Status"          value={<Badge status={emp.status} />} />
        </div>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Skills</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(emp.skills || []).length > 0
              ? emp.skills.map(s => <span key={s} className="badge badge-primary">{s}</span>)
              : <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No skills listed</span>}
          </div>
        </div>
      </div>
    ),
    'Attendance': (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatMini label="Present Days"  value={empAttendance.filter(a => a.status === 'present').length} color="var(--success)" />
          <StatMini label="Absent Days"   value={empAttendance.filter(a => a.status === 'absent').length}  color="var(--danger)"  />
          <StatMini label="Late Days"     value={empAttendance.filter(a => a.late).length}                 color="var(--warning)" />
          <StatMini label="Attendance %"  value={empAttendance.length > 0
            ? `${Math.round((empAttendance.filter(a => a.status === 'present').length / empAttendance.length) * 100)}%`
            : 'N/A'} color="var(--primary)" />
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
            </thead>
            <tbody>
              {empAttendance.length > 0
                ? empAttendance
                    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                    .map((a, i) => (
                    <tr key={a._id || i}>
                      <td>{a.date}</td>
                      <td>{a.checkIn  || '—'}</td>
                      <td>{a.checkOut || '—'}</td>
                      <td>{a.hours ? `${a.hours}h` : '—'}</td>
                      <td><Badge status={a.status} /></td>
                    </tr>
                  ))
                : <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No attendance records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    ),
    'Leave': (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatMini label="Total Requests" value={empLeave.length} />
          <StatMini label="Approved"  value={empLeave.filter(l => l.status === 'approved').length} color="var(--success)" />
          <StatMini label="Pending"   value={empLeave.filter(l => l.status === 'pending').length}  color="var(--warning)" />
          <StatMini label="Rejected"  value={empLeave.filter(l => l.status === 'rejected').length} color="var(--danger)"  />
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Applied</th><th>Status</th></tr>
            </thead>
            <tbody>
              {empLeave.length > 0
                ? empLeave.map(l => (
                  <tr key={l._id || l.id}>
                    <td>{l.leaveType}</td>
                    <td>{l.startDate}</td>
                    <td>{l.endDate}</td>
                    <td>{l.days}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l.appliedDate || '—'}</td>
                    <td><Badge status={l.status} /></td>
                  </tr>
                ))
                : <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No leave records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    ),
    'Payroll': (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatMini label="Basic Salary"   value={formatINR(emp.salary || 0)}    />
          <StatMini label="Gross Salary"   value={formatINR(gross)}               color="var(--info)"    />
          <StatMini label="Deductions"     value={formatINR(emp.deductions || 0)} color="var(--danger)"  />
          <StatMini label="Net Salary"     value={formatINR(net)}                 color="var(--success)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Salary Components (₹ INR / year)</h4>
            <InfoRow label="Basic Salary"    value={formatINR(emp.salary || 0)}      />
            <InfoRow label="HRA"             value={formatINR(emp.hra || 0)}          />
            <InfoRow label="Allowances"      value={formatINR(emp.allowances || 0)}   />
            <InfoRow label="Bonus"           value={formatINR(emp.bonus || 0)}        />
            <InfoRow label="Deductions"      value={`−${formatINR(emp.deductions || 0)}`} />
            <InfoRow label="Payment Method"  value={emp.paymentMethod}               />
            <InfoRow label="Bank"            value={emp.bankName}                    />
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Payroll History</h4>
            {empPayroll.length > 0
              ? empPayroll
                  .sort((a, b) => `${b.year}${b.month}`.localeCompare(`${a.year}${a.month}`))
                  .map(p => {
                    const pNet = (p.basic||0)+(p.hra||0)+(p.allowances||0)+(p.bonus||0)-(p.tax||0)-(p.insurance||0)-(p.otherDeductions||0);
                    return (
                      <div key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.875rem' }}>{p.month} {p.year}</span>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatINR(pNet)}</span>
                          <Badge status={p.status} />
                        </div>
                      </div>
                    );
                  })
              : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No payroll records yet</p>}
          </div>
        </div>
      </div>
    ),
    'Performance': (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatMini label="Current Rating" value={currentRating}       color="var(--warning)" />
          <StatMini label="Reviews Done"   value={empPerf.length}      />
          <StatMini label="Last Review"    value={lastReviewDate || 'N/A'} color="var(--info)" />
        </div>
        {empPerf.length > 0
          ? empPerf
              .sort((a, b) => (b.reviewDate || '').localeCompare(a.reviewDate || ''))
              .map(rev => (
              <div key={rev._id || rev.id} className="card" style={{ marginBottom: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{rev.reviewPeriod}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Reviewed by {rev.reviewer} on {rev.reviewDate}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={16}
                        fill={s <= rev.overallRating ? '#f59e0b' : 'none'}
                        color={s <= rev.overallRating ? '#f59e0b' : 'var(--border)'} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {rev.strengths && (
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.8rem', marginBottom: 6 }}>Strengths</div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rev.strengths}</p>
                    </div>
                  )}
                  {rev.improvements && (
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.8rem', marginBottom: 6 }}>Areas for Improvement</div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rev.improvements}</p>
                    </div>
                  )}
                </div>
                {rev.managerComments && (
                  <div style={{ marginTop: 12, padding: '12px', background: 'var(--bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: 4 }}>Manager Comments</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rev.managerComments}</p>
                  </div>
                )}
              </div>
            ))
          : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No performance reviews yet</p>}
      </div>
    ),
    'Documents': (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {['Resume / CV', 'ID Proof', 'Address Proof', 'Education Certificate', 'Offer Letter'].map(doc => (
            <div key={doc} className="file-item">
              <div style={{ width: 36, height: 36, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={14} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{doc}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Contact HR to manage documents</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm">View</button>
                <button className="btn btn-outline btn-sm"><Download size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate('/employees/list')}>
            Employees
          </span>
          <span className="breadcrumb-sep">/</span>
          <span>{emp.name}</span>
        </div>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{
          padding: '32px 32px 24px',
          background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--surface) 100%)',
          borderRadius: '14px 14px 0 0',
        }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <Avatar name={emp.name} size="2xl" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>{emp.name}</h2>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{emp.designation || emp.position}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge status={emp.status} />
                    {emp.employmentType && <Badge label={emp.employmentType} dot={false} variant="badge-primary" />}
                    {latestReview && (
                      <span className="badge badge-warning">⭐ {latestReview.overallRating}/5</span>
                    )}
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/employees/edit/${emp._id}`)}>
                  <Edit2 size={14} /> Edit Profile
                </button>
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
                {[
                  { icon: Briefcase, text: empIdDisplay },
                  { icon: Building2, text: emp.department },
                  { icon: Mail,      text: emp.email },
                  { icon: Phone,     text: emp.phone },
                  emp.workLocation && { icon: MapPin, text: emp.workLocation },
                  emp.joiningDate  && { icon: Calendar, text: `Joined: ${emp.joiningDate}` },
                ].filter(Boolean).map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Icon size={13} /> {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="tabs" style={{ padding: '0 24px' }}>
          {TABS.map((t, i) => (
            <div key={t} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
              {t}
            </div>
          ))}
        </div>
        <div className="card-body">
          {tabs[TABS[activeTab]]}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
