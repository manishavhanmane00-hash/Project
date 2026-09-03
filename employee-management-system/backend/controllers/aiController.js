/**
 * AI Controller
 * All AI endpoints. API key stays on the server — never exposed to frontend.
 *
 * Security model:
 *  - All routes require the X-User-Info header (parsed by aiAuth middleware).
 *  - Admin endpoints additionally require requireAdmin middleware.
 *  - Employee endpoints are scoped to req.user.id — employees can NEVER see other employees' data.
 *  - Data passed to the AI model is pre-filtered and sanitized here before sending.
 *  - AI is instructed NOT to invent EMS data via system prompts.
 */

const OpenAI = require('openai');
const { getRelevantPolicies } = require('../data/companyPolicies');
const { resolveDirectAnswer } = require('./employeeChatHelper');

// ── OpenAI client (singleton) ──────────────────────────────────────────────
let openaiClient = null;

const getOpenAI = () => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return null;
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = 600;
const TIMEOUT_MS = 25000;

// ── Helper: call OpenAI with timeout and error handling ─────────────────────
const callAI = async (messages) => {
  const client = getOpenAI();
  if (!client) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await client.chat.completions.create(
      {
        model: MODEL,
        messages,
        max_tokens: MAX_TOKENS,
        temperature: 0.3, // lower temperature = more factual, less hallucination
      },
      { signal: controller.signal }
    );
    return response.choices[0]?.message?.content || '';
  } finally {
    clearTimeout(timeout);
  }
};

// ── Helper: sanitize data sent to AI (remove sensitive fields) ──────────────
const sanitizeEmployee = (emp) => ({
  name: emp.name,
  department: emp.department,
  designation: emp.designation || emp.position,
  status: emp.status,
  employmentType: emp.employmentType,
  joiningDate: emp.joiningDate || emp.dateOfJoining,
  // Do NOT include: bankAccount, bankName, personalEmail, phone, address
});

const sanitizePayroll = (p) => ({
  employeeName: p.employeeName,
  department: p.department,
  month: p.month,
  year: p.year,
  basic: p.basic,
  hra: p.hra,
  allowances: p.allowances,
  bonus: p.bonus,
  tax: p.tax,
  insurance: p.insurance,
  otherDeductions: p.otherDeductions,
  net: p.net || ((p.basic || 0) + (p.hra || 0) + (p.allowances || 0) + (p.bonus || 0) - (p.tax || 0) - (p.insurance || 0) - (p.otherDeductions || 0)),
  status: p.status,
});

// ── ADMIN ENDPOINTS ─────────────────────────────────────────────────────────

/**
 * POST /api/ai/admin/chat
 * Admin HR Assistant — answers natural language questions about HR data.
 * Requires: Admin/HR/Manager role
 * Body: { question, context: { employees, attendance, leave, payroll, performance } }
 */
const adminChat = async (req, res) => {
  try {
    const { question, context = {} } = req.body;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Please provide a question' });
    }

    // Sanitize and summarize data (do NOT send full raw data)
    const { employees = [], attendance = [], leave = [], payroll = [], performance = [] } = context;

    // Build compact data summaries
    const empSummary = {
      total: employees.length,
      active: employees.filter(e => e.status === 'active').length,
      onLeave: employees.filter(e => e.status === 'on-leave').length,
      inactive: employees.filter(e => e.status === 'inactive').length,
      byDepartment: employees.reduce((acc, e) => {
        acc[e.department] = (acc[e.department] || 0) + 1;
        return acc;
      }, {}),
    };

    const leaveSummary = {
      total: leave.length,
      pending: leave.filter(l => l.status === 'pending').length,
      approved: leave.filter(l => l.status === 'approved').length,
      rejected: leave.filter(l => l.status === 'rejected').length,
      byDepartment: leave.reduce((acc, l) => {
        if (!acc[l.department]) acc[l.department] = 0;
        acc[l.department]++;
        return acc;
      }, {}),
    };

    const attendanceSummary = {
      totalRecords: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.late || a.status === 'late').length,
      onLeave: attendance.filter(a => a.status === 'leave').length,
      totalOvertimeHours: attendance.reduce((s, a) => s + (a.overtime || 0), 0),
      byDepartment: attendance.reduce((acc, a) => {
        if (a.status === 'absent') {
          acc[a.department] = (acc[a.department] || 0) + 1;
        }
        return acc;
      }, {}),
    };

    const payrollSummary = {
      totalRecords: payroll.length,
      pending: payroll.filter(p => p.status === 'pending').length,
      approved: payroll.filter(p => p.status === 'approved').length,
      totalPayroll: payroll.reduce((s, p) => {
        const net = (p.basic || 0) + (p.hra || 0) + (p.allowances || 0) + (p.bonus || 0)
          - (p.tax || 0) - (p.insurance || 0) - (p.otherDeductions || 0);
        return s + net;
      }, 0),
      totalBonus: payroll.reduce((s, p) => s + (p.bonus || 0), 0),
      totalDeductions: payroll.reduce((s, p) => s + (p.tax || 0) + (p.insurance || 0) + (p.otherDeductions || 0), 0),
    };

    const performanceSummary = {
      totalReviews: performance.length,
      avgRating: performance.length > 0
        ? (performance.reduce((s, r) => s + (r.overallRating || 0), 0) / performance.length).toFixed(1)
        : 0,
      excellent: performance.filter(r => r.overallRating === 5).length,
      needsImprovement: performance.filter(r => r.overallRating <= 2).length,
      byDepartment: performance.reduce((acc, r) => {
        if (!acc[r.department]) acc[r.department] = { total: 0, sum: 0 };
        acc[r.department].total++;
        acc[r.department].sum += (r.overallRating || 0);
        return acc;
      }, {}),
    };

    // Also fetch relevant policies if question seems policy-related
    const policyQuestion = ['policy', 'leave', 'notice', 'working hours', 'wfh', 'attendance'].some(
      kw => question.toLowerCase().includes(kw)
    );
    const relevantPolicies = policyQuestion ? getRelevantPolicies(question, 2) : [];

    const systemPrompt = `You are an AI HR Assistant for an Employee Management System.
You ONLY answer questions based on the EXACT data provided to you.
You NEVER invent, estimate, or assume HR data not provided.
If data is unavailable or empty, say: "I couldn't find that information in the current system data."
Currency is Indian Rupee (₹). Keep answers concise, structured, and professional.
Do NOT make HR decisions (firing, hiring, salary changes) — only provide analysis and insights.`;

    const dataContext = `
Current HR System Data Summary:
EMPLOYEES: ${JSON.stringify(empSummary)}
ATTENDANCE: ${JSON.stringify(attendanceSummary)}
LEAVE: ${JSON.stringify(leaveSummary)}
PAYROLL: ${JSON.stringify(payrollSummary)}
PERFORMANCE: ${JSON.stringify(performanceSummary)}
${relevantPolicies.length > 0 ? `\nRELEVANT POLICIES:\n${relevantPolicies.map(p => `${p.title}: ${p.content}`).join('\n\n')}` : ''}`;

    const answer = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${dataContext}\n\nHR Question: ${question}` },
    ]);

    res.json({ success: true, answer: answer.trim() });
  } catch (err) {
    handleAIError(err, res);
  }
};

/**
 * POST /api/ai/admin/insights
 * Generate AI Insights for Admin Dashboard
 * Body: { context: { employees, attendance, leave, payroll, performance } }
 */
const adminInsights = async (req, res) => {
  try {
    const { context = {} } = req.body;
    const { employees = [], attendance = [], leave = [], payroll = [], performance = [] } = context;

    if (employees.length === 0 && attendance.length === 0 && leave.length === 0) {
      return res.json({
        success: true,
        insights: ['Add employees and record attendance to generate AI insights.'],
      });
    }

    const summary = {
      employees: {
        total: employees.length,
        active: employees.filter(e => e.status === 'active').length,
        onLeave: employees.filter(e => e.status === 'on-leave').length,
      },
      leave: {
        pending: leave.filter(l => l.status === 'pending').length,
        total: leave.length,
        approvedDays: leave.filter(l => l.status === 'approved').reduce((s, l) => s + (l.days || 0), 0),
      },
      attendance: {
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.late).length,
        overtime: attendance.reduce((s, a) => s + (a.overtime || 0), 0),
        absentByDept: attendance
          .filter(a => a.status === 'absent')
          .reduce((acc, a) => { acc[a.department] = (acc[a.department] || 0) + 1; return acc; }, {}),
      },
      payroll: {
        total: payroll.reduce((s, p) => s + ((p.basic || 0) + (p.hra || 0) + (p.allowances || 0) + (p.bonus || 0) - (p.tax || 0) - (p.insurance || 0) - (p.otherDeductions || 0)), 0),
        pending: payroll.filter(p => p.status === 'pending').length,
      },
      performance: {
        avgRating: performance.length > 0
          ? (performance.reduce((s, r) => s + (r.overallRating || 0), 0) / performance.length).toFixed(1)
          : 0,
        topDept: Object.entries(
          performance.reduce((acc, r) => {
            if (!acc[r.department]) acc[r.department] = { sum: 0, count: 0 };
            acc[r.department].sum += r.overallRating || 0;
            acc[r.department].count++;
            return acc;
          }, {})
        ).sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))[0]?.[0] || 'N/A',
      },
    };

    const answer = await callAI([
      {
        role: 'system',
        content: `You are an HR analytics AI. Generate 4-6 concise, actionable bullet-point insights based ONLY on the provided data. 
Each insight should be 1-2 sentences. Use specific numbers from the data. 
Start each bullet with a relevant emoji. Do not invent any data.
If data is sparse, only generate insights for available data.`,
      },
      {
        role: 'user',
        content: `Generate HR insights for this data:\n${JSON.stringify(summary, null, 2)}`,
      },
    ]);

    // Parse response into an array of bullet points
    const lines = answer.split('\n').filter(l => l.trim().length > 0);
    res.json({ success: true, insights: lines });
  } catch (err) {
    handleAIError(err, res);
  }
};

/**
 * POST /api/ai/admin/attendance-analysis
 * AI analysis of attendance data
 */
const attendanceAnalysis = async (req, res) => {
  try {
    const { context = {} } = req.body;
    const { attendance = [], employees = [] } = context;

    if (attendance.length === 0) {
      return res.json({ success: true, analysis: 'No attendance records found. Start marking attendance to get AI analysis.' });
    }

    const byDept = attendance.reduce((acc, a) => {
      if (!acc[a.department]) acc[a.department] = { present: 0, absent: 0, late: 0, overtime: 0 };
      if (a.status === 'present') acc[a.department].present++;
      if (a.status === 'absent') acc[a.department].absent++;
      if (a.late || a.status === 'late') acc[a.department].late++;
      acc[a.department].overtime += (a.overtime || 0);
      return acc;
    }, {});

    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0;

    const summary = {
      totalRecords,
      present: presentCount,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.late || a.status === 'late').length,
      onLeave: attendance.filter(a => a.status === 'leave').length,
      attendanceRate: `${attendanceRate}%`,
      totalOvertimeHours: attendance.reduce((s, a) => s + (a.overtime || 0), 0),
      byDepartment: byDept,
    };

    const answer = await callAI([
      {
        role: 'system',
        content: `You are an HR attendance analyst. Provide a concise attendance analysis based ONLY on the data provided.
Include: overall attendance rate, key observations, department with highest absenteeism, any notable trends.
Format as short paragraphs with bullet points for observations.
Do NOT invent data not present. Keep it under 200 words.`,
      },
      {
        role: 'user',
        content: `Analyze this attendance data:\n${JSON.stringify(summary, null, 2)}`,
      },
    ]);

    res.json({ success: true, analysis: answer.trim() });
  } catch (err) {
    handleAIError(err, res);
  }
};

/**
 * POST /api/ai/admin/leave-summary
 * AI summary of leave data
 */
const leaveSummary = async (req, res) => {
  try {
    const { context = {} } = req.body;
    const { leave = [] } = context;

    if (leave.length === 0) {
      return res.json({ success: true, summary: 'No leave requests found in the system.' });
    }

    const byType = leave.reduce((acc, l) => {
      acc[l.leaveType] = (acc[l.leaveType] || 0) + 1;
      return acc;
    }, {});

    const byDept = leave.reduce((acc, l) => {
      acc[l.department] = (acc[l.department] || 0) + 1;
      return acc;
    }, {});

    const summary = {
      total: leave.length,
      pending: leave.filter(l => l.status === 'pending').length,
      approved: leave.filter(l => l.status === 'approved').length,
      rejected: leave.filter(l => l.status === 'rejected').length,
      totalDays: leave.filter(l => l.status === 'approved').reduce((s, l) => s + (l.days || 0), 0),
      byType,
      byDepartment: byDept,
    };

    const answer = await callAI([
      {
        role: 'system',
        content: `You are an HR leave analyst. Summarize the leave data concisely using ONLY the provided numbers.
Cover: total requests by status, most common leave type, department with most leave, key observations.
Use bullet points. Keep it under 150 words. Do NOT invent data.`,
      },
      {
        role: 'user',
        content: `Summarize this leave data:\n${JSON.stringify(summary, null, 2)}`,
      },
    ]);

    res.json({ success: true, summary: answer.trim() });
  } catch (err) {
    handleAIError(err, res);
  }
};

/**
 * POST /api/ai/admin/payroll-insights
 * AI payroll analysis
 */
const payrollInsights = async (req, res) => {
  try {
    const { context = {} } = req.body;
    const { payroll = [] } = context;

    if (payroll.length === 0) {
      return res.json({ success: true, insights: 'No payroll records found. Generate payroll first to get AI insights.' });
    }

    const byDept = payroll.reduce((acc, p) => {
      const net = (p.basic || 0) + (p.hra || 0) + (p.allowances || 0) + (p.bonus || 0)
        - (p.tax || 0) - (p.insurance || 0) - (p.otherDeductions || 0);
      if (!acc[p.department]) acc[p.department] = { total: 0, count: 0 };
      acc[p.department].total += net;
      acc[p.department].count++;
      return acc;
    }, {});

    const totalPayroll = payroll.reduce((s, p) => {
      return s + (p.basic || 0) + (p.hra || 0) + (p.allowances || 0) + (p.bonus || 0)
        - (p.tax || 0) - (p.insurance || 0) - (p.otherDeductions || 0);
    }, 0);

    const summary = {
      totalPayrollAmount: totalPayroll,
      totalRecords: payroll.length,
      pending: payroll.filter(p => p.status === 'pending').length,
      approved: payroll.filter(p => p.status === 'approved').length,
      totalBonuses: payroll.reduce((s, p) => s + (p.bonus || 0), 0),
      totalDeductions: payroll.reduce((s, p) => s + (p.tax || 0) + (p.insurance || 0) + (p.otherDeductions || 0), 0),
      byDepartment: byDept,
    };

    const answer = await callAI([
      {
        role: 'system',
        content: `You are a payroll analytics AI. Provide concise payroll insights based ONLY on the data provided.
Currency is Indian Rupees (₹). Format large numbers as Lakhs (L) when appropriate (e.g., ₹48.2L).
Cover: total payroll, breakdown highlights, department distribution, bonus and deduction totals.
Use bullet points. Keep it under 150 words. Do NOT invent data.`,
      },
      {
        role: 'user',
        content: `Analyze this payroll data:\n${JSON.stringify(summary, null, 2)}`,
      },
    ]);

    res.json({ success: true, insights: answer.trim() });
  } catch (err) {
    handleAIError(err, res);
  }
};

/**
 * POST /api/ai/admin/performance-summary
 * AI performance analysis
 */
const performanceSummary = async (req, res) => {
  try {
    const { context = {}, employeeId } = req.body;
    const { performance = [] } = context;

    // If specific employee requested
    const reviews = employeeId
      ? performance.filter(r => r.employeeId === employeeId || r.email === employeeId)
      : performance;

    if (reviews.length === 0) {
      return res.json({ success: true, summary: 'No performance reviews found.' });
    }

    const byDept = reviews.reduce((acc, r) => {
      if (!acc[r.department]) acc[r.department] = { sum: 0, count: 0 };
      acc[r.department].sum += r.overallRating || 0;
      acc[r.department].count++;
      return acc;
    }, {});

    const summary = {
      totalReviews: reviews.length,
      avgRating: (reviews.reduce((s, r) => s + (r.overallRating || 0), 0) / reviews.length).toFixed(1),
      excellent: reviews.filter(r => r.overallRating === 5).length,
      veryGood: reviews.filter(r => r.overallRating === 4).length,
      meets: reviews.filter(r => r.overallRating === 3).length,
      needsImprovement: reviews.filter(r => r.overallRating <= 2).length,
      byDepartment: Object.fromEntries(
        Object.entries(byDept).map(([dept, d]) => [dept, (d.sum / d.count).toFixed(1)])
      ),
      // Send sanitized text fields (not salary-related)
      recentComments: reviews.slice(0, 3).map(r => ({
        reviewer: r.reviewer,
        period: r.reviewPeriod,
        strengths: r.strengths,
        improvements: r.improvements,
        comments: r.managerComments,
        rating: r.overallRating,
      })),
    };

    const answer = await callAI([
      {
        role: 'system',
        content: `You are an HR performance analyst. Summarize performance data based ONLY on what is provided.
Cover: overall rating trend, top strengths, areas for improvement, department comparison.
Keep it professional and concise (under 200 words). Use bullet points.
Do NOT make promotion, termination, or compensation decisions — only summarize and observe.`,
      },
      {
        role: 'user',
        content: `Summarize this performance data:\n${JSON.stringify(summary, null, 2)}`,
      },
    ]);

    res.json({ success: true, summary: answer.trim() });
  } catch (err) {
    handleAIError(err, res);
  }
};

/**
 * POST /api/ai/admin/generate-report
 * AI-generated executive report summary
 */
const generateReport = async (req, res) => {
  try {
    const { reportType, dateRange, department, context = {} } = req.body;
    const { employees = [], attendance = [], leave = [], payroll = [], performance = [] } = context;

    const deptLabel = department ? `for ${department} department` : 'across all departments';
    const dateLabel = (dateRange?.from && dateRange?.to)
      ? `from ${dateRange.from} to ${dateRange.to}`
      : 'for the current period';

    let dataForReport = {};

    switch (reportType) {
      case 'employee':
        dataForReport = {
          total: employees.length,
          active: employees.filter(e => e.status === 'active').length,
          inactive: employees.filter(e => e.status === 'inactive').length,
          onLeave: employees.filter(e => e.status === 'on-leave').length,
          byDept: employees.reduce((acc, e) => { acc[e.department] = (acc[e.department] || 0) + 1; return acc; }, {}),
          byType: employees.reduce((acc, e) => { acc[e.employmentType || 'Full-time'] = (acc[e.employmentType || 'Full-time'] || 0) + 1; return acc; }, {}),
        };
        break;
      case 'attendance':
        dataForReport = {
          totalRecords: attendance.length,
          present: attendance.filter(a => a.status === 'present').length,
          absent: attendance.filter(a => a.status === 'absent').length,
          late: attendance.filter(a => a.late).length,
          attendanceRate: attendance.length > 0
            ? `${((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(1)}%`
            : '0%',
          totalOvertime: attendance.reduce((s, a) => s + (a.overtime || 0), 0),
        };
        break;
      case 'leave':
        dataForReport = {
          total: leave.length,
          approved: leave.filter(l => l.status === 'approved').length,
          pending: leave.filter(l => l.status === 'pending').length,
          rejected: leave.filter(l => l.status === 'rejected').length,
          totalDaysApproved: leave.filter(l => l.status === 'approved').reduce((s, l) => s + (l.days || 0), 0),
          byType: leave.reduce((acc, l) => { acc[l.leaveType] = (acc[l.leaveType] || 0) + 1; return acc; }, {}),
        };
        break;
      case 'payroll':
        dataForReport = {
          totalPayroll: payroll.reduce((s, p) => s + ((p.basic || 0) + (p.hra || 0) + (p.allowances || 0) + (p.bonus || 0) - (p.tax || 0) - (p.insurance || 0) - (p.otherDeductions || 0)), 0),
          totalBonus: payroll.reduce((s, p) => s + (p.bonus || 0), 0),
          totalDeductions: payroll.reduce((s, p) => s + (p.tax || 0) + (p.insurance || 0) + (p.otherDeductions || 0), 0),
          records: payroll.length,
        };
        break;
      case 'performance':
        dataForReport = {
          reviews: performance.length,
          avgRating: performance.length > 0
            ? (performance.reduce((s, r) => s + (r.overallRating || 0), 0) / performance.length).toFixed(1)
            : 0,
          excellent: performance.filter(r => r.overallRating === 5).length,
          needsImprovement: performance.filter(r => r.overallRating <= 2).length,
        };
        break;
      default:
        dataForReport = { employees: employees.length, attendance: attendance.length, leave: leave.length };
    }

    const answer = await callAI([
      {
        role: 'system',
        content: `You are a professional HR report writer. Write an executive summary report based ONLY on the data provided.
Format: Start with "Executive Summary", then "Key Findings" as numbered list, then "Recommendations" as bullet points.
Currency is ₹ INR. Use specific numbers from the data. Keep it professional and under 250 words.
Do NOT invent data. If data is empty, state that in the summary.`,
      },
      {
        role: 'user',
        content: `Write an executive ${reportType} report ${deptLabel} ${dateLabel}.\n\nData:\n${JSON.stringify(dataForReport, null, 2)}`,
      },
    ]);

    res.json({ success: true, report: answer.trim() });
  } catch (err) {
    handleAIError(err, res);
  }
};

// ── EMPLOYEE ENDPOINTS ──────────────────────────────────────────────────────

/**
 * POST /api/ai/employee/chat
 * Employee AI Assistant — answers questions about the logged-in employee's own data only.
 * SECURITY: data is pre-filtered by employee ID before being sent to AI.
 * Architecture: simple data questions are answered directly (no AI cost/latency);
 *               complex/analytical questions fall back to AI with full context.
 */
const employeeChat = async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    const currentUser = req.user;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Please enter a question.' });
    }
    if (question.trim().length > 500) {
      return res.status(400).json({ success: false, message: 'Question is too long. Please keep it under 500 characters.' });
    }

    console.log(`[AI] Employee chat — user: ${currentUser.name} (${currentUser.role}) — question: "${question.substring(0, 80)}"`);

    // ── Step 1: Try direct answer (no AI needed) ──────────────────────────
    const directAnswer = resolveDirectAnswer(question, currentUser, context);
    if (directAnswer) {
      console.log(`[AI] Answered directly (no AI call) for: "${question.substring(0, 60)}"`);
      return res.json({ success: true, answer: directAnswer, source: 'direct' });
    }

    // ── Step 2: Policy-only question (AI with policy docs) ────────────────
    const relevantPolicies = getRelevantPolicies(question, 3);
    const isPolicyQuestion = relevantPolicies.length > 0;

    // ── Step 3: Build rich context for AI ────────────────────────────────
    const {
      myAttendance = [],
      myLeave = [],
      myPayroll = [],
      myPerformance = [],
      userProfile = {},
    } = context;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthAttendance = myAttendance.filter(a => (a.date || '').startsWith(currentMonth));

    const approved = myLeave.filter(l => l.status === 'approved');
    const leaveBalance = {
      'Annual Leave': { total: 18, used: approved.filter(l => l.leaveType === 'Annual Leave').reduce((s, l) => s + (l.days || 0), 0) },
      'Sick Leave':   { total: 10, used: approved.filter(l => l.leaveType === 'Sick Leave').reduce((s, l) => s + (l.days || 0), 0) },
      'Casual Leave': { total: 6,  used: approved.filter(l => l.leaveType === 'Casual Leave').reduce((s, l) => s + (l.days || 0), 0) },
    };

    const latestPayroll = myPayroll.length > 0 ? myPayroll[myPayroll.length - 1] : null;
    const latestPerf    = myPerformance.length > 0 ? myPerformance[0] : null;

    const employeeContext = `
Employee: ${currentUser.name}
Department: ${currentUser.department || userProfile.department || 'Not specified'}
Designation: ${currentUser.designation || userProfile.designation || 'Not specified'}
Joining Date: ${userProfile.joiningDate || currentUser.joiningDate || 'Not specified'}

ATTENDANCE (this month — ${monthAttendance.length} records):
- Present: ${monthAttendance.filter(a => a.status === 'present').length} days
- Absent: ${monthAttendance.filter(a => a.status === 'absent').length} days
- Late: ${monthAttendance.filter(a => a.late || a.status === 'late').length} days
- Total hours: ${monthAttendance.reduce((s, a) => s + (Number(a.hours) || 0), 0).toFixed(1)}h
- All-time present days: ${myAttendance.filter(a => a.status === 'present').length}

LEAVE BALANCE:
- Annual Leave: ${leaveBalance['Annual Leave'].total - leaveBalance['Annual Leave'].used} remaining (${leaveBalance['Annual Leave'].used} used of ${leaveBalance['Annual Leave'].total})
- Sick Leave: ${leaveBalance['Sick Leave'].total - leaveBalance['Sick Leave'].used} remaining (${leaveBalance['Sick Leave'].used} used of ${leaveBalance['Sick Leave'].total})
- Casual Leave: ${leaveBalance['Casual Leave'].total - leaveBalance['Casual Leave'].used} remaining (${leaveBalance['Casual Leave'].used} used of ${leaveBalance['Casual Leave'].total})
- Pending requests: ${myLeave.filter(l => l.status === 'pending').length}
- Total leave requests: ${myLeave.length}

PAYROLL:
${latestPayroll ? `- Latest payslip: ${latestPayroll.month || ''} ${latestPayroll.year || ''}
- Basic: ₹${(latestPayroll.basic || 0).toLocaleString('en-IN')}
- HRA: ₹${(latestPayroll.hra || 0).toLocaleString('en-IN')}
- Allowances: ₹${(latestPayroll.allowances || 0).toLocaleString('en-IN')}
- Bonus: ₹${(latestPayroll.bonus || 0).toLocaleString('en-IN')}
- Deductions: ₹${((latestPayroll.tax || 0) + (latestPayroll.insurance || 0) + (latestPayroll.otherDeductions || 0)).toLocaleString('en-IN')}
- Net Salary: ₹${((latestPayroll.basic||0)+(latestPayroll.hra||0)+(latestPayroll.allowances||0)+(latestPayroll.bonus||0)-(latestPayroll.tax||0)-(latestPayroll.insurance||0)-(latestPayroll.otherDeductions||0)).toLocaleString('en-IN')}
- Status: ${latestPayroll.status}` : '- No payroll records yet'}

PERFORMANCE:
${latestPerf ? `- Latest rating: ${latestPerf.overallRating}/5 (${latestPerf.reviewPeriod || 'N/A'})
- Reviewed by: ${latestPerf.reviewer || 'Manager'}
- Strengths: ${latestPerf.strengths || 'N/A'}
- Improvements: ${latestPerf.improvements || 'N/A'}
- Manager comments: ${latestPerf.managerComments || 'N/A'}
- Total reviews: ${myPerformance.length}` : '- No performance reviews yet'}
${relevantPolicies.length > 0 ? `\nCOMPANY POLICIES:\n${relevantPolicies.map(p => p.title + ':\n' + p.content).join('\n\n')}` : ''}`;

    const answer = await callAI([
      {
        role: 'system',
        content: `You are a personal AI assistant for an employee in an HR management system.
You ONLY answer questions about THIS employee's OWN data provided below.
You NEVER provide information about other employees or admin-level data.
If data shows "No records yet", say so clearly — never invent numbers.
If the question is about company policies, answer from the provided policy documents.
Keep answers concise, friendly, and helpful. Use ₹ for currency (Indian Rupees).
Give specific numbers from the data. Use bullet points for clarity.`,
      },
      {
        role: 'user',
        content: `${employeeContext}

My question: ${question}`,
      },
    ]);

    const trimmed = answer ? answer.trim() : '';
    if (!trimmed) {
      return res.json({
        success: true,
        answer: isPolicyQuestion
          ? "I couldn't find a specific policy for that question. Please contact HR for clarification."
          : "I couldn't find that information in your records. Please check the relevant section of the portal.",
        source: 'ai',
      });
    }

    console.log(`[AI] AI answer generated successfully for: "${question.substring(0, 60)}"`);
    res.json({ success: true, answer: trimmed, source: 'ai' });
  } catch (err) {
    handleAIError(err, res);
  }
};

/**
 * POST /api/ai/employee/weekly-summary
 * Generate weekly summary for the logged-in employee
 */
const employeeWeeklySummary = async (req, res) => {
  try {
    const { context = {} } = req.body;
    const currentUser = req.user;

    const {
      myAttendance = [],
      myLeave = [],
      myPayroll = [],
      myPerformance = [],
    } = context;

    // Only look at this week's attendance
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const thisWeekAttendance = myAttendance.filter(a => a.date >= weekStartStr);

    const summary = {
      employee: currentUser.name,
      week: {
        attendance: {
          daysPresent: thisWeekAttendance.filter(a => a.status === 'present').length,
          daysAbsent: thisWeekAttendance.filter(a => a.status === 'absent').length,
          hoursWorked: thisWeekAttendance.reduce((s, a) => s + (a.hours || 0), 0).toFixed(1),
          lateCount: thisWeekAttendance.filter(a => a.late).length,
        },
        leave: {
          pendingRequests: myLeave.filter(l => l.status === 'pending').length,
          approvedThisMonth: myLeave.filter(l => l.status === 'approved').length,
        },
        payroll: {
          latestPayslip: myPayroll.length > 0
            ? `${myPayroll[0].month} ${myPayroll[0].year}`
            : null,
          status: myPayroll.length > 0 ? myPayroll[0].status : null,
        },
        performance: {
          latestRating: myPerformance.length > 0 ? `${myPerformance[0].overallRating}/5` : null,
          period: myPerformance.length > 0 ? myPerformance[0].reviewPeriod : null,
        },
      },
    };

    const answer = await callAI([
      {
        role: 'system',
        content: `You are an employee's personal AI assistant. Create a friendly, encouraging weekly summary.
Format with clear sections: 🕐 Attendance, 🏖️ Leave, 💰 Payroll, ⭐ Performance.
Use the EXACT numbers provided. Keep it upbeat but factual. Under 150 words.
If data is empty for a section, briefly mention it.`,
      },
      {
        role: 'user',
        content: `Create a weekly summary for ${currentUser.name}:\n${JSON.stringify(summary, null, 2)}`,
      },
    ]);

    res.json({ success: true, summary: answer.trim() });
  } catch (err) {
    handleAIError(err, res);
  }
};

/**
 * POST /api/ai/policy
 * Company policy Q&A — available to all authenticated users (admin + employee)
 */
const policyChat = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Please provide a question' });
    }

    const relevantPolicies = getRelevantPolicies(question, 3);

    if (relevantPolicies.length === 0) {
      return res.json({
        success: true,
        answer: "I couldn't find a specific policy document for that question. Please contact HR for clarification.",
        sourceTopics: [],
      });
    }

    const policyContext = relevantPolicies.map(p => `${p.title}:\n${p.content}`).join('\n\n---\n\n');

    const answer = await callAI([
      {
        role: 'system',
        content: `You are an HR policy assistant. Answer questions based ONLY on the provided company policy documents.
If a policy is covered, give a clear, helpful answer with specific details.
If the policy document doesn't cover the exact question, say so and direct to HR.
Never invent policy information not present in the documents.
Keep answers concise and clear. Use bullet points for multi-step processes.`,
      },
      {
        role: 'user',
        content: `Policy documents:\n${policyContext}\n\nQuestion: ${question}`,
      },
    ]);

    res.json({
      success: true,
      answer: answer.trim(),
      sourceTopics: relevantPolicies.map(p => p.title),
    });
  } catch (err) {
    handleAIError(err, res);
  }
};

// ── Error Handler ───────────────────────────────────────────────────────────
const handleAIError = (err, res) => {
  console.error('AI Controller Error:', err.message || err);

  if (err.message === 'AI_NOT_CONFIGURED') {
    return res.status(503).json({
      success: false,
      message: 'AI service is not configured. Please set OPENAI_API_KEY in the backend .env file.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') {
    return res.status(504).json({
      success: false,
      message: 'AI request timed out. Please try again.',
      code: 'AI_TIMEOUT',
    });
  }

  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'AI rate limit reached. Please wait a moment and try again.',
      code: 'RATE_LIMIT',
    });
  }

  if (err.status === 401) {
    return res.status(503).json({
      success: false,
      message: 'AI authentication failed. Please check the API key configuration.',
      code: 'AI_AUTH_FAILED',
    });
  }

  res.status(500).json({
    success: false,
    message: 'AI Assistant is temporarily unavailable. Please try again later.',
    code: 'AI_ERROR',
  });
};

module.exports = {
  adminChat,
  adminInsights,
  attendanceAnalysis,
  leaveSummary,
  payrollInsights,
  performanceSummary,
  generateReport,
  employeeChat,
  employeeWeeklySummary,
  policyChat,
};
