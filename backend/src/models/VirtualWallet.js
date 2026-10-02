const mongoose = require('mongoose');

const VirtualWalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 5400 },
  totalDeposited: { type: Number, default: 5400 },
  totalWon: { type: Number, default: 0 },
  totalLost: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VirtualWallet', VirtualWalletSchema);