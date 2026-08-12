const mongoose = require('mongoose');

const toolRegistrySchema = new mongoose.Schema({
  toolId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['live', 'partial', 'coming_soon', 'disabled'],
    default: 'coming_soon',
    index: true
  },
  backendTarget: {
    type: String,
    default: null
  },
  permissionLevel: {
    type: String,
    default: 'GUEST'
  },
  sandboxRequired: {
    type: Boolean,
    default: false
  },
  providerDependency: {
    type: String,
    default: null
  },
  executionMode: {
    type: String,
    default: 'sync'
  },
  enabled: {
    type: Boolean,
    default: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

const ToolRegistry = mongoose.model('ToolRegistry', toolRegistrySchema);
module.exports = ToolRegistry;
