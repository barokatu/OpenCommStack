const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { setupSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
// CORS — allow any origin for local network access
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Socket.io
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 10e6
});

setupSocket(io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/status', require('./routes/status'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/calls', require('./routes/calls'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'OpenCommStack API', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OpenCommStack API running on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`📁 Uploads at /uploads`);
});
