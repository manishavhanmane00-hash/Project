require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const employeeRoutes = require('./routes/employeeRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors()); // allow the React frontend to call this API
app.use(express.json()); // parse JSON request bodies

// Routes
app.use('/api/employees', employeeRoutes);

// Health check / root route
app.get('/', (req, res) => {
  res.send('Employee Management System API is running...');
});

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
