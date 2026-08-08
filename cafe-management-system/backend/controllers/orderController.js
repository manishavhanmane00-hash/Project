const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

/**
 * @desc    Place a new order
 * @route   POST /api/orders
 * @access  Private (User)
 */
const placeOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order' });
  }

  // Build order items with validated prices from DB
  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const menuCategory = await MenuItem.findById(item.menuItemId);
    if (!menuCategory) {
      return res.status(404).json({ success: false, message: `Menu category not found: ${item.menuItemId}` });
    }

    const subItem = menuCategory.subItems.id(item.subItemId);
    if (!subItem) {
      return res.status(404).json({ success: false, message: `Sub-item not found: ${item.subItemId}` });
    }

    const quantity = parseInt(item.quantity) || 1;
    const subtotal = subItem.price * quantity;
    totalAmount += subtotal;

    orderItems.push({
      menuItemId: menuCategory._id,
      subItemId: subItem._id,
      category: menuCategory.category,
      name: subItem.name,
      price: subItem.price,
      quantity,
      subtotal,
    });
  }

  // Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    totalAmount,
    paymentMethod: paymentMethod || 'Cash',
    notes: notes || '',
    statusHistory: [{ status: 'Placed', updatedBy: req.user._id }],
  });

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: order,
  });
});

/**
 * @desc    Get current user's order history
 * @route   GET /api/orders/my
 * @access  Private (User)
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('payment')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: orders.length, data: orders });
});

/**
 * @desc    Track a specific order status
 * @route   GET /api/orders/:id/track
 * @access  Private (User — own order) / Admin
 */
const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('payment');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Users can only track their own orders
  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to track this order' });
  }

  // Calculate estimated time remaining based on status
  const statusTimeMap = {
    Placed: order.estimatedTime,
    Preparing: Math.round(order.estimatedTime * 0.6),
    Ready: 5,
    'Out for Delivery': 10,
    Completed: 0,
    Cancelled: 0,
  };

  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      status: order.status,
      statusHistory: order.statusHistory,
      estimatedTimeRemaining: statusTimeMap[order.status] || 0,
      items: order.items,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    },
  });
});

/**
 * @desc    Update order status (Admin only)
 * @route   PATCH /api/orders/:id/status
 * @access  Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['Placed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.status = status;
  order.statusHistory.push({ status, updatedBy: req.user._id });
  await order.save();

  res.status(200).json({
    success: true,
    message: `Order status updated to "${status}"`,
    data: order,
  });
});

/**
 * @desc    Get a single order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('payment');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Users can only see their own orders
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  res.status(200).json({ success: true, data: order });
});

module.exports = { placeOrder, getMyOrders, trackOrder, updateOrderStatus, getOrderById };
