const Trade = require('../models/Trade');
const User = require('../models/User');
const derivTrading = require('./derivTradingService');

class RiskManager {
  async checkUserRisk(userId, requestedAmount) {
    const user = await User.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = await Trade.find({ userId, status: 'closed', closedAt: { $gte: today } });
    const todayLoss = todayTrades.reduce((sum, t) => sum + (t.profitLoss < 0 ? t.profitLoss : 0), 0);
    
    if (Math.abs(todayLoss) >= user.riskProfile.maxDailyLoss) throw new Error('Daily loss limit reached');
    if (requestedAmount > user.riskProfile.maxPositionSize) throw new Error('Position size exceeds limit');
    
    const openTrades = await Trade.countDocuments({ userId, status: 'open' });
    if (openTrades >= 10) throw new Error('Maximum 10 open positions allowed');
    
    return true;
  }

  async monitorOpenTrades() {
    const openTrades = await Trade.find({ status: 'open' });
    
    for (const trade of openTrades) {
      try {
        const user = await User.findById(trade.userId);
        if (!user?.derivAccessToken) continue;
        
        await derivTrading.connect(user.derivAccessToken);
        const contract = await derivTrading.getContractResult(trade.derivContractId);
        
        if (contract?.is_sold) {
          trade.status = 'closed';
          trade.exitPrice = contract.sell_price;
          trade.profitLoss = contract.profit_loss;
          trade.profitLossPercent = (contract.profit_loss / trade.amount) * 100;
          trade.closedAt = new Date();
          await trade.save();
        }
      } catch (error) {
        console.error(`Risk monitor error: ${error.message}`);
      }
    }
  }
}

module.exports = new RiskManager();