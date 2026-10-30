require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const connectDB  = require('./config/db');

const employeeRoutes     = require('./routes/employeeRoutes');
const authRoutes         = require('./routes/authRoutes');
const attendanceRoutes   = require('./routes/attendanceRoutes');
const leaveRoutes        = require('./routes/leaveRoutes');
const holidayRoutes      = require('./routes/holidayRoutes');
const overtimeRoutes     = require('./routes/overtimeRoutes');
const advanceRoutes      = require('./routes/advanceRoutes');
const departmentRoutes   = require('./routes/departmentRoutes');
const taskRoutes         = require('./routes/taskRoutes');
const reportRoutes       = require('./routes/reportRoutes');
const payrollRoutes      = require('./routes/payrollRoutes');
const performanceRoutes  = require('./routes/performanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const permissionRoutes   = require('./routes/permissionRoutes');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

connectDB();

const app = express();

// ── Security & utility middleware ────────────────────────────────────────────
app.use(helmet()); // secure HTTP headers

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global rate limiter
app.use('/api', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/employees',     employeeRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/leave',         leaveRoutes);
app.use('/api/holidays',      holidayRoutes);
app.use('/api/overtime',      overtimeRoutes);
app.use('/api/advances',      advanceRoutes);
app.use('/api/departments',   departmentRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/payroll',       payrollRoutes);
app.use('/api/performance',   performanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/permissions',   permissionRoutes);

app.get('/', (req, res) => res.json({
  success: true,
  message: 'Employee Management System API is running',
  version: '1.0.0',
}));

// ── Error handling (must be last) ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
