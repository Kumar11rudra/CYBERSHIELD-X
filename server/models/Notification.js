const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
      required: false,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['alert', 'info', 'event'],
      default: 'alert',
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'high', 'critical'],
      default: 'info',
    },
    category: {
      type: String,
      enum: ['vulnerability', 'port', 'ssl', 'ioc', 'auth'],
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

notificationSchema.post('save', async function (doc) {
  try {
    const { triggerWebhookForNotification } = require('../services/webhookService');
    triggerWebhookForNotification(doc).catch(err => {
      console.error('[WEBHOOK-TRIGGER-ERROR]', err.message);
    });
  } catch (err) {
    console.error('[WEBHOOK-TRIGGER-REQUIRE-ERROR]', err.message);
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
