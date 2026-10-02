const BotConfig = require('../models/BotConfig');
const Signal = require('../models/Signal');
const Trade = require('../models/Trade');
const User = require('../models/User');
const derivTrading = require('./derivTradingService');
const revenueService = require('./revenueService');

class TradingBot {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.currentConfig = null;
  }

  async start() {
    this.currentConfig = await BotConfig.findOne({ isActive: true });
    if (!this.currentConfig) return;
    
    this.isRunning = true;
    const intervalMs = { '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000 }[this.currentConfig.strategy.timeframe] || 300000;
    this.interval = setInterval(async () => await this.runStrategy(), intervalMs);
  }

  async runStrategy() {
    if (!this.isRunning) return;
    this.currentConfig = await BotConfig.findOne({ isActive: true });
    if (!this.currentConfig) return this.stop();

    for (const symbol of this.currentConfig.signalSettings.allowedSymbols) {
      const signal = await this.getCombinedSignal(symbol);
      if (signal && signal.strength >= this.currentConfig.signalSettings.minStrength) {
        await this.executeBotTrade(symbol, signal);
      }
    }
  }

  async getCombinedSignal(symbol) {
    let strength = 0;
    let action = 'HOLD';
    
    const adminSignals = await Signal.find({ symbol, expiresAt: { $gt: new Date() } });
    for (const sig of adminSignals) {
      strength += sig.strength;
      if (sig.action !== 'HOLD') action = sig.action;
    }
    
    return strength > 0 ? { action, strength, symbol } : null;
  }

  async executeBotTrade(symbol, signal) {
    const config = this.currentConfig.riskManagement;
    const amount = Math.min(config.maxTradeAmount, Math.max(config.minTradeAmount, config.maxTradeAmount * (0.5 + Math.random() * 0.5)));
    const contractType = signal.action === 'BUY' ? 'CALL' : 'PUT';
    
    const users = await User.find({ isActive: true, role: 'user', derivAccessToken: { $exists: true } });
    
    for (const user of users) {
      try {
        const markup = revenueService.calculateMarkup(amount);
        await derivTrading.connect(user.derivAccessToken);
        
        const proposal = await derivTrading.getProposal(symbol, markup.adjustedAmount, 60, contractType);
        const trade = await derivTrading.buyContract(proposal.id, proposal.askPrice);
        
        const dbTrade = new Trade({
          userId: user._id,
          symbol, side: signal.action, amount, totalPaid: markup.adjustedAmount,
          platformFee: markup.fee, entryPrice: proposal.askPrice,
          derivContractId: trade.contractId, derivTransactionId: trade.transactionId,
          status: 'open', contractType
        });
        await dbTrade.save();
        await revenueService.recordRevenue(dbTrade, user);
      } catch (error) {
        console.error(`Bot trade failed for ${user.username}:`, error.message);
      }
    }
  }

  stop() {
    this.isRunning = false;
    if (this.interval) clearInterval(this.interval);
  }
}

module.exports = new TradingBot();