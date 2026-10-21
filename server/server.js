require('dotenv').config();
require('express-async-errors'); // lets errors thrown inside async routes reach the error handler
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const mongoose = require('mongoose');

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('Missing JWT_SECRET or MONGO_URI. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
// The public form endpoint must be callable from any website. The admin API still
// needs a token, so open CORS does not expose lead data.
app.use(cors());
app.use(express.json({ limit: '20kb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use(express.static(path.join(__dirname, 'public'))); // demo contact form at /contact.html

// Central error handler: any failure in a route ends up here.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}).catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
