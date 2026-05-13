const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  target: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2048,
  },
  targetType: {
    type: String,
    enum: ['ip', 'domain', 'url', 'hash'],
    required: true,
  },
  scanInterval: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily',
  },
  lastScanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan',
  },
  lastScanResult: {
    threatScore: Number,
    riskLevel: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  nextRunAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

watchlistSchema.index({ userId: 1, targetType: 1, target: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
