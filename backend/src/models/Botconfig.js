const mongoose = require('mongoose');

const BotConfigSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  name: { type: String, default: 'Master Bot' },
  
  strategy: {
    type: { type: String, enum: ['signal_based', 'grid', 'trend_following'], default: 'signal_based' },
    timeframe: { type: String, enum: ['1m', '5m', '15m', '1h'], default: '5m' },
    indicators: {
      rsi: { enabled: Boolean, period: Number, overbought: Number, oversold: Number },
      macd: { enabled: Boolean, fastPeriod: Number, slowPeriod: Number, signalPeriod: Number }
    }
  },
  
  riskManagement: {
    maxTradeAmount: { type: Number, default: 100 },
    minTradeAmount: { type: Number, default: 10 },
    maxDailyTrades: { type: Number, default: 50 },
    maxDailyLoss: { type: Number, default: 1000 },
    stopLossPercent: { type: Number, default: 2 },
    takeProfitPercent: { type: Number, default: 5 }
  },
  
  signalSettings: {
    minStrength: { type: Number, min: 1, max: 10, default: 5 },
    allowedSymbols: [{ type: String, default: ['R_100'] }]
  },
  
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BotConfig', BotConfigSchema);