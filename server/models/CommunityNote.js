const mongoose = require('mongoose');

const communityNoteSchema = new mongoose.Schema(
  {
    target: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['url', 'ip', 'domain', 'hash'],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 500,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulVoters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

communityNoteSchema.index({ target: 1, targetType: 1, helpfulCount: -1, createdAt: -1 });

module.exports = mongoose.model('CommunityNote', communityNoteSchema);
