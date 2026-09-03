/**
 * Company HR Policy Knowledge Base
 * Used by the RAG-style company policy AI feature.
 * Each entry is a policy "document" with a topic, keywords, and content.
 *
 * Admins can expand this file to add more policies without touching any other code.
 * If a policy is absent, the AI will say so instead of hallucinating.
 */

const COMPANY_POLICIES = [
  {
    topic: 'leave_policy',
    keywords: ['leave', 'vacation', 'annual leave', 'sick leave', 'casual leave', 'time off', 'holiday'],
    title: 'Leave Policy',
    content: `
Company Leave Policy:
- Annual Leave: 18 days per year. Can be carried forward up to 5 days to the next year.
- Sick Leave: 10 days per year. Medical certificate required for sick leave exceeding 2 consecutive days.
- Casual Leave: 6 days per year. Cannot be carried forward.
- Maternity Leave: 182 days (26 weeks) as per the Maternity Benefit Act.
- Paternity Leave: 15 days within the first 6 months of child birth/adoption.
- Compensatory Off: 5 days per year for working on holidays.
- Half-day leave is permitted for all leave types.
- Leave must be applied at least 2 working days in advance (except sick leave).
- All leave requests require manager/HR approval.
- Leave balance is reset at the start of each fiscal year (April 1st).
    `.trim(),
  },
  {
    topic: 'working_hours',
    keywords: ['working hours', 'office hours', 'work time', 'schedule', 'shift', 'timing', 'clock in', 'check in'],
    title: 'Working Hours Policy',
    content: `
Working Hours Policy:
- Standard work hours: 9:00 AM to 6:00 PM, Monday to Friday.
- Total working hours per day: 9 hours (including 1 hour lunch break).
- Net working hours: 8 hours per day.
- Late arrival threshold: 15 minutes after 9:00 AM is marked as late.
- Half-day is considered less than 4 hours of work.
- Overtime: Any work beyond 8 hours per day is considered overtime.
- Working from home (WFH) follows the same working hours.
- Saturday and Sunday are official holidays.
- Employees working on weekends/public holidays are eligible for compensatory off.
    `.trim(),
  },
  {
    topic: 'notice_period',
    keywords: ['notice period', 'resignation', 'quit', 'leaving', 'last working day', 'exit', 'terminate'],
    title: 'Notice Period Policy',
    content: `
Notice Period Policy:
- Probation employees (during probation period): 1 month notice period.
- Confirmed employees with less than 2 years: 1 month notice period.
- Confirmed employees with 2–5 years of service: 2 months notice period.
- Confirmed employees with more than 5 years: 3 months notice period.
- Notice period can be bought out by the employee or waived by management.
- Garden leave may be applied during the notice period.
- Full and final settlement will be completed within 45 days of the last working day.
- All company assets (laptop, ID card, access cards) must be returned on the last working day.
    `.trim(),
  },
  {
    topic: 'apply_leave',
    keywords: ['how to apply', 'apply for leave', 'leave application', 'submit leave', 'request leave'],
    title: 'How to Apply for Leave',
    content: `
How to Apply for Leave (Step-by-step):
1. Log in to the Employee Portal at the company EMS system.
2. Click on "My Leave" in the left sidebar.
3. Go to the "Apply Leave" tab.
4. Select the leave type (Annual, Sick, Casual, etc.).
5. Choose the start date and end date.
6. Enter the reason for leave in the Reason field.
7. Attach a supporting document if required (e.g., medical certificate for sick leave).
8. Click "Submit Leave Request".
9. Your request will be sent to your manager for approval.
10. You will receive a notification once your leave is approved or rejected.
    `.trim(),
  },
  {
    topic: 'payslip',
    keywords: ['payslip', 'salary slip', 'download payslip', 'pay stub', 'salary certificate', 'payroll slip'],
    title: 'How to Access Payslips',
    content: `
How to Download Your Payslip:
1. Log in to the Employee Portal.
2. Click on "My Payroll" in the left sidebar.
3. Go to the "Payslip" tab.
4. Select the month and year from the dropdown.
5. Click "Print" to print the payslip, or "Download PDF" to save it.
Payslips are generated on the 28th of each month after payroll is processed.
You will receive a notification when your payslip is ready.
    `.trim(),
  },
  {
    topic: 'attendance_policy',
    keywords: ['attendance', 'absent', 'present', 'attendance policy', 'biometric', 'mark attendance', 'late'],
    title: 'Attendance Policy',
    content: `
Attendance Policy:
- Employees must check in by 9:00 AM and check out after 6:00 PM.
- Arriving after 9:15 AM is marked as "Late Arrival".
- More than 3 consecutive late arrivals may result in a formal warning.
- Absence without notification must be followed by a formal explanation.
- More than 3 unplanned absences in a month will trigger a discussion with HR.
- Attendance is tracked through the Employee Portal check-in/check-out system.
- Employees on approved leave will be marked as "On Leave" (not absent).
- WFH employees follow the same attendance rules.
- Monthly attendance reports are reviewed by managers.
    `.trim(),
  },
  {
    topic: 'work_from_home',
    keywords: ['work from home', 'wfh', 'remote work', 'remote', 'hybrid', 'home office', 'telecommute'],
    title: 'Work from Home (WFH) Policy',
    content: `
Work From Home (WFH) Policy:
- WFH is available to confirmed employees (post-probation) based on role and department approval.
- Maximum WFH days: Up to 2 days per week (subject to manager approval).
- Employees must be reachable during standard working hours (9 AM – 6 PM) while on WFH.
- WFH attendance is logged through the Employee Portal like regular check-in/check-out.
- WFH requests should be communicated to the manager at least 1 day in advance.
- Certain roles (e.g., on-site operations) are not eligible for WFH.
- WFH eligibility can be reviewed and revised by management based on performance.
    `.trim(),
  },
  {
    topic: 'salary_structure',
    keywords: ['salary', 'ctc', 'compensation', 'pay structure', 'deductions', 'tds', 'pf', 'hra', 'allowance'],
    title: 'Salary & Compensation Structure',
    content: `
Salary & Compensation Structure:
- Salaries are paid on the 28th of every month via bank transfer (NEFT/IMPS).
- Salary structure includes: Basic Salary, HRA (House Rent Allowance), Other Allowances, Performance Bonus.
- Deductions include: TDS (Income Tax at 10%), Provident Fund (12% of basic), Health Insurance (2% of basic).
- Net salary = Gross (Basic + HRA + Allowances + Bonus) minus all deductions.
- Annual salary is divided by 12 for monthly disbursement.
- Payslips are available on the 28th of each month in the Employee Portal under "My Payroll".
- For salary queries, contact HR or raise a ticket through the portal.
    `.trim(),
  },
  {
    topic: 'code_of_conduct',
    keywords: ['code of conduct', 'behavior', 'ethics', 'misconduct', 'disciplinary', 'rules', 'harassment', 'policy'],
    title: 'Code of Conduct',
    content: `
Code of Conduct:
- All employees are expected to maintain professional behavior and respect for colleagues.
- Workplace harassment, discrimination, or bullying of any kind will not be tolerated.
- Confidential company information must not be shared outside the organization.
- Employees should avoid conflicts of interest and disclose any potential conflicts to HR.
- Use of company resources (laptops, software, internet) should be for work purposes only.
- Dress code: Business casual or as specified by the department head.
- Social media: Employees should not post confidential company information on social media.
- Disciplinary action will follow a written warning, final warning, then termination process.
    `.trim(),
  },
  {
    topic: 'performance_review',
    keywords: ['performance review', 'appraisal', 'evaluation', 'rating', 'kpi', 'goals', 'feedback', 'increment', 'hike'],
    title: 'Performance Review & Appraisal Policy',
    content: `
Performance Review & Appraisal Policy:
- Performance reviews are conducted quarterly (Q1, Q2, Q3, Q4) and annually.
- Annual appraisals determine salary increments, promotions, and bonuses.
- Rating scale: 1 (Poor) to 5 (Excellent).
- Reviews assess: Overall Performance, Goals Achievement, KPIs, Teamwork, Communication.
- Employees receive feedback from their direct manager and can provide self-assessment.
- Performance Improvement Plans (PIPs) may be initiated for employees rated 1–2 consistently.
- Salary increments are processed after the annual review (typically in April, start of fiscal year).
- Promotions are based on performance, tenure, and business need.
    `.trim(),
  },
];

/**
 * Retrieve relevant policies based on a user question using simple keyword matching.
 * This is a lightweight RAG (Retrieval-Augmented Generation) approach.
 * For production, replace with a proper vector store (e.g., Pinecone, pgvector).
 *
 * @param {string} question - The user's question
 * @param {number} maxResults - Maximum number of policies to return
 * @returns {Array} - Matching policy objects
 */
const getRelevantPolicies = (question, maxResults = 3) => {
  if (!question) return [];

  const lowerQ = question.toLowerCase();

  // Score each policy by keyword matches
  const scored = COMPANY_POLICIES.map(policy => {
    let score = 0;
    for (const keyword of policy.keywords) {
      if (lowerQ.includes(keyword.toLowerCase())) {
        // Exact phrase match gets higher score
        score += keyword.split(' ').length > 1 ? 3 : 1;
      }
    }
    return { ...policy, score };
  });

  // Sort by score desc, filter out zero-score unless nothing matched
  const matches = scored.filter(p => p.score > 0).sort((a, b) => b.score - a.score);
  return matches.slice(0, maxResults);
};

module.exports = { COMPANY_POLICIES, getRelevantPolicies };
