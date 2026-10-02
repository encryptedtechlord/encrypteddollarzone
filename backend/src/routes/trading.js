const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateTrade } = require('../middleware/validation');
const User = require('../models/User');
const Trade = require('../models/Trade');
const derivTrading = require('../services/derivTradingService');
const riskManager = require('../services/riskManager');
const copyTrading = require('../services/copyTrading');
const revenueService = require('../services/revenueService');

router.post('/trade', authenticate, validateTrade, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.derivAccessToken) return res.status(400).json({ error: 'Connect Deriv account first' });
    
    const markup = revenueService.calculateMarkup(req.body.amount);
    await riskManager.checkUserRisk(user._id, markup.adjustedAmount);
    await derivTrading.connect(user.derivAccessToken);
    
    const contractType = req.body.side === 'BUY' ? 'CALL' : 'PUT';
    const proposal = await derivTrading.getProposal(req.body.symbol, markup.adjustedAmount, req.body.duration || 60, contractType);
    const derivTrade = await derivTrading.buyContract(proposal.id, proposal.askPrice);
    
    const trade = new Trade({
      userId: user._id, symbol: req.body.symbol, side: req.body.side, amount: req.body.amount,
      totalPaid: markup.adjustedAmount, platformFee: markup.fee, entryPrice: proposal.askPrice,
      derivContractId: derivTrade.contractId, derivTransactionId: derivTrade.transactionId,
      status: 'open', contractType, duration: req.body.duration || 60
    });
    await trade.save();
    await revenueService.recordRevenue(trade, user);
    
    if (user.isMaster) await copyTrading.copyMasterTrade(trade);
    
    res.json({ success: true, trade, markupApplied: markup.markupPercent, feeCollected: markup.fee });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/balance', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.derivAccessToken) return res.json({ balance: 0, connected: false });
    await derivTrading.connect(user.derivAccessToken);
    const balance = await derivTrading.getBalance();
    res.json({ balance: balance.balance, currency: balance.currency, connected: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/trades', authenticate, async (req, res) => {
  const trades = await Trade.find({ userId: req.user.id }).sort({ openedAt: -1 }).limit(100);
  res.json(trades);
});

router.get('/summary', authenticate, async (req, res) => {
  const trades = await Trade.find({ userId: req.user.id });
  const totalProfit = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const winningTrades = trades.filter(t => t.profitLoss > 0).length;
  res.json({ totalTrades: trades.length, totalProfit, winRate: trades.length ? (winningTrades / trades.length * 100).toFixed(2) : 0, openPositions: trades.filter(t => t.status === 'open').length });
});

module.exports = router;