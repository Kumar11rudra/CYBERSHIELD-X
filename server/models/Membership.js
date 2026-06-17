const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'analyst', 'viewer'],
      default: 'viewer',
      required: true,
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Enforce unique memberships for users within each organization
membershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Membership', membershipSchema);
