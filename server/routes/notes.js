const express = require('express');
const router = express.Router();

// Notes routes placeholder
// Will be implemented in Day 02 and beyond

router.get('/', (req, res) => {
  res.json({ message: 'Notes route placeholder' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create note placeholder' });
});

module.exports = router;