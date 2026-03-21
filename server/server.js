require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const adminRoutes = require('./routes/admin');
const exportRoutes = require('./routes/export');
const logRoutes = require('./routes/logs');

const app = express();

// Rate limiting - increased limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,  // Increased from 500 to 5000
  message: { error: 'Too many requests, please try again later.' }
});

app.use(limiter);

// CORS - allow both local and production frontend
app.use(cors({ 
  origin: ['http://localhost:3000', 'https://ags-tms-frontend.onrender.com'], 
  credentials: true 
}));

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/logs', logRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Seed endpoint - creates admin user
app.get('/api/seed', async (req, res) => {
  try {
    const User = require('./models/User');
    
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@ags.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@ags.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      res.json({ message: '✅ Admin created: admin@ags.com / admin123' });
    } else {
      res.json({ message: 'Admin already exists. Login with admin@ags.com / admin123' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;