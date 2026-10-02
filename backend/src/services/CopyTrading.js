const User = require('../models/User');
const Trade = require('../models/Trade');
const CopyTradeSettings = require('../models/CopyTradeSettings');
const derivTrading = require('./derivTradingService');
const revenueService = require('./revenueService');

class CopyTradingService {
  async followMaster(followerId, masterId, allocationPercent = 100) {
    const master = await User.findById(masterId);
    if (!master || !master.isMaster) throw new Error('Invalid master trader');
    
    await User.findByIdAndUpdate(followerId, { copyAllocation: allocationPercent, following: masterId });
    await User.findByIdAndUpdate(masterId, { $addToSet: { followers: followerId } });
    
    return { success: true };
  }

  async unfollow(followerId) {
    const follower = await User.findById(followerId);
    if (follower.following) {
      await User.findByIdAndUpdate(follower.following, { $pull: { followers: followerId } });
      await User.findByIdAndUpdate(followerId, { following: null });
    }
    return { success: true };
  }

  async copyMasterTrade(masterTrade) {
    const master = await User.findById(masterTrade.userId);
    if (!master?.isMaster) return [];
    
    const followers = await User.find({ following: master._id, isActive: true });
    const results = [];
    
    for (const follower of followers) {
      if (!follower.derivAccessToken) continue;
      
      try {
        const scaledAmount = masterTrade.amount * (follower.copyAllocation / 100);
        if (scaledAmount < 1) continue;
        
        const markup = revenueService.calculateMarkup(scaledAmount);
        await derivTrading.connect(follower.derivAccessToken);
        
        const proposal = await derivTrading.getProposal(masterTrade.symbol, markup.adjustedAmount, 60, masterTrade.contractType || 'CALL');
        const copyTrade = await derivTrading.buyContract(proposal.id, proposal.askPrice);
        
        const dbTrade = new Trade({
          userId: follower._id, symbol: masterTrade.symbol, side: masterTrade.side,
          amount: scaledAmount, totalPaid: markup.adjustedAmount, platformFee: markup.fee,
          entryPrice: proposal.askPrice, derivContractId: copyTrade.contractId,
          status: 'open', copiedFrom: masterTrade._id, isCopyTrade: true
        });
        await dbTrade.save();
        await revenueService.recordRevenue(dbTrade, follower);
        
        results.push({ follower: follower.username, success: true });
      } catch (error) {
        results.push({ follower: follower.username, success: false, error: error.message });
      }
    }
    return results;
  }
}

module.exports = new CopyTradingService();