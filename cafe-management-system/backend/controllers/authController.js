const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');

/**
 * Generate JWT token for a user
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User with this email already exists' });
  }

  const user = await User.create({ name, email, phone: phone || '', password, role: 'user' });

  if (user) {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    await LoginLog.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      ipAddress,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please log in.',
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid user data' });
  }
});

/**
 * @desc    Login user or admin
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  // Find user by email (include password for comparison)
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(user._id, user.role);

  // Record login activity
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  await LoginLog.create({
    user: user._id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    ipAddress,
  });

  // Mark user as active
  await User.findByIdAndUpdate(user._id, { isActive: true, lastSeen: new Date() });

  res.status(200).json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
  });
});

/**
 * @desc    Logout user (mark inactive, record logout time)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Mark user as inactive
  await User.findByIdAndUpdate(req.user._id, { isActive: false, lastSeen: new Date() });

  // Update the latest login log with logout time
  await LoginLog.findOneAndUpdate(
    { user: req.user._id },
    { isActive: false, logoutAt: new Date() },
    { sort: { loginAt: -1 } }
  );

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.status(200).json({ success: true, data: user });
});

/**
 * @desc    Update user profile (name, phone)
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  ).select('-password');
  res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
});

module.exports = { signup, login, logout, getMe, updateMe };
