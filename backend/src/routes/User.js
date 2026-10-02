const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Withdrawal = require('../models/Withdrawal');
const Revenue = require('../models/Revenue');

router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;
    if (amount < (process.env.MIN_WITHDRAWAL_AMOUNT || 50)) return res.status(400).json({ error: `Minimum withdrawal $${process.env.MIN_WITHDRAWAL_AMOUNT || 50}` });
    
    const earnings = await Revenue.aggregate([{ $match: { userId: req.user.id } }, { $group: { _id: null, total: { $sum: '$platformFee' } } }]);
    const pendingWithdrawals = await Withdrawal.aggregate([{ $match: { userId: req.user.id, status: { $in: ['pending', 'approved'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const availableBalance = (earnings[0]?.total || 0) - (pendingWithdrawals[0]?.total || 0);
    
    if (amount > availableBalance) return res.status(400).json({ error: 'Insufficient balance' });
    
    const withdrawal = new Withdrawal({ userId: req.user.id, amount, method, accountDetails });
    await withdrawal.save();
    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/earnings', authenticate, async (req, res) => {
  const earnings = await Revenue.aggregate([{ $match: { userId: req.user.id } }, { $group: { _id: null, total: { $sum: '$platformFee' } } }]);
  const pendingWithdrawals = await Withdrawal.aggregate([{ $match: { userId: req.user.id, status: { $in: ['pending', 'approved'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  res.json({ availableBalance: (earnings[0]?.total || 0) - (pendingWithdrawals[0]?.total || 0), totalEarned: earnings[0]?.total || 0, pendingWithdrawals: pendingWithdrawals[0]?.total || 0 });
});

router.get('/withdrawals', authenticate, async (req, res) => {
  res.json(await Withdrawal.find({ userId: req.user.id }).sort({ createdAt: -1 }));
});

module.exports = router;