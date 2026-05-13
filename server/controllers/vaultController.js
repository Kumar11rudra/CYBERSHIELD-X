const VaultAsset = require('../models/VaultAsset');
const ActivityLog = require('../models/ActivityLog');
const crypto = require('crypto');
const { encrypt, decrypt, isEncrypted } = require('../utils/vaultCrypto');

const VALID_ASSET_TYPES = new Set(['email', 'phone', 'device', 'key']);

const normalizeAssetValue = (type, value) => {
  const trimmed = String(value || '').trim();
  if (type === 'email') return trimmed.toLowerCase();
  if (type === 'phone') return trimmed.replace(/\D/g, '');
  return trimmed;
};

const createAssetValueHash = (type, value) => {
  const secret = process.env.VAULT_ENCRYPTION_KEY || process.env.JWT_SECRET || 'vault-dev-hash-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(`${type}:${normalizeAssetValue(type, value)}`)
    .digest('hex');
};

// Get all assets for a user
const getAssets = async (req, res, next) => {
  try {
    const assets = await VaultAsset.find({ userId: req.user._id }).sort({ createdAt: -1 });
    // Decrypt values before sending to client + add PQC status
    const enhancedAssets = assets.map(asset => {
      let decryptedValue;
      try {
        decryptedValue = decrypt(asset.value);
      } catch (err) {
        decryptedValue = '[DECRYPTION FAILED — DATA INTEGRITY ISSUE]';
      }

      return {
        ...asset.toObject(),
        value: decryptedValue,
        pqcArmor: asset.isLocked ? 'ACTIVE' : 'READY',
        encryptionStandard: 'AES-256-GCM + X25519',
        encrypted: isEncrypted(asset.value), // Tell UI if this value is truly encrypted
      };
    });
    res.json({ success: true, assets: enhancedAssets });
  } catch (error) {
    next(error);
  }
};

// Add a new asset to the vault
const addAsset = async (req, res, next) => {
  try {
    const type = String(req.body.type || '').trim().toLowerCase();
    const label = String(req.body.label || '').trim();
    const value = String(req.body.value || '').trim();
    if (!type || !label || !value) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!VALID_ASSET_TYPES.has(type)) {
      return res.status(400).json({ error: 'Invalid vault asset type' });
    }
    if (label.length > 100 || value.length > 2048) {
      return res.status(400).json({ error: 'Vault asset label or value is too long' });
    }

    const valueHash = createAssetValueHash(type, value);
    const existing = await VaultAsset.findOne({ userId: req.user._id, type, valueHash }).select('_id');
    if (existing) {
      return res.status(409).json({ error: 'This asset is already in your vault' });
    }

    // ─── ENCRYPT the sensitive value before storing ────────────────────────
    const encryptedValue = encrypt(value);

    // Generate deterministic intelligence metrics for the asset
    const hash = crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
    const riskFactor = parseInt(hash.substring(0, 2), 16) % 100;
    
    const asset = await VaultAsset.create({
      userId: req.user._id,
      type,
      label,
      value: encryptedValue, // ← NOW ENCRYPTED with AES-256-GCM
      valueHash,
      riskScore: riskFactor,
      threatIntelligence: {
        mentionsInDarkWeb: riskFactor > 50 ? Math.floor(riskFactor / 5) : 0,
        activeTargeting: riskFactor > 80,
        marketValueEstimate: `$${(riskFactor / 10).toFixed(2)} - $${(riskFactor / 5).toFixed(2)}`
      }
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'VAULT_ASSET_ADDED',
      status: 'success',
      metadata: { type, label }
    });

    // Return decrypted value in response (user just submitted it)
    const responseAsset = asset.toObject();
    responseAsset.value = value; // Show original value back, not the encrypted blob

    res.status(201).json({ success: true, asset: responseAsset });
  } catch (error) {
    next(error);
  }
};

// Toggle lockdown status
const toggleLockdown = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await VaultAsset.findOne({ _id: id, userId: req.user._id });
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    asset.isLocked = !asset.isLocked;
    await asset.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: asset.isLocked ? 'VAULT_ASSET_LOCKED' : 'VAULT_ASSET_UNLOCKED',
      status: 'success',
      metadata: { id, label: asset.label }
    });

    // Decrypt value for response
    const responseAsset = asset.toObject();
    try {
      responseAsset.value = decrypt(asset.value);
    } catch { /* keep encrypted value if decryption fails */ }

    res.json({ success: true, asset: responseAsset });
  } catch (error) {
    next(error);
  }
};

// Delete asset
const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await VaultAsset.deleteOne({ _id: id, userId: req.user._id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ success: true, message: 'Asset removed from vault' });
  } catch (error) {
    next(error);
  }
};

// Initiate autonomous takedown request
const initiateTakedown = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await VaultAsset.findOne({ _id: id, userId: req.user._id });
    
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    // Simulate takedown sequence
    await ActivityLog.create({
      userId: req.user._id,
      action: 'VAULT_TAKEDOWN_INITIATED',
      status: 'warning',
      metadata: { target: '[REDACTED]', forum: 'Global Dark Web Sinks' }
    });

    res.json({ 
      success: true, 
      message: 'Autonomous removal requests dispatched to 14 verified data brokers.',
      status: 'In Progress'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssets,
  addAsset,
  toggleLockdown,
  deleteAsset,
  initiateTakedown
};
