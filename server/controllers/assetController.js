const Asset = require('../models/Asset');
const Scan = require('../models/Scan');
const logger = require('../utils/logger');

// Recalculates an asset's risk score by looking up the latest completed scan for its hostname
const recalculateAssetRisk = async (userId, hostname, organizationId) => {
  try {
    const scanQuery = organizationId
      ? { organizationId, target: { $regex: new RegExp(hostname.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') }, status: 'completed' }
      : { userId, organizationId: { $exists: false }, target: { $regex: new RegExp(hostname.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') }, status: 'completed' };

    const latestScan = await Scan.findOne(scanQuery).sort({ createdAt: -1 });

    if (latestScan) {
      const assetQuery = organizationId
        ? { organizationId, hostname }
        : { userId, hostname, organizationId: { $exists: false } };

      await Asset.findOneAndUpdate(
        assetQuery,
        {
          lastRiskScore: latestScan.threatScore,
          lastScanAt: latestScan.createdAt
        }
      );
    }
  } catch (err) {
    logger.error(`[ASSETS] Risk recalculation failed for ${hostname}: ${err.message}`);
  }
};

const getAssets = async (req, res, next) => {
  try {
    const query = req.organizationId
      ? { organizationId: req.organizationId }
      : { userId: req.user._id, organizationId: { $exists: false } };

    const assets = await Asset.find(query).sort({ createdAt: -1 });
    res.json({ success: true, assets });
  } catch (error) {
    next(error);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const { hostname, ip, tags, environment, owner, assetType, criticality, status, teamId } = req.body;

    if (!hostname || !assetType) {
      return res.status(400).json({ error: 'Hostname and Asset Type are required.' });
    }

    const cleanHostname = hostname.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

    // Check duplicate
    const checkQuery = req.organizationId
      ? { organizationId: req.organizationId, hostname: cleanHostname }
      : { userId: req.user._id, hostname: cleanHostname, organizationId: { $exists: false } };

    const exists = await Asset.findOne(checkQuery);
    if (exists) {
      return res.status(409).json({ error: 'An asset with this hostname already exists.' });
    }

    const asset = await Asset.create({
      userId: req.user._id,
      organizationId: req.organizationId || undefined,
      teamId: teamId || undefined,
      hostname: cleanHostname,
      ip,
      tags: tags || [],
      environment: environment || 'Production',
      owner: owner || 'System',
      assetType,
      criticality: criticality || 'Medium',
      status: status || 'active'
    });

    // Attempt initial risk mapping
    await recalculateAssetRisk(req.user._id, cleanHostname, req.organizationId);
    const updatedAsset = await Asset.findById(asset._id);

    logger.info(`[ASSETS] Created new asset: ${cleanHostname} [${assetType}]`);
    res.status(201).json({ success: true, asset: updatedAsset });
  } catch (error) {
    next(error);
  }
};

const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ip, tags, environment, owner, criticality, status, teamId } = req.body;

    const query = req.organizationId
      ? { _id: id, organizationId: req.organizationId }
      : { _id: id, userId: req.user._id, organizationId: { $exists: false } };

    const asset = await Asset.findOne(query);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found or access denied.' });
    }

    if (ip !== undefined) asset.ip = ip;
    if (tags !== undefined) asset.tags = tags;
    if (environment !== undefined) asset.environment = environment;
    if (owner !== undefined) asset.owner = owner;
    if (criticality !== undefined) asset.criticality = criticality;
    if (status !== undefined) asset.status = status;
    if (teamId !== undefined) asset.teamId = teamId || null;

    await asset.save();
    
    // Recalculate risk on updates
    await recalculateAssetRisk(req.user._id, asset.hostname, req.organizationId);
    const updatedAsset = await Asset.findById(id);

    res.json({ success: true, asset: updatedAsset });
  } catch (error) {
    next(error);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = req.organizationId
      ? { _id: id, organizationId: req.organizationId }
      : { _id: id, userId: req.user._id, organizationId: { $exists: false } };

    const asset = await Asset.findOneAndDelete(query);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found or access denied.' });
    }

    logger.info(`[ASSETS] Removed asset: ${asset.hostname}`);
    res.json({ success: true, message: 'Asset successfully deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  recalculateAssetRisk
};
