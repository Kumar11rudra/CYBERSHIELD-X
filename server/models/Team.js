const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique names for teams scoped to each organization
teamSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
