const mongoose = require('mongoose');

const VirtualTradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['BUY', 'SELL'], required: true },
  amount: { type: Number, required: true },
  entryPrice: { type: Number, required: true },
  exitPrice: Number,
  payout: Number,
  profitLoss: Number,
  status: { type: String, enum: ['pending', 'won', 'lost'], default: 'pending' },
  resolvesAt: { type: Date, required: true },
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VirtualTrade', VirtualTradeSchema);