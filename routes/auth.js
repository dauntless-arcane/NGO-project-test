const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const User = require('../models/User');

router.get('/profile', verifyToken, async (req, res) => {
  try {
    console.log('Decoded user:', req.user); // Check if middleware works

    const user = await User.findById(req.user.userId).select('-password'); // ✅ FIXED LINE

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });

  } catch (err) {
    console.error('Profile error:', err); // Log the actual error
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username too short'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password too short')
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
], login);

module.exports = router;
