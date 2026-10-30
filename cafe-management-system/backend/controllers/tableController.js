const asyncHandler = require('express-async-handler');
const Table = require('../models/Table');

const listTables = asyncHandler(async (req, res) => {
  const tables = await Table.find({ isActive: true }).sort({ tableNumber: 1 });
  res.status(200).json({ success: true, count: tables.length, data: tables });
});

const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, capacity, location, name } = req.body;

  if (!tableNumber || !capacity) {
    return res.status(400).json({ success: false, message: 'Table number and capacity are required' });
  }

  const table = await Table.create({
    tableNumber,
    capacity,
    location: location || 'Indoor',
    name: name || `Table ${tableNumber}`,
  });

  res.status(201).json({ success: true, message: 'Table added', data: table });
});

const updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  res.status(200).json({ success: true, message: 'Table updated', data: table });
});

const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndDelete(req.params.id);

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  res.status(200).json({ success: true, message: 'Table deleted' });
});

const updateTableStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const table = await Table.findByIdAndUpdate(req.params.id, { status }, { new: true });

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found' });
  }

  res.status(200).json({ success: true, message: 'Table status updated', data: table });
});

module.exports = { listTables, createTable, updateTable, deleteTable, updateTableStatus };
