/**
 * useAI — React hook for all AI API calls
 *
 * Security: passes the user object as a base64-encoded header (X-User-Info).
 * The OpenAI API key NEVER leaves the backend.
 * Each call is role-validated server-side.
 */

import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Build the auth header from the stored user object.
 * Uses base64 encoding (not encryption — just obfuscation for transport).
 */
const buildAuthHeader = (user) => {
  if (!user) return {};
  try {
    const encoded = btoa(JSON.stringify({
      id:         user.id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      department: user.department || '',
    }));
    return { 'X-User-Info': encoded };
  } catch {
    return {};
  }
};

/**
 * Parse AI error into a user-friendly message
 */
const parseError = (err) => {
  if (!err.response) {
    return 'AI Assistant is temporarily unavailable. Please check your connection and try again.';
  }
  const code = err.response.data?.code;
  const message = err.response.data?.message;

  if (code === 'AI_NOT_CONFIGURED') {
    return 'AI is not configured yet. Please set up the OpenAI API key in the backend .env file.';
  }
  if (code === 'AI_TIMEOUT') return 'AI request timed out. Please try again.';
  if (code === 'RATE_LIMIT')  return 'AI rate limit reached. Please wait a moment and try again.';
  if (err.response.status === 401) return 'Authentication required to use AI features.';
  if (err.response.status === 403) return 'You do not have permission to access this AI feature.';
  return message || 'AI Assistant is temporarily unavailable. Please try again later.';
};

// ── Main hook ────────────────────────────────────────────────────────────────
export const useAI = (user) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const headers = buildAuthHeader(user);

  const call = useCallback(async (endpoint, body = {}) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_BASE}/api/ai/${endpoint}`,
        body,
        { headers, signal: controller.signal, timeout: 30000 }
      );
      return res.data;
    } catch (err) {
      if (axios.isCancel(err)) return null; // cancelled — ignore
      const msg = parseError(err);
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Admin endpoints ───────────────────────────────────────────────────
  const adminChat           = (question, context)         => call('admin/chat',                { question, context });
  const adminInsights       = (context)                   => call('admin/insights',             { context });
  const attendanceAnalysis  = (context)                   => call('admin/attendance-analysis',  { context });
  const leaveSummary        = (context)                   => call('admin/leave-summary',         { context });
  const payrollInsights     = (context)                   => call('admin/payroll-insights',      { context });
  const performanceSummary  = (context, employeeId)       => call('admin/performance-summary',   { context, employeeId });
  const generateReport      = (reportType, dateRange, department, context) =>
    call('admin/generate-report', { reportType, dateRange, department, context });

  // ── Employee endpoints ────────────────────────────────────────────────
  const employeeChat        = (question, context)         => call('employee/chat',              { question, context });
  const employeeWeeklySummary = (context)                 => call('employee/weekly-summary',    { context });

  // ── Shared ────────────────────────────────────────────────────────────
  const policyChat          = (question)                  => call('policy',                     { question });

  return {
    loading,
    error,
    setError,
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
};

export default useAI;
