require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

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
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Collab Notes API running' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-note', (noteId) => {
    socket.join(noteId);
    console.log(`User ${socket.id} joined note: ${noteId}`);
  });

  socket.on('leave-note', (noteId) => {
    socket.leave(noteId);
    console.log(`User ${socket.id} left note: ${noteId}`);
  });

  socket.on('note-update', (data) => {
    socket.to(data.noteId).emit('note-updated', data);
  });

  socket.on('cursor-move', (data) => {
    socket.to(data.noteId).emit('cursor-updated', {
      userId: socket.id,
      position: data.position,
      userName: data.userName
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };