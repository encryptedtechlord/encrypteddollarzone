require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to:', process.env.MONGODB_URI);

  const existing = await User.findOne({ username: 'admin' });
  console.log('Existing admin found:', existing ? 'YES' : 'NO');

  const hashed = await bcrypt.hash('Admin123!', 10);

  const result = await User.updateOne(
    { username: 'admin' },
    {
      $set: {
        password: hashed,
        role: 'admin',
        isActive: true,
        kycStatus: 'verified',
        email: 'admin@encrypteddollarzone.com'
      },
      $setOnInsert: { username: 'admin' }
    },
    { upsert: true }
  );

  console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount, 'Upserted:', result.upsertedCount);

  const verify = await User.findOne({ username: 'admin' });
  const ok = await bcrypt.compare('Admin123!', verify.password);
  console.log('Password verification after reset:', ok ? 'PASS ✅' : 'FAIL ❌');

  await mongoose.disconnect();
  process.exit(0);
})();