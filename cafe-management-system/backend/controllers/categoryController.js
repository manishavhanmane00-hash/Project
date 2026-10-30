const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ success: true, count: categories.length, data: categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, icon, description } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const category = await Category.create({
    name,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    icon: icon || '☕',
    description: description || '',
  });

  res.status(201).json({ success: true, message: 'Category created', data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.status(200).json({ success: true, message: 'Category updated', data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.status(200).json({ success: true, message: 'Category deleted' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
