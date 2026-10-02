const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const VirtualWallet = require('../models/VirtualWallet');
const VirtualTrade = require('../models/VirtualTrade');

async function getOrCreateWallet(userId) {
  let wallet = await VirtualWallet.findOne({ userId });
  if (!wallet) {
    wallet = await VirtualWallet.create({ userId, balance: 5400, totalDeposited: 5400 });
  }
  return wallet;
}

router.get('/wallet', authenticate, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trades', authenticate, async (req, res) => {
  try {
    const trades = await VirtualTrade.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/trade', authenticate, async (req, res) => {
  try {
    const { symbol, side, amount, duration } = req.body;
    const wallet = await getOrCreateWallet(req.user.id);

    if (amount < 1) return res.status(400).json({ error: 'Minimum trade is $1' });
    if (amount > wallet.balance) return res.status(400).json({ error: 'Insufficient balance' });
    if (!['BUY', 'SELL'].includes(side)) return res.status(400).json({ error: 'Invalid side' });

    const basePrice = { R_10: 6100, R_25: 2500, R_50: 1500, R_75: 750, R_100: 950 }[symbol] || 1000;
    const entryPrice = basePrice + (Math.random() * 20 - 10);

    wallet.balance -= amount;
    wallet.updatedAt = new Date();
    await wallet.save();

    const durationSec = Math.max(3, Math.min(duration || 3, 60));
    const trade = await VirtualTrade.create({
      userId: req.user.id,
      symbol,
      side,
      amount,
      entryPrice,
      status: 'pending',
      resolvesAt: new Date(Date.now() + durationSec * 1000)
    });

    res.status(201).json({ trade, wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resolve/:tradeId', authenticate, async (req, res) => {
  try {
    const trade = await VirtualTrade.findOne({ _id: req.params.tradeId, userId: req.user.id });
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'pending') return res.json({ trade });

    if (new Date() < trade.resolvesAt) {
      return res.status(400).json({ error: 'Trade not ready to resolve yet' });
    }

    const wallet = await getOrCreateWallet(req.user.id);
    const won = Math.random() < 0.55;

    if (won) {
      const payout = trade.amount * 1.9;
      wallet.balance += payout;
      wallet.totalWon += (payout - trade.amount);
      wallet.wins += 1;
      trade.status = 'won';
      trade.payout = payout;
      trade.profitLoss = payout - trade.amount;
      trade.exitPrice = trade.entryPrice + (Math.random() * 10);
    } else {
      wallet.totalLost += trade.amount;
      wallet.losses += 1;
      trade.status = 'lost';
      trade.payout = 0;
      trade.profitLoss = -trade.amount;
      trade.exitPrice = trade.entryPrice - (Math.random() * 10);
    }

    trade.resolvedAt = new Date();
    wallet.updatedAt = new Date();

    await trade.save();
    await wallet.save();

    res.json({ trade, wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset', authenticate, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    wallet.balance = 5400;
    wallet.totalDeposited = 5400;
    wallet.totalWon = 0;
    wallet.totalLost = 0;
    wallet.wins = 0;
    wallet.losses = 0;
    wallet.updatedAt = new Date();
    await wallet.save();

    await VirtualTrade.deleteMany({ userId: req.user.id });

    res.json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;