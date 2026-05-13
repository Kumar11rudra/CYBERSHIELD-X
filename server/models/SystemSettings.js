const mongoose = require('mongoose');

// Global platform-level settings controlled by Admin
const systemSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
  maintenanceMessage: {
    type: String,
    default: 'CyberShield X is undergoing scheduled maintenance. Back shortly.',
  },
  blockedIPs: [{ type: String }],
  allowedCountries: [{ type: String }],  // empty = all countries allowed
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
