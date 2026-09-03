/**
 * Employee Chat Helper
 * Intent detection + direct data answers (no AI needed for simple queries).
 * Falls back to AI only for complex/analytical questions.
 */

const { getRelevantPolicies } = require('../data/companyPolicies');

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

// ── Intent detection ────────────────────────────────────────────────────────
const INTENTS = {
  performance:  /performance|rating|review|appraisal|score|stars?|kpi|goal/i,
  attendance:   /attendance|present|absent|late|check.?in|check.?out|working hours?|days? worked/i,
  leave:        /leave|vacation|time off|holiday|sick|casual|annual|balance|remaining/i,
  payroll:      /salary|pay(roll|slip|stub)?|wage|ctc|net pay|gross|deduction|allowance|bonus/i,
  profile:      /designation|position|department|manager|joining|employee id|who am i|my (name|role|profile)/i,
  policy:       /policy|notice period|wfh|work from home|how (do|can) i|procedure|rule/i,
};

const detectIntent = (q) => {
  const lower = q.toLowerCase();
  for (const [intent, re] of Object.entries(INTENTS)) {
    if (re.test(lower)) return intent;
  }
  return 'general';
};

// ── Direct answer builders (no AI) ─────────────────────────────────────────

const answerPerformance = (myPerformance, question) => {
  if (!myPerformance || myPerformance.length === 0) {
    return "I couldn't find any performance reviews for your account yet. Performance reviews will appear here once completed by your manager.";
  }
  const latest = myPerformance[0];
  const lines = [
    `Your current performance rating is ${latest.overallRating}/5 ⭐`,
    latest.reviewPeriod ? `\nReview period: ${latest.reviewPeriod}` : '',
    latest.reviewer ? `Reviewed by: ${latest.reviewer}` : '',
    latest.reviewDate ? `Review date: ${latest.reviewDate}` : '',
  ];
  if (latest.strengths) lines.push(`\n✅ Strengths:\n${latest.strengths}`);
  if (latest.improvements) lines.push(`\n🎯 Areas for improvement:\n${latest.improvements}`);
  if (latest.managerComments) lines.push(`\n💬 Manager feedback:\n"${latest.managerComments}"`);
  if (myPerformance.length > 1) {
    const avg = (myPerformance.reduce((s, r) => s + (r.overallRating || 0), 0) / myPerformance.length).toFixed(1);
    lines.push(`\nYou have ${myPerformance.length} total reviews with an average rating of ${avg}/5.`);
  }
  // Goals
  const goals = latest.goals && Array.isArray(latest.goals) ? latest.goals : [];
  if (goals.length > 0 && /goal/i.test(question)) {
    lines.push(`\n🎯 Current Goals (${goals.length}):`);
    goals.forEach(g => lines.push(`• ${g.title} — ${g.status || 'in progress'} (${g.progress || 0}%)`));
  }
  return lines.filter(Boolean).join('\n');
};

const answerAttendance = (myAttendance, question) => {
  if (!myAttendance || myAttendance.length === 0) {
    return "I couldn't find any attendance records for your account yet. Your attendance will appear here once marked.";
  }
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isMonthQuery = /this month|current month/i.test(question);
  const isLastMonth = /last month/i.test(question);

  let records = myAttendance;
  let label = 'Overall';

  if (isLastMonth) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    records = myAttendance.filter(a => (a.date || '').startsWith(lm));
    label = new Date(d).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  } else if (isMonthQuery || myAttendance.length > 0) {
    records = myAttendance.filter(a => (a.date || '').startsWith(currentMonth));
    label = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    if (records.length === 0) records = myAttendance; // fallback to all
  }

  const present = records.filter(a => a.status === 'present').length;
  const absent  = records.filter(a => a.status === 'absent').length;
  const late    = records.filter(a => a.late || a.status === 'late').length;
  const onLeave = records.filter(a => a.status === 'leave').length;
  const totalHrs = records.reduce((s, a) => s + (Number(a.hours) || 0), 0).toFixed(1);
  const total = records.length;
  const rate = total > 0 ? ((present / total) * 100).toFixed(0) : 0;

  return [
    `Your attendance for ${label}:`,
    ``,
    `• Present: ${present} day${present !== 1 ? 's' : ''}`,
    `• Absent: ${absent} day${absent !== 1 ? 's' : ''}`,
    `• Late arrivals: ${late}`,
    `• On leave: ${onLeave} day${onLeave !== 1 ? 's' : ''}`,
    `• Total hours worked: ${totalHrs}h`,
    `• Attendance rate: ${rate}%`,
  ].join('\n');
};

const answerLeave = (myLeave, question) => {
  const approved = (myLeave || []).filter(l => l.status === 'approved');
  const pending  = (myLeave || []).filter(l => l.status === 'pending');

  const TOTALS = { 'Annual Leave': 18, 'Sick Leave': 10, 'Casual Leave': 6 };
  const used = {};
  for (const type of Object.keys(TOTALS)) {
    used[type] = approved.filter(l => l.leaveType === type).reduce((s, l) => s + (l.days || 0), 0);
  }

  // Pending detail
  if (/pending|status|why/i.test(question) && pending.length > 0) {
    const lines = [`You have ${pending.length} pending leave request${pending.length > 1 ? 's' : ''}:\n`];
    pending.forEach(r => {
      lines.push(`• ${r.leaveType} — ${r.startDate} to ${r.endDate} (${r.days} day${r.days !== 1 ? 's' : ''})`);
      lines.push(`  Request ID: ${r.id} | Applied: ${r.appliedDate || 'N/A'}`);
      lines.push(`  Status: Awaiting manager approval. No rejection reason as it has not been reviewed yet.`);
    });
    return lines.join('\n');
  }

  const lines = ['Your current leave balance:\n'];
  for (const [type, total] of Object.entries(TOTALS)) {
    const remaining = total - (used[type] || 0);
    lines.push(`• ${type}: ${remaining} days remaining (${used[type] || 0} used of ${total})`);
  }
  const totalRemaining = Object.entries(TOTALS).reduce((s, [t, tot]) => s + tot - (used[t] || 0), 0);
  lines.push(`\nTotal remaining: ${totalRemaining} days`);
  if (pending.length > 0) lines.push(`\n⏳ You have ${pending.length} pending leave request${pending.length > 1 ? 's' : ''} awaiting approval.`);
  return lines.join('\n');
};

const answerPayroll = (myPayroll, question) => {
  if (!myPayroll || myPayroll.length === 0) {
    return "I couldn't find any payroll records for your account yet. Payslips will appear here once generated by HR.";
  }
  const latest = myPayroll[myPayroll.length - 1];
  const gross = (latest.basic || 0) + (latest.hra || 0) + (latest.allowances || 0) + (latest.bonus || 0);
  const deductions = (latest.tax || 0) + (latest.insurance || 0) + (latest.otherDeductions || 0);
  const net = gross - deductions;

  const lines = [
    `Your latest payslip is for ${latest.month || ''} ${latest.year || ''}.\n`,
    `💰 Salary Breakdown:`,
    `• Basic Salary: ₹${fmt(latest.basic)}`,
  ];
  if (latest.hra)        lines.push(`• HRA: ₹${fmt(latest.hra)}`);
  if (latest.allowances) lines.push(`• Allowances: ₹${fmt(latest.allowances)}`);
  if (latest.bonus)      lines.push(`• Bonus: ₹${fmt(latest.bonus)}`);
  lines.push(`• Gross Salary: ₹${fmt(gross)}`);
  lines.push(`\n📉 Deductions:`);
  if (latest.tax)             lines.push(`• Tax (TDS): ₹${fmt(latest.tax)}`);
  if (latest.insurance)       lines.push(`• Insurance: ₹${fmt(latest.insurance)}`);
  if (latest.otherDeductions) lines.push(`• Other: ₹${fmt(latest.otherDeductions)}`);
  lines.push(`• Total Deductions: ₹${fmt(deductions)}`);
  lines.push(`\n✅ Net Salary: ₹${fmt(net)}`);
  if (latest.status) lines.push(`Payment Status: ${latest.status}`);
  if (latest.paymentDate) lines.push(`Payment Date: ${latest.paymentDate}`);
  lines.push(`\nTo view/download your payslip, go to My Payroll → Payslip tab.`);
  return lines.join('\n');
};

const answerProfile = (currentUser, userProfile) => {
  const lines = [`Your profile:\n`];
  lines.push(`• Name: ${currentUser.name}`);
  lines.push(`• Employee ID: ${currentUser.id}`);
  lines.push(`• Email: ${currentUser.email}`);
  if (currentUser.designation || userProfile.designation) lines.push(`• Designation: ${currentUser.designation || userProfile.designation}`);
  if (currentUser.department || userProfile.department)   lines.push(`• Department: ${currentUser.department || userProfile.department}`);
  if (currentUser.role)       lines.push(`• Role: ${currentUser.role}`);
  if (userProfile.manager)    lines.push(`• Manager: ${userProfile.manager}`);
  if (userProfile.joiningDate || currentUser.joiningDate) {
    const jd = userProfile.joiningDate || currentUser.joiningDate;
    lines.push(`• Date of Joining: ${jd}`);
  }
  if (userProfile.employmentType) lines.push(`• Employment Type: ${userProfile.employmentType}`);
  return lines.join('\n');
};

// ── Main resolver ───────────────────────────────────────────────────────────
const resolveDirectAnswer = (question, currentUser, context) => {
  const {
    myAttendance = [],
    myLeave = [],
    myPayroll = [],
    myPerformance = [],
    userProfile = {},
  } = context;

  const intent = detectIntent(question);

  // Security: block cross-employee queries
  const crossEmployeePattern = /\b(rahul|john|alice|bob|ravi|priya|other employee|colleague|coworker|teammate)\b.*(salary|pay|attendance|leave|performance|data)/i;
  if (crossEmployeePattern.test(question) || /all employees/i.test(question)) {
    return "Sorry, I can only provide information that you are authorized to access. I can only answer questions about your own profile, attendance, leave, payroll, and performance.";
  }

  switch (intent) {
    case 'performance': return answerPerformance(myPerformance, question);
    case 'attendance':  return answerAttendance(myAttendance, question);
    case 'leave':       return answerLeave(myLeave, question);
    case 'payroll':     return answerPayroll(myPayroll, question);
    case 'profile':     return answerProfile(currentUser, userProfile);
    case 'policy': {
      const policies = getRelevantPolicies(question, 2);
      if (policies.length === 0) return null; // let AI handle or return not-found
      return null; // let AI handle policy questions with full context
    }
    default: return null; // let AI handle general/analytical questions
  }
};

module.exports = { resolveDirectAnswer, detectIntent };
