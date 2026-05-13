const Scan = require('../models/Scan');
const { generateScanReport } = require('../services/pdfExport');

const parsePositiveInt = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getHistory = async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };
    if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
    if (req.query.targetType) filter.targetType = req.query.targetType;
    if (req.query.search) {
      const search = String(req.query.search).trim().slice(0, 100);
      if (search) filter.target = { $regex: escapeRegex(search), $options: 'i' };
    }

    const [scans, total] = await Promise.all([
      Scan.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-breakdown'),
      Scan.countDocuments(filter),
    ]);

    res.json({
      scans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getScanById = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json({ scan });
  } catch (error) {
    next(error);
  }
};

const deleteScan = async (req, res, next) => {
  try {
    const scan = await Scan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json({ message: 'Scan deleted' });
  } catch (error) {
    next(error);
  }
};

const exportScanPDF = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const pdfBuffer = await generateScanReport(scan, req.user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cybershield-scan-${scan._id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const toggleScanShare = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    scan.isPublic = !scan.isPublic;
    await scan.save();
    res.json({ message: scan.isPublic ? 'Scan is now public' : 'Scan is now private', isPublic: scan.isPublic });
  } catch (error) {
    next(error);
  }
};

const getPublicScan = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      isPublic: true,
    });
    if (!scan) return res.status(404).json({ error: 'Scan not found or not public' });

    res.json({ scan });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistory, getScanById, deleteScan, exportScanPDF, toggleScanShare, getPublicScan };
