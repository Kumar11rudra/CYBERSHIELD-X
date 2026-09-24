'use strict';

/**
 * 🛡️ CyberShield X — Outbound Dispatcher Facade (Phase 81 Step 3)
 *
 * Exposes outbound dispatch orchestration interface under server/integrations/:
 * - enqueueDispatch
 * - processJob
 * - getDlq
 * - getDlqItem
 * - clearDlq
 * - calculateBackoff
 * - classifyError
 */

const OutboundDispatchService = require('../services/soc/OutboundDispatchService');

module.exports = OutboundDispatchService;
