const mongoose = require('mongoose');

/**
 * LoginLog Schema
 * Tracks every login event per user with session/activity status
 */
const loginLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    loginAt: {
      type: Date,
      default: Date.now,
    },
    // IP address of the login (optional, if forwarded by proxy)
    ipAddress: {
      type: String,
      default: 'unknown',
    },
    // Active: user has been seen in last 30 minutes
    isActive: {
      type: Boolean,
      default: true,
    },
    // Last API activity timestamp
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Logout time if explicitly logged out
    logoutAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoginLog', loginLogSchema);
