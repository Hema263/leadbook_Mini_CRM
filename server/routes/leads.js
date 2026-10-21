const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const requireAdmin = require('../middleware/auth');

const STATUSES = ['new', 'contacted', 'converted'];
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || '');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---------- PUBLIC: website contact form ---------- */
const formLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

router.post('/public', formLimiter, async (req, res) => {
  const { name, email, phone, message, source } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!isEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
  await Lead.create({ name, email, phone, message, source: source || 'Website form' });
  res.status(201).json({ ok: true });
});

/* ---------- ADMIN ONLY (everything below) ---------- */
router.use(requireAdmin);

// Validates :id once for every route that uses it.
router.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : res.status(400).json({ error: 'Invalid lead id' }));

// List with search, status filter, pagination
router.get('/', async (req, res) => {
  const { search = '', status = '', page = 1, limit = 20 } = req.query;
  const q = {};
  if (STATUSES.includes(status)) q.status = status;
  if (String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    q.$or = [{ name: rx }, { email: rx }, { source: rx }];
  }
  const p = Math.max(1, parseInt(page) || 1), l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const [leads, total] = await Promise.all([
    Lead.find(q).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
    Lead.countDocuments(q),
  ]);
  res.json({ leads, total, pages: Math.ceil(total / l) || 1 });
});

// Dashboard numbers
router.get('/stats', async (req, res) => {
  const rows = await Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const by = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const total = rows.reduce((n, r) => n + r.count, 0);
  const dueFollowUps = await Lead.countDocuments({
    followUpDate: { $lte: new Date() }, status: { $ne: 'converted' },
  });
  res.json({
    total, new: by.new || 0, contacted: by.contacted || 0, converted: by.converted || 0,
    conversionRate: total ? Math.round(((by.converted || 0) / total) * 100) : 0,
    dueFollowUps,
  });
});

// Admin adds a lead manually (phone call, referral, etc.)
router.post('/', async (req, res) => {
  const { name, email, phone, message, source } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!isEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
  res.status(201).json(await Lead.create({ name, email, phone, message, source: source || 'Manual entry' }));
});

// Update status and/or follow-up date (only these fields are allowed)
router.patch('/:id', async (req, res) => {
  const update = {};
  if (req.body.status !== undefined) {
    if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
    update.status = req.body.status;
  }
  if (req.body.followUpDate !== undefined) update.followUpDate = req.body.followUpDate || null;
  const lead = await Lead.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  lead ? res.json(lead) : res.status(404).json({ error: 'Lead not found' });
});

// Add a follow-up note (newest first)
router.post('/:id/notes', async (req, res) => {
  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Note cannot be empty' });
  const lead = await Lead.findByIdAndUpdate(
    req.params.id, { $push: { notes: { $each: [{ text }], $position: 0 } } }, { new: true });
  lead ? res.status(201).json(lead) : res.status(404).json({ error: 'Lead not found' });
});

router.delete('/:id', async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  lead ? res.json({ ok: true }) : res.status(404).json({ error: 'Lead not found' });
});

module.exports = router;
