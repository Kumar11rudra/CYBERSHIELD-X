const { generateSecurityGuidance } = require('../services/aiService');

const processChat = async (req, res, next) => {
  try {
    const { message, context, tool } = req.body;
    const user = req.user;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const currentName = user?.preferredNickname || user?.username || 'Explorer Dost';
    const aiContext = `User: ${currentName}, Path: ${context?.currentPath || 'Dashboard'}, LoggedIn: ${context?.isLoggedIn ? 'Yes' : 'No'}`;

    const intel = await generateSecurityGuidance(tool || 'General Chat', message, aiContext);

    if (intel.error) {
      return res.status(503).json({ error: intel.error });
    }

    let rawText = intel.guidance || '🤖 No response.';

    // Action parsing logic
    let action = null;
    const actionMatch = rawText.match(/\[ACTION:\s*({.*?})\]/);
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
      } catch (_) {}
      rawText = rawText.replace(actionMatch[0], '').trim();
    }

    return res.json({
      success: true,
      data: {
        text: rawText,
        action,
        mode: 'ultra',
        model: 'local',
        source: intel.source
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { processChat };
