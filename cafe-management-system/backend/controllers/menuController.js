const asyncHandler = require('express-async-handler');
const MenuItem = require('../models/MenuItem');

/**
 * @desc    Get all menu categories with their sub-items
 * @route   GET /api/menu
 * @access  Public
 */
const getAllMenu = asyncHandler(async (req, res) => {
  const menu = await MenuItem.find({ isAvailable: true });
  res.status(200).json({ success: true, count: menu.length, data: menu });
});

/**
 * @desc    Get a single category with sub-items by ID
 * @route   GET /api/menu/:id
 * @access  Public
 */
const getMenuById = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);
  if (!menuItem) {
    return res.status(404).json({ success: false, message: 'Menu category not found' });
  }
  res.status(200).json({ success: true, data: menuItem });
});

/**
 * @desc    Create a new menu category
 * @route   POST /api/menu
 * @access  Admin
 */
const createMenuItem = asyncHandler(async (req, res) => {
  const { category, icon, image, description, subItems } = req.body;

  if (!category) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const existing = await MenuItem.findOne({ category: { $regex: new RegExp(`^${category}$`, 'i') } });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Category already exists' });
  }

  const menuItem = await MenuItem.create({ category, icon, image, description, subItems: subItems || [] });
  res.status(201).json({ success: true, message: 'Menu category created', data: menuItem });
});

/**
 * @desc    Update a menu category or its sub-items
 * @route   PUT /api/menu/:id
 * @access  Admin
 */
const updateMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!menuItem) {
    return res.status(404).json({ success: false, message: 'Menu category not found' });
  }

  res.status(200).json({ success: true, message: 'Menu updated', data: menuItem });
});

/**
 * @desc    Delete a menu category
 * @route   DELETE /api/menu/:id
 * @access  Admin
 */
const deleteMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

  if (!menuItem) {
    return res.status(404).json({ success: false, message: 'Menu category not found' });
  }

  res.status(200).json({ success: true, message: 'Menu category deleted' });
});

/**
 * @desc    Add a sub-item to a category
 * @route   POST /api/menu/:id/subitems
 * @access  Admin
 */
const addSubItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    return res.status(404).json({ success: false, message: 'Menu category not found' });
  }

  menuItem.subItems.push(req.body);
  await menuItem.save();

  res.status(201).json({ success: true, message: 'Sub-item added', data: menuItem });
});

/**
 * @desc    Update a sub-item in a category
 * @route   PUT /api/menu/:id/subitems/:subId
 * @access  Admin
 */
const updateSubItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    return res.status(404).json({ success: false, message: 'Menu category not found' });
  }

  const subItem = menuItem.subItems.id(req.params.subId);
  if (!subItem) {
    return res.status(404).json({ success: false, message: 'Sub-item not found' });
  }

  // Update only provided fields
  Object.assign(subItem, req.body);
  await menuItem.save();

  res.status(200).json({ success: true, message: 'Sub-item updated', data: menuItem });
});

/**
 * @desc    Delete a sub-item from a category
 * @route   DELETE /api/menu/:id/subitems/:subId
 * @access  Admin
 */
const deleteSubItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    return res.status(404).json({ success: false, message: 'Menu category not found' });
  }

  menuItem.subItems = menuItem.subItems.filter(
    (item) => item._id.toString() !== req.params.subId
  );
  await menuItem.save();

  res.status(200).json({ success: true, message: 'Sub-item deleted', data: menuItem });
});

module.exports = {
  getAllMenu,
  getMenuById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addSubItem,
  updateSubItem,
  deleteSubItem,
};
