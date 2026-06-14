const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true, // Now optional to support unauthenticated scans
    },
    action: {
      type: String,
      required: true,
      index: true, // Removed strict enum to support new module actions like BREACH_CHECK_PHONE
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'warning'],
      default: 'success',
    },
    metadata: {
      ip: String,
      userAgent: String,
      device: String, // Browser/Platform
      os: String,
      hardware: {
        vendor: String, // e.g., Apple, Samsung
        model: String,  // e.g., iPhone 15
      },
      network: {
        isp: String,      // e.g., Reliance Jio
        type: { type: String },     // e.g., 4G, 5G, WiFi
      },
      location: {
        city: String,
        country: String,
        coordinates: [Number], // [longitude, latitude]
      },
      target: String, // For scans
      details: String, // General purpose
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who viewed the user
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We use our own timestamp
  }
);

// Indexed search for admin reporting
activityLogSchema.index({ userId: 1, timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
