const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'completed', 'rejected'], default: 'pending' },
  method: { type: String, enum: ['bank_transfer', 'crypto', 'paypal'], default: 'bank_transfer' },
  accountDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    cryptoAddress: String,
    paypalEmail: String
  },
  transactionId: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  completedAt: Date,
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);