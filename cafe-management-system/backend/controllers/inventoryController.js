const asyncHandler = require('express-async-handler');
const InventoryItem = require('../models/InventoryItem');
const InventoryMovement = require('../models/InventoryMovement');

const listInventory = asyncHandler(async (_req, res) => {
  const items = await InventoryItem.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ success: true, count: items.length, data: items });
});

const createInventoryItem = asyncHandler(async (req, res) => {
  const { name, sku, category, unit, currentStock, minStock, costPerUnit, supplier } = req.body;

  if (!name || !unit) {
    return res.status(400).json({ success: false, message: 'Name and unit are required' });
  }

  const item = await InventoryItem.create({
    name,
    sku: sku || name.toLowerCase().replace(/\s+/g, '-'),
    category: category || 'General',
    unit,
    currentStock: currentStock || 0,
    minStock: minStock || 0,
    costPerUnit: costPerUnit || 0,
    supplier: supplier || '',
  });

  res.status(201).json({ success: true, message: 'Inventory item created', data: item });
});

const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Inventory item not found' });
  }

  res.status(200).json({ success: true, message: 'Inventory item updated', data: item });
});

const adjustInventoryStock = asyncHandler(async (req, res) => {
  const { quantity, type, reason, relatedOrder } = req.body;
  const item = await InventoryItem.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Inventory item not found' });
  }

  const qty = Number(quantity || 0);
  if (!qty) {
    return res.status(400).json({ success: false, message: 'Quantity must be greater than zero' });
  }

  if (type === 'stock_out' && item.currentStock < qty) {
    return res.status(400).json({ success: false, message: 'Not enough stock available' });
  }

  if (type === 'stock_out') item.currentStock -= qty;
  if (type === 'stock_in') item.currentStock += qty;
  if (type === 'adjustment') item.currentStock += qty;
  if (type === 'waste') item.currentStock = Math.max(0, item.currentStock - qty);

  await item.save();

  const movement = await InventoryMovement.create({
    item: item._id,
    type,
    quantity: qty,
    reason: reason || 'Inventory adjustment',
    relatedOrder: relatedOrder || null,
    createdBy: req.user?._id || null,
  });

  res.status(200).json({ success: true, message: 'Stock adjusted', data: { item, movement } });
});

const getInventoryMovements = asyncHandler(async (_req, res) => {
  const movements = await InventoryMovement.find()
    .populate('item', 'name unit')
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({ success: true, count: movements.length, data: movements });
});

module.exports = {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryStock,
  getInventoryMovements,
};
