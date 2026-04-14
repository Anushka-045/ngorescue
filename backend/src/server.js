require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./utils/logger');
const db = require('./config/database');

// Routes
const authRoutes = require('./routes/auth.routes');
const reportRoutes = require('./routes/report.routes');
const volunteerRoutes = require('./routes/volunteer.routes');
const taskRoutes = require('./routes/task.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const impactRoutes = require('./routes/impact.routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible in routes
app.set('io', io);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── Initialize Database ───────────────────────────────────────────────────────
db.initialize();

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/impact', impactRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'NGO Relief Management API'
  });
});

// API docs index
app.get('/', (req, res) => {
  res.json({
    name: 'NGO Relief Management System API',
    version: '1.0.0',
    endpoints: {
      auth:       'POST /api/auth/register | POST /api/auth/login',
      reports:    'POST /api/reports/upload | GET /api/reports | GET /api/reports/:id',
      volunteers: 'POST /api/volunteers | GET /api/volunteers | PUT /api/volunteers/:id/status',
      tasks:      'GET /api/tasks | PUT /api/tasks/:id/accept | PUT /api/tasks/:id/complete',
      dashboard:  'GET /api/dashboard/stats | GET /api/dashboard/map',
      impact:     'GET /api/impact/summary | GET /api/impact/metrics'
    },
    websocket: 'Connect to ws://localhost:3000 for real-time updates'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── WebSocket ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    logger.info(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`🚀 NGO Relief API running on http://localhost:${PORT}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🌱 Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, io };
