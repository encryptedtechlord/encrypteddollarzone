const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['BUY', 'SELL'], required: true },
  amount: { type: Number, required: true },
  totalPaid: { type: Number },
  platformFee: { type: Number, default: 0 },
  entryPrice: { type: Number, required: true },
  exitPrice: Number,
  profitLoss: Number,
  profitLossPercent: Number,
  status: { type: String, enum: ['open', 'closed', 'cancelled', 'expired'], default: 'open' },
  
  derivContractId: { type: String },
  derivTransactionId: { type: String },
  duration: { type: Number, default: 60 },
  contractType: { type: String, enum: ['CALL', 'PUT'] },
  
  stopLoss: Number,
  takeProfit: Number,
  
  openedAt: { type: Date, default: Date.now },
  closedAt: Date,
  
  copiedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade' },
  isCopyTrade: { type: Boolean, default: false }
});

TradeSchema.index({ userId: 1, status: 1, openedAt: -1 });

module.exports = mongoose.model('Trade', TradeSchema);