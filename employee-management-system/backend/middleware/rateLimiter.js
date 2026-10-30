const rateLimit = require('express-rate-limit');

/**
 * Strict rate limit for auth endpoints (login, register)
 * to deter brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                    // max 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait 15 minutes before trying again.' },
  skipSuccessfulRequests: true, // don't count successful logins against the limit
});

/**
 * General API rate limit — less strict.
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 200,                  // 200 requests/minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

module.exports = { authLimiter, apiLimiter };
