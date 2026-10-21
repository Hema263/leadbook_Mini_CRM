const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: { createdAt: true, updatedAt: false } });

const leadSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, maxlength: 100 },
  email:   { type: String, required: true, trim: true, lowercase: true },
  phone:   { type: String, trim: true, default: '' },
  message: { type: String, trim: true, maxlength: 2000, default: '' },
  source:  { type: String, trim: true, default: 'Website form' },
  status:  { type: String, enum: ['new', 'contacted', 'converted'], default: 'new' },
  followUpDate: { type: Date, default: null },
  notes:   [noteSchema],
}, { timestamps: true }); // createdAt = when the lead arrived, updatedAt = last change

module.exports = mongoose.model('Lead', leadSchema);
