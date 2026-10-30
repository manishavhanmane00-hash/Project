const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const InventoryItem = require('../models/InventoryItem');

const getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filters = { paymentStatus: 'Paid' };

  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = new Date(startDate);
    if (endDate) filters.createdAt.$lte = new Date(endDate);
  }

  const orders = await Order.find(filters).sort({ createdAt: 1 });
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const orderCount = orders.length;

  res.status(200).json({
    success: true,
    data: {
      totalRevenue,
      orderCount,
      period: { startDate: startDate || null, endDate: endDate || null },
      orders,
    },
  });
});

const getInventoryUsage = asyncHandler(async (_req, res) => {
  const lowStockItems = await InventoryItem.find({
    $expr: { $lte: ['$currentStock', '$minStock'] },
  });

  const summary = await InventoryItem.aggregate([
    { $group: { _id: '$category', totalUnits: { $sum: '$currentStock' } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      lowStockItems,
      summary,
    },
  });
});

const getOverview = asyncHandler(async (_req, res) => {
  const totalOrders = await Order.countDocuments();
  const paidRevenue = await Payment.aggregate([{ $match: { status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const revenue = paidRevenue[0]?.total || 0;

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      revenue,
    },
  });
});

module.exports = { getSalesReport, getInventoryUsage, getOverview };
