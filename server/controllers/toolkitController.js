const executionDispatcher = require('../services/ExecutionDispatcher');
const SocketNotificationService = require('../services/SocketNotificationService');

const sanitizeTarget = (target) => {
  if (typeof target !== 'string') throw new Error('Target must be a string');
  const trimmed = target.trim();
  const shellMetaChars = /[;&|`$\(\)<>\n\r\t]/;
  if (shellMetaChars.test(trimmed)) throw new Error('Target contains unsafe shell control characters');
  return trimmed;
};

// Map legacy tool IDs to new V13 capability IDs
const legacyToCapabilityMap = {
    'UrlEngine': 'UrlEngine.scan',
    'UrlEngine': 'UrlEngine.scan',
    'wazuh': 'wazuh.audit',
    'whois': 'whois.scan',
    'ssl': 'ssl.scan',
    'email-verifier': 'email.verify',
    'upi-verifier': 'upi.verify',
    'sqlmap': 'sqlmap.scan',
    'hashcat': 'hashcat.crack',
    'nmap': 'nmap.scan',
    'metasploit': 'metasploit.exploit',
    'wireshark': 'wireshark.capture',
    'burp': 'burp.scan',
    'zap': 'zap.scan',
    'nikto': 'nikto.scan',
    'gobuster': 'gobuster.scan',
    'john': 'john.crack',
    'hydra': 'hydra.crack',
    'aircrack': 'aircrack.crack',
    'kismet': 'kismet.scan',
    'autopsy': 'autopsy.analyze',
    'volatility': 'volatility.analyze',
    'ghidra': 'ghidra.analyze',
    'radare2': 'radare2.analyze'
};

const executeTool = async (req, res) => {
  const { toolId, target, socketId } = req.body;
  const io = req.app.get('io');
  const userId = req.user ? req.user._id : null;
  const notifier = new SocketNotificationService(io);

  try {
    if (!toolId || !target) return res.status(400).json({ error: 'Tool ID and Target are required' });

    const capabilityId = legacyToCapabilityMap[toolId];
    if (!capabilityId) return res.status(400).json({ error: `Tool ${toolId} not available. Check back later!` });

    const cleanTarget = sanitizeTarget(target);
    const capability = executionDispatcher.resolveCapability(capabilityId);
    if (!capability) return res.status(400).json({ error: `Capability ${capabilityId} not registered.` });

    const requestDTO = {
        requestId: `req-${Date.now()}`,
        target: cleanTarget,
        capabilityId,
        userId
    };

    notifier.emitToolLog(socketId, { message: `[V13-PIPELINE] Initializing ${capability.name}...`, type: 'info' });

    if (capability.supportsStreaming) {
        res.json({ success: true, status: 'pending', message: 'Streaming scan started.' });
        
        try {
            const result = await executionDispatcher.dispatch(requestDTO, (progress) => {
                progress.events?.forEach(evt => {
                    notifier.emitToolLog(socketId, { message: evt.message || evt.description, type: evt.type || 'info' });
                });
            });
            notifier.emitToolComplete(socketId, result);
        } catch (e) {
            notifier.emitToolLog(socketId, { message: `[ERROR] ${e.message}`, type: 'error' });
        }
    } else {
        const result = await executionDispatcher.dispatch(requestDTO);
        res.json({ success: true, report: result.normalizedResult, rawOutput: JSON.stringify(result.normalizedResult, null, 2) });
    }
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

module.exports = { executeTool };
