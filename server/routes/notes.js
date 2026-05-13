const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/notes
// @desc    Get all notes where user is owner OR in collaborators
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    }).populate('owner', 'name email avatar').populate('collaborators', 'name email avatar');
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const note = new Note({
      title: title || 'Untitled Note',
      content: content || '',
      owner: req.user._id,
      tags: tags || []
    });
    const savedNote = await note.save();
    res.status(201).json(savedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/notes/:id
// @desc    Get single note by ID (owner or collaborator only)
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators', 'name email avatar');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user is owner or collaborator
    const isOwner = note.owner._id.toString() === req.user._id;
    const isCollaborator = note.collaborators.some(
      col => col._id.toString() === req.user._id
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized to view this note' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update note (owner or collaborator only)
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  console.log('POST /notes hit')        // ADD THIS
  console.log('req.user:', req.user)    // ADD THIS
  console.log('req.body:', req.body)    // ADD THIS
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user is owner or collaborator
    const isOwner = note.owner.toString() === req.user._id;
    const isCollaborator = note.collaborators.includes(req.user._id);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    // Save current content to versions before updating
    if (req.body.content !== undefined && req.body.content !== note.content) {
      note.versions.push({
        content: note.content,
        savedAt: Date.now()
      });
    }

    // Update fields
    const { title, content, tags, summary } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (summary !== undefined) note.summary = summary;

    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete note (owner only)
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Only owner can delete
    if (note.owner.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Only owner can delete this note' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/notes/:id/collaborators
// @desc    Add a collaborator by email (owner only)
// @access  Private
router.post('/:id/collaborators', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Only owner can add collaborators
    if (note.owner.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Only owner can add collaborators' });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check if already a collaborator
    if (note.collaborators.includes(user._id)) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    // Check if user is owner
    if (note.owner.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot add owner as collaborator' });
    }

    note.collaborators.push(user._id);
    await note.save();

    const updatedNote = await Note.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators', 'name email avatar');

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;