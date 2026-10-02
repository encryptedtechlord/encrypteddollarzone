const mongoose = require('mongoose');

const SignalSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  action: { type: String, enum: ['BUY', 'SELL', 'HOLD'], required: true },
  strength: { type: Number, min: 1, max: 10, default: 5 },
  message: String,
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Signal', SignalSchema);