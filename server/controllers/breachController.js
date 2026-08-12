const breachService = require('../services/breachService');

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email parameter is required.' });
    }
    const result = await breachService.checkEmailBreaches(email);
    return res.json(result);
  } catch (err) {
    if (err.message === 'ENZOIC_API_KEY_NOT_CONFIGURED') {
      return res.status(503).json({
        success: false,
        error: 'Vulnerability/breach monitoring provider is currently unavailable. Enzoic API Key is not configured.'
      });
    }
    return res.status(503).json({
      success: false,
      error: 'Breach verification service failed.',
      detail: err.message
    });
  }
};

exports.checkPhone = async (req, res) => {
  // Phone breach checking requires dedicated carrier API access.
  return res.status(503).json({
    success: false,
    error: 'Legitimate phone breach verification provider is currently unavailable. No API credentials configured.'
  });
};

exports.checkPassword = async (req, res) => {
  // Password exposure checking requires specific third-party lookup credentials.
  return res.status(503).json({
    success: false,
    error: 'Legitimate password exposure verification provider is currently unavailable. No API credentials configured.'
  });
};
