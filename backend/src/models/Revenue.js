const mongoose = require('mongoose');

const RevenueSchema = new mongoose.Schema({
  tradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  symbol: { type: String, required: true },
  side: { type: String, required: true },
  originalAmount: { type: Number, required: true },
  markupPercent: { type: Number, required: true, default: 3 },
  
  platformFee: { type: Number, required: true },
  platformRevenue: { type: Number, required: true },
  totalTurnover: { type: Number, required: true },
  
  isPaidOut: { type: Boolean, default: false },
  paidOutAt: Date,
  payoutTransactionId: String,
  
  date: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  
  createdAt: { type: Date, default: Date.now }
});

RevenueSchema.index({ userId: 1, createdAt: -1 });
RevenueSchema.index({ date: 1, month: 1 });

module.exports = mongoose.model('Revenue', RevenueSchema);