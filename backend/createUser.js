require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const existing = await User.findOne({ username: 'user' });

    if (existing) {
      console.log('User already exists, resetting password...');
      existing.password = await bcrypt.hash('User123!', 10);
      existing.role = 'user';
      existing.isActive = true;
      existing.kycStatus = 'verified';
      await existing.save();
      console.log('✅ User password reset to User123!');
    } else {
      const user = new User({
        username: 'user',
        email: 'user@encrypteddollarzone.com',
        password: 'User123!',
        role: 'user',
        kycStatus: 'verified',
        isActive: true
      });
      await user.save();
      console.log('✅ User created!');
      console.log('   Username: user');
      console.log('   Password: User123!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();