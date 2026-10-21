const router = require('express').Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// Slows down password-guessing: 10 attempts per 15 minutes per IP.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: String(email || '').toLowerCase() });
  // Same message for both failures so attackers can't tell which emails exist.
  if (!user || !(await user.matches(String(password || '')))) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, email: user.email });
});

module.exports = router;
