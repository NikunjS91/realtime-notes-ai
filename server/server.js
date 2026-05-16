require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const connectDB = require('./config/db');
require('./config/passport')(passport);

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/ai/suggest', require('./routes/aiSuggest'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Collab Notes API running' });
});

// Socket.io connection handling
const { setupNoteSocket } = require('./socket/noteSocket');
setupNoteSocket(io);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };