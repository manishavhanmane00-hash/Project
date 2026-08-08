const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');

/**
 * @desc    Admin Dashboard overview stats
 * @route   GET /api/admin/dashboard
 * @access  Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's orders
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today, $lt: tomorrow },
  });

  // Today's revenue (paid orders only)
  const todayRevenueResult = await Payment.aggregate([
    {
      $match: {
        createdAt: { $gte: today, $lt: tomorrow },
        status: 'Completed',
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const todayRevenue = todayRevenueResult[0]?.total || 0;

  // Total revenue all time
  const totalRevenueResult = await Payment.aggregate([
    { $match: { status: 'Completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalRevenue = totalRevenueResult[0]?.total || 0;

  // Pending orders (not completed or cancelled)
  const pendingOrders = await Order.countDocuments({
    status: { $in: ['Placed', 'Preparing', 'Ready', 'Out for Delivery'] },
  });

  // Active users (seen in last 30 minutes)
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const activeUsers = await User.countDocuments({
    isActive: true,
    lastSeen: { $gte: thirtyMinAgo },
    role: 'user',
  });

  // Total users
  const totalUsers = await User.countDocuments({ role: 'user' });

  // Total orders
  const totalOrders = await Order.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      todayOrders,
      todayRevenue,
      totalRevenue,
      pendingOrders,
      activeUsers,
      totalUsers,
      totalOrders,
    },
  });
});

/**
 * @desc    Get all orders with filters
 * @route   GET /api/admin/orders
 * @access  Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, date, customerId, page = 1, limit = 20 } = req.query;

  const filter = {};

  if (status) filter.status = status;
  if (customerId) filter.user = customerId;

  // Filter by date (a specific day)
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .populate('payment')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: orders,
  });
});

/**
 * @desc    Get all payment transactions
 * @route   GET /api/admin/payments
 * @access  Admin
 */
const getAllPayments = asyncHandler(async (req, res) => {
  const { method, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (method) filter.method = method;
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Payment.countDocuments(filter);

  const payments = await Payment.find(filter)
    .populate('user', 'name email')
    .populate('order', 'items totalAmount status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Payment method breakdown
  const breakdown = await Payment.aggregate([
    { $match: { status: 'Completed' } },
    { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    breakdown,
    data: payments,
  });
});

/**
 * @desc    Get user login/activity logs
 * @route   GET /api/admin/login-logs
 * @access  Admin
 */
const getLoginLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await LoginLog.countDocuments();

  // Mark logs as inactive if last activity > 30 min ago
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  await LoginLog.updateMany(
    { lastActivity: { $lt: thirtyMinAgo }, isActive: true },
    { isActive: false }
  );

  const logs = await LoginLog.find()
    .populate('user', 'name email role')
    .sort({ loginAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: logs,
  });
});

/**
 * @desc    Get all customers/users list
 * @route   GET /api/admin/users
 * @access  Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'user' })
    .select('-password')
    .sort({ createdAt: -1 });

  // Attach order count to each user
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const orderCount = await Order.countDocuments({ user: user._id });
      const totalSpent = await Payment.aggregate([
        { $match: { user: user._id, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      return {
        ...user.toObject(),
        orderCount,
        totalSpent: totalSpent[0]?.total || 0,
      };
    })
  );

  res.status(200).json({ success: true, count: users.length, data: usersWithStats });
});

module.exports = { getDashboardStats, getAllOrders, getAllPayments, getLoginLogs, getAllUsers };
