const Revenue = require('../models/Revenue');
const User = require('../models/User');

class RevenueService {
  constructor() {
    this.markupPercent = parseFloat(process.env.PLATFORM_FEE_PERCENT) || 3;
  }

  calculateMarkup(originalAmount) {
    const fee = (originalAmount * this.markupPercent) / 100;
    return { originalAmount, markupPercent: this.markupPercent, fee, adjustedAmount: originalAmount + fee, platformEarns: fee };
  }

  async recordRevenue(trade, user) {
    const markup = this.calculateMarkup(trade.amount);
    
    const revenue = new Revenue({
      tradeId: trade._id, userId: user._id, symbol: trade.symbol, side: trade.side,
      originalAmount: trade.amount, markupPercent: this.markupPercent,
      platformFee: markup.fee, platformRevenue: markup.fee, totalTurnover: markup.adjustedAmount,
      date: new Date().toISOString().split('T')[0],
      month: new Date().toISOString().slice(0, 7),
      year: new Date().getFullYear()
    });
    await revenue.save();
    
    await User.findByIdAndUpdate(user._id, { $inc: { totalFeesPaid: markup.fee, totalTurnover: markup.adjustedAmount } });
    return revenue;
  }

  async getRevenueStats(timeframe = 'today') {
    const now = new Date();
    let matchCondition = {};
    if (timeframe === 'today') matchCondition = { date: now.toISOString().split('T')[0] };
    else if (timeframe === 'week') matchCondition = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
    else if (timeframe === 'month') matchCondition = { month: now.toISOString().slice(0, 7) };
    else if (timeframe === 'year') matchCondition = { year: now.getFullYear() };
    
    const stats = await Revenue.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, totalFees: { $sum: '$platformFee' }, totalTurnover: { $sum: '$totalTurnover' }, totalTrades: { $count: {} }, averageFee: { $avg: '$platformFee' } } }
    ]);
    
    const dailyBreakdown = await Revenue.aggregate([
      { $match: matchCondition },
      { $group: { _id: '$date', fees: { $sum: '$platformFee' }, turnover: { $sum: '$totalTurnover' }, trades: { $count: {} } } },
      { $sort: { _id: -1 } }, { $limit: 30 }
    ]);
    
    return { summary: stats[0] || { totalFees: 0, totalTurnover: 0, totalTrades: 0, averageFee: 0 }, dailyBreakdown, markupPercent: this.markupPercent };
  }

  async getAllTimeRevenue() {
    const revenue = await Revenue.aggregate([
      { $group: { _id: null, totalFees: { $sum: '$platformFee' }, totalTurnover: { $sum: '$totalTurnover' }, totalTrades: { $count: {} } } }
    ]);
    const monthlyBreakdown = await Revenue.aggregate([
      { $group: { _id: '$month', fees: { $sum: '$platformFee' }, turnover: { $sum: '$totalTurnover' }, trades: { $count: {} } } },
      { $sort: { _id: -1 } }
    ]);
    return { totalRevenue: revenue[0]?.totalFees || 0, totalTurnover: revenue[0]?.totalTurnover || 0, totalTrades: revenue[0]?.totalTrades || 0, monthlyBreakdown };
  }

  async getUserContribution(userId) {
    const revenue = await Revenue.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalFees: { $sum: '$platformFee' }, totalTurnover: { $sum: '$totalTurnover' }, tradeCount: { $count: {} } } }
    ]);
    const user = await User.findById(userId);
    return { username: user?.username, totalFees: revenue[0]?.totalFees || 0, totalTurnover: revenue[0]?.totalTurnover || 0, tradeCount: revenue[0]?.tradeCount || 0 };
  }
}

module.exports = new RevenueService();