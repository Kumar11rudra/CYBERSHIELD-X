const CommunityNote = require('../models/CommunityNote');
const { normalizeScanTarget, detectInputType } = require('../utils/validators');

const resolveTarget = (target) => {
  const normalizedTarget = normalizeScanTarget(target || '');
  if (!normalizedTarget) return null;

  const targetType = detectInputType(normalizedTarget);
  if (!targetType) return null;

  return { normalizedTarget, targetType };
};

const serializeNote = (note, currentUserId) => {
  const helpfulVoters = note.helpfulVoters || [];
  const userIdString = currentUserId ? String(currentUserId) : null;

  return {
    id: note._id,
    target: note.target,
    targetType: note.targetType,
    username: note.username,
    text: note.text,
    helpfulCount: note.helpfulCount || 0,
    votedByCurrentUser: userIdString ? helpfulVoters.some((voterId) => String(voterId) === userIdString) : false,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
};

const getCommunityNotes = async (req, res, next) => {
  try {
    const resolved = resolveTarget(req.query.target);
    if (!resolved) {
      return res.status(400).json({ error: 'Valid target is required to load community notes.' });
    }

    const notes = await CommunityNote.find({
      target: resolved.normalizedTarget,
      targetType: resolved.targetType,
    })
      .sort({ helpfulCount: -1, createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      target: resolved.normalizedTarget,
      targetType: resolved.targetType,
      notes: notes.map((note) => serializeNote(note, req.user?._id)),
    });
  } catch (error) {
    next(error);
  }
};

const createCommunityNote = async (req, res, next) => {
  try {
    const { target, text } = req.body;
    const resolved = resolveTarget(target);

    if (!resolved) {
      return res.status(400).json({ error: 'Enter a valid IOC before posting a note.' });
    }

    const normalizedText = String(text || '').trim();
    if (normalizedText.length < 4 || normalizedText.length > 500) {
      return res.status(400).json({ error: 'Community note must be between 4 and 500 characters.' });
    }

    const note = await CommunityNote.create({
      target: resolved.normalizedTarget,
      targetType: resolved.targetType,
      userId: req.user._id,
      username: req.user.username,
      text: normalizedText,
    });

    res.status(201).json({
      note: serializeNote(note.toObject(), req.user._id),
    });
  } catch (error) {
    next(error);
  }
};

const voteCommunityNote = async (req, res, next) => {
  try {
    const note = await CommunityNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Community note not found.' });
    }

    const currentUserId = String(req.user._id);
    const existingIndex = note.helpfulVoters.findIndex((voterId) => String(voterId) === currentUserId);

    if (existingIndex >= 0) {
      note.helpfulVoters.splice(existingIndex, 1);
    } else {
      note.helpfulVoters.push(req.user._id);
    }

    note.helpfulCount = note.helpfulVoters.length;
    await note.save();

    res.json({
      note: serializeNote(note.toObject(), req.user._id),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCommunityNotes,
  createCommunityNote,
  voteCommunityNote,
};
