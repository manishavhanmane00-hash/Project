require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const employeeRoutes     = require('./routes/employeeRoutes');
const authRoutes         = require('./routes/authRoutes');
const attendanceRoutes   = require('./routes/attendanceRoutes');
const leaveRoutes        = require('./routes/leaveRoutes');
const payrollRoutes      = require('./routes/payrollRoutes');
const performanceRoutes  = require('./routes/performanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes           = require('./routes/aiRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/employees',     employeeRoutes);
app.use('/api/auth',          authRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/leave',         leaveRoutes);
app.use('/api/payroll',       payrollRoutes);
app.use('/api/performance',   performanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai',            aiRoutes);

app.get('/', (req, res) => res.send('Employee Management System API is running...'));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
