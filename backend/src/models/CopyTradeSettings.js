const mongoose = require('mongoose');

const CopyTradeSettingsSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  masterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  maxFollowers: { type: Number, default: 100 },
  allocationPercent: { type: Number, default: 100 },
  feePercent: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CopyTradeSettings', CopyTradeSettingsSchema);