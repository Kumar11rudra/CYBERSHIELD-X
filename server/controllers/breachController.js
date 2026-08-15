const breachService = require('../services/breachService');
const logger = require('../utils/logger');

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email parameter is required.' });
    }
    const result = await breachService.checkEmailBreaches(email);
    return res.json(result);
  } catch (err) {
    logger.error(`[BREACH] Email check error: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Breach verification service failed.',
      detail: err.message
    });
  }
};

exports.checkPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Password parameter is required.' });
    }

    // Never log the plaintext password!
    logger.info(`[BREACH] Executing k-Anonymity password exposure verification`);
    const result = await breachService.checkPasswordBreach(password);
    return res.json(result);
  } catch (err) {
    logger.error(`[BREACH] Password verification error: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Password breach verification service failed.',
      detail: err.message
    });
  }
};

exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ success: false, error: 'Phone parameter is required.' });
    }
    const result = await breachService.checkPhoneBreaches(phone);
    return res.json(result);
  } catch (err) {
    logger.error(`[BREACH] Phone check error: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Phone breach verification service failed.',
      detail: err.message
    });
  }
};
