const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/admin');
const BotConfig = require('../models/BotConfig');
const Signal = require('../models/Signal');
const CopyTradeSettings = require('../models/CopyTradeSettings');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Revenue = require('../models/Revenue');
const Withdrawal = require('../models/Withdrawal');
const tradingBot = require('../services/tradingBot');
const revenueService = require('../services/revenueService');

router.use(verifyAdmin);

router.get('/bot-config', async (req, res) => {
  const config = await BotConfig.findOne();
  res.json(config || {});
});

router.post('/bot-config', async (req, res) => {
  let config = await BotConfig.findOne();
  if (config) Object.assign(config, req.body);
  else config = new BotConfig({ ...req.body, adminId: req.user.id });
  config.updatedAt = new Date();
  await config.save();
  
  if (config.isActive && !tradingBot.isRunning) await tradingBot.start();
  else if (!config.isActive && tradingBot.isRunning) tradingBot.stop();
  else if (config.isActive && tradingBot.isRunning) await tradingBot.updateConfig(config);
  res.json(config);
});

router.post('/bot-control', async (req, res) => {
  if (req.body.action === 'start') await tradingBot.start();
  else tradingBot.stop();
  res.json({ status: req.body.action === 'start' ? 'Bot started' : 'Bot stopped' });
});

router.post('/signals', async (req, res) => {
  try {
    const payload = { ...req.body, adminId: req.user.id };

    // If no expiry is provided, default to 1 hour from now
    if (!payload.expiresAt) {
      payload.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    } else {
      payload.expiresAt = new Date(payload.expiresAt);
    }

    // Default strength if missing
    if (!payload.strength) payload.strength = 5;

    const signal = new Signal(payload);
    await signal.save();
    res.status(201).json(signal);
  } catch (err) {
    console.error('Signal creation error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.get('/signals', async (req, res) => {
  res.json(await Signal.find().sort({ createdAt: -1 }));
});

router.delete('/signals/:id', async (req, res) => {
  await Signal.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

router.get('/users', async (req, res) => {
  const users = await User.find().select('-password -derivAccessToken -derivRefreshToken');
  res.json(users);
});

router.post('/users/:userId/set-master', async (req, res) => {
  await User.findByIdAndUpdate(req.params.userId, { isMaster: req.body.isMaster });
  res.json({ message: 'Updated' });
});

router.get('/stats', async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalTrades = await Trade.countDocuments();
  const totalVolume = (await Trade.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total || 0;
  res.json({ totalUsers, totalTrades, totalVolume });
});

router.get('/revenue/dashboard', async (req, res) => {
  const [todayStats, weekStats, monthStats, yearStats, allTimeStats, topUsers] = await Promise.all([
    revenueService.getRevenueStats('today'), revenueService.getRevenueStats('week'),
    revenueService.getRevenueStats('month'), revenueService.getRevenueStats('year'),
    revenueService.getAllTimeRevenue(),
    Revenue.aggregate([{ $group: { _id: '$userId', totalFees: { $sum: '$platformFee' }, totalTurnover: { $sum: '$totalTurnover' }, tradeCount: { $count: {} } } }, { $sort: { totalFees: -1 } }, { $limit: 10 }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } }])
  ]);
  res.json({ today: todayStats, week: weekStats, month: monthStats, year: yearStats, allTime: allTimeStats, topUsers });
});

router.get('/revenue/export', async (req, res) => {
  const revenues = await Revenue.find().populate('userId', 'username').sort({ createdAt: -1 });
  const csv = ['Date,User,Symbol,Trade Amount,Platform Fee (3%),Total Turnover', ...revenues.map(r => `${r.createdAt.toISOString().split('T')[0]},${r.userId?.username || 'Unknown'},${r.symbol},${r.originalAmount},${r.platformFee},${r.totalTurnover}`)].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=revenue_export.csv');
  res.send(csv);
});

router.get('/withdrawals', async (req, res) => {
  res.json(await Withdrawal.find().sort({ createdAt: -1 }));
});

router.post('/withdrawals/:id/approve', async (req, res) => {
  await Withdrawal.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: req.user.id, approvedAt: new Date() });
  res.json({ message: 'Approved' });
});

router.post('/withdrawals/:id/complete', async (req, res) => {
  await Withdrawal.findByIdAndUpdate(req.params.id, { status: 'completed', completedAt: new Date(), transactionId: req.body.transactionId });
  res.json({ message: 'Completed' });
});

router.post('/withdrawals/:id/reject', async (req, res) => {
  await Withdrawal.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: req.body.reason });
  res.json({ message: 'Rejected' });
});

module.exports = router;