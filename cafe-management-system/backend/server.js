const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ===== Middleware =====
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com'
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ===== Request Logger (development only) =====
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ===== API Routes =====
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ===== Health Check =====
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Cafe API is running 🚀', timestamp: new Date() });
});

// ===== 404 Handler =====
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ===== Global Error Handler =====
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  console.error('❌ Server Error:', err.message);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
