const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const copyTrading = require('../services/copyTrading');
const User = require('../models/User');

router.post('/follow/:masterId', authenticate, async (req, res) => {
  try {
    const result = await copyTrading.followMaster(req.user.id, req.params.masterId, req.body.allocationPercent || 100);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/unfollow', authenticate, async (req, res) => {
  res.json(await copyTrading.unfollow(req.user.id));
});

router.get('/masters', authenticate, async (req, res) => {
  const masters = await User.find({ isMaster: true, isActive: true }).select('username createdAt followers');
  res.json(masters);
});

router.get('/status', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id).populate('following', 'username');
  res.json({ isFollowing: !!user.following, master: user.following, allocation: user.copyAllocation });
});

module.exports = router;