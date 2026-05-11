const express = require('express');
const router = express.Router();

// Auth routes placeholder
// Will be implemented in Day 03

router.get('/google', (req, res) => {
  res.json({ message: 'Google OAuth route placeholder' });
});

router.get('/google/callback', (req, res) => {
  res.json({ message: 'Google OAuth callback placeholder' });
});

module.exports = router;