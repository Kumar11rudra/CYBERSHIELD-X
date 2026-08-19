'use strict';

/**
 * @module toolsController
 * @description Nexus Defensive Intelligence Tools — Thin HTTP adapter.
 * Delegating all logic to modular defensive services.
 */

const SmsService = require('../services/defensive/smsService');
const UpiService = require('../services/defensive/upiService');
const WhoisService = require('../services/defensive/whoisService');
const SslService = require('../services/defensive/sslService');
const PhishingService = require('../services/defensive/phishingService');

const { isPrivateOrLoopback } = require('../utils/ssrfValidator');
exports.isPrivateOrLoopback = isPrivateOrLoopback;

let _execCounter = 0;
const nextExecId = () => `nexus-${Date.now()}-${++_execCounter}`;

// SMS ANALYZER
exports.analyzeSMS = async (req, res) => {
  try {
    const message = req.body.message || req.body.text;
    const result = await SmsService.analyzeSMS(message);
    return res.json({ success: true, analysis: result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// UPI VERIFIER
exports.verifyUPI = async (req, res) => {
  try {
    const upiId = req.body.upiId || req.body.upi;
    const result = await UpiService.verifyUPI(upiId);
    return res.json({ success: true, analysis: result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// WHOIS LOOKUP
exports.whoisLookup = async (req, res) => {
  try {
    const { domain } = req.body;
    const execId = nextExecId();
    const result = await WhoisService.lookup(domain, execId);
    return res.json({
      success: true,
      executionId: execId,
      ...result
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// SSL CHECKER
exports.checkSSL = async (req, res) => {
  try {
    const { domain } = req.body;
    const execId = nextExecId();
    const result = await SslService.checkSSL(domain, execId);
    return res.json({
      success: true,
      executionId: execId,
      ...result
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// PHISHING DETECTOR
exports.detectPhishing = async (req, res) => {
  try {
    const { url } = req.body;
    const result = await PhishingService.detectPhishing(url);
    return res.json({ success: true, analysis: result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
