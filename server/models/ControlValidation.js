const mongoose = require('mongoose');

const controlValidationSchema = new mongoose.Schema({
  validationId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  controlType: {
    type: String,
    enum: ['GOVERNANCE', 'DETECTION', 'COMPLIANCE', 'RELIABILITY', 'INTEGRATION', 'ACCESS', 'AUDIT'],
    required: true,
    index: true
  },
  source: { type: String, required: true },
  target: { type: String, required: true },
  expectedState: { type: mongoose.Schema.Types.Mixed, required: true },
  observedState: { type: mongoose.Schema.Types.Mixed, required: true },
  status: {
    type: String,
    enum: ['PASS', 'FAIL', 'PARTIAL', 'UNKNOWN', 'NOT_CONFIGURED', 'BLOCKED'],
    required: true,
    index: true
  },
  evidenceReferences: [{ type: String }],
  evaluatedAt: { type: Date, default: Date.now },
  checksum: { type: String, required: true }
}, {
  timestamps: true
});

controlValidationSchema.index({ organizationId: 1, controlType: 1, status: 1 });

module.exports = mongoose.models.ControlValidation || mongoose.model('ControlValidation', controlValidationSchema);
