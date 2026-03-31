require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const adminRoutes = require('./routes/admin');
const exportRoutes = require('./routes/export');
const logRoutes = require('./routes/logs');
const chatRoutes = require("./routes/chatRoutes");

const app = express();
const server = http.createServer(app); // Server definition moved up

// SOCKET CONFIG
const io = new Server(server, {
  cors: { 
    origin: ["http://localhost:3000", "https://ags-tms-frontend.onrender.com"],
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// 🔥 CRITICAL FIX: Set io instance to app so controllers can use it
app.set("io", io);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// CORS FIX
app.use(cors({ 
  origin: ['http://localhost:3000', 'https://ags-tms-frontend.onrender.com'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// ROUTES REGISTRATION
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Seed endpoint
app.get('/api/seed', async (req, res) => {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'admin@ags.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User', email: 'admin@ags.com', password: hashedPassword, role: 'admin', isActive: true
      });
      res.json({ message: '✅ Admin created' });
    } else {
      res.json({ message: 'Admin already exists' });
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

// SOCKET HANDLER
require("./socket/chatSocket")(io);

const PORT = process.env.PORT || 5000;

// DATABASE & START
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;