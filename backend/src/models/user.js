const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'master'], default: 'user' },
  kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  isActive: { type: Boolean, default: true },

  derivUserId: { type: String, unique: true, sparse: true },
  derivAccessToken: { type: String },
  derivRefreshToken: { type: String },
  tokenExpiresAt: { type: Date },

  riskProfile: {
    maxDailyLoss: { type: Number, default: 1000 },
    maxPositionSize: { type: Number, default: 100 },
    stopLossPercent: { type: Number, default: 2 },
    takeProfitPercent: { type: Number, default: 5 }
  },

  isMaster: { type: Boolean, default: false },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  copyAllocation: { type: Number, default: 100 },

  totalFeesPaid: { type: Number, default: 0 },
  totalTurnover: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

UserSchema.pre('save', async function(next) {
  if (this.isModified('password') && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);