const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/auth/google
// @desc    Start Google OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback - create JWT and redirect
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.error('Google OAuth error:', err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
      }
      if (!user) {
        console.error('Google OAuth failed - no user:', info);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=no_user`);
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.redirect(`${process.env.CLIENT_URL}/login?error=login_error`);
        }
        // Generate JWT token
        const token = jwt.sign(
          { userId: req.user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
      });
    })(req, res, next);
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;