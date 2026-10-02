const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true, lowercase: true },
  code: { type: String, required: true },
  purpose: { type: String, enum: ['signup', 'login'], required: true },
  // For signup — hold the pending user data until OTP is verified
  pendingUser: {
    firstName: String,
    lastName: String,
    email: String,
    password: String
  },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Auto-delete expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', OtpSchema);