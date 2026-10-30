const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone'];
  const updates = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) updates[key] = req.body[key];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }

  const user = await User.findById(req.user._id);
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: users.length, data: users });
});

module.exports = { getProfile, updateProfile, changePassword, getUsers };
