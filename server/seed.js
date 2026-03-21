require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = new User({
    name: 'AGS Admin',
    email: 'admin@ags.com',
    password: 'admin123',
    role: 'admin',
    assignedClasses: [],
  });
  await admin.save();
  console.log('✅ Admin created: admin@ags.com / admin123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
