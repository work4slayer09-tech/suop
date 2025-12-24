const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

/**
 * GET /api/users
 * List all users (basic info) - useful for DM list / discovery.
 */
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'username avatar online lastSeen');
    res.json(users);
  } catch (err) {
    console.error('list users', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/users/me
 */
router.get('/me', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user._id, 'username email avatar online lastSeen servers');
    res.json(me);
  } catch (err) {
    console.error('get me', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
