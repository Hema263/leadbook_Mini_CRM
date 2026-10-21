// Creates the admin account and a few sample leads:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Lead = require('./models/Lead');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');

  await User.findOneAndUpdate({ email }, { email, password: await bcrypt.hash(password, 12) }, { upsert: true });
  console.log('Admin ready:', email);

  if (!(await Lead.countDocuments())) {
    const day = 86400000;
    await Lead.insertMany([
      { name: 'Priya Nair', email: 'priya@brightcafe.in', phone: '+91 98400 11122', source: 'Website form', message: 'Need a website for my cafe.', status: 'new' },
      { name: 'Arun Kumar', email: 'arun@kmtextiles.com', source: 'Referral', message: 'Looking for inventory software.', status: 'contacted', followUpDate: new Date(Date.now() - day), notes: [{ text: 'Called once, asked to ring back on Friday.' }] },
      { name: 'Meena Iyer', email: 'meena@studioiyer.com', source: 'Instagram', message: 'Brand identity + landing page.', status: 'converted', notes: [{ text: 'Signed the quote. Kickoff next week.' }] },
      { name: 'Rahul Verma', email: 'rahul@fitnest.app', source: 'Website form', message: 'Mobile app estimate please.', status: 'contacted', followUpDate: new Date(Date.now() + 3 * day) },
    ]);
    console.log('Sample leads added');
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
