require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log('Admin already exists:', existingAdmin.username);
    process.exit(0);
  }
  
  const admin = new User({
    username: 'admin',
    email: 'admin@encrypteddollarzone.com',
    password: await bcrypt.hash('Admin123!', 10),
    role: 'admin',
    kycStatus: 'verified',
    isActive: true
  });
  await admin.save();
  console.log('✅ Admin created!');
  console.log('   Username: admin');
  console.log('   Password: Admin123!');
  await mongoose.disconnect();
}

createAdmin();