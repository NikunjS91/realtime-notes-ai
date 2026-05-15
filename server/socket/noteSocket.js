const Note = require('../models/Note');

const lastSavedTimes = new Map();
const DEBOUNCE_DELAY = 2000;

const setupNoteSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-note', async (data) => {
      const { noteId } = data;
      socket.join(noteId);
      console.log(`User ${socket.id} joined note: ${noteId}`);

      try {
        const note = await Note.findById(noteId);
        if (note) {
          socket.emit('note-data', {
            title: note.title,
            content: note.content,
            summary: note.summary || '',
            tags: note.tags || []
          });
        }
      } catch (err) {
        console.error('Error fetching note:', err);
      }
    });

    socket.on('note-update', async (data) => {
      const { noteId, title, content } = data;

      socket.to(noteId).emit('note-updated', { title, content });

      const now = Date.now();
      const lastSaved = lastSavedTimes.get(noteId) || 0;

      if (now - lastSaved >= DEBOUNCE_DELAY) {
        lastSavedTimes.set(noteId, now);
        try {
                  const note = await Note.findById(noteId);
            if (note) {
            if (content !== undefined && content !== note.content) {
            note.versions.push({ content: note.content, savedAt: Date.now() });
            if (note.versions.length > 20) note.versions = note.versions.slice(-20);
            }
            if (title !== undefined) note.title = title;
            if (content !== undefined) note.content = content;
            await note.save();
            console.log(`Note ${noteId} saved with version history`);
            }
        } catch (err) {
          console.error('Error saving note:', err);
        }
      }
    });

    socket.on('cursor-move', (data) => {
      const { noteId, userId, userName, position } = data;
      socket.to(noteId).emit('cursor-updated', {
        userId,
        userName,
        position
      });
    });

    socket.on('tags-update', async (data) => {
      const { noteId, tags } = data;
      try {
        await Note.findByIdAndUpdate(noteId, { tags }, { new: true });
        socket.to(noteId).emit('tags-updated', { tags });
      } catch (err) {
        console.error('Error updating tags:', err);
      }
    });

    socket.on('leave-note', (data) => {
      const { noteId } = data;
      socket.leave(noteId);
      console.log(`User ${socket.id} left note: ${noteId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = { setupNoteSocket };