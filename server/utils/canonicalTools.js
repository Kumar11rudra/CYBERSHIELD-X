const fs = require('fs');
const path = require('path');
const hostEnvironmentService = require('../services/HostEnvironmentService');

let cachedTools = null;

const NATIVE_TOOLS = new Set(['dns', 'whois', 'port', 'http', 'ssl', 'traceroute']);
const BROWSER_TOOLS = new Set(['jwt-parser', 'base64-decoder', 'url-sanitizer', 'hash-generator', 'hex-editor']);
const STRICT_BLOCKED = new Set([
  'sqlmap', 'trivy', 'nikto', 'aircrack-ng', 'ghidra', 'yara-rules', 'radare2', 'semgrep', 'gitleaks'
]);

function loadCanonicalTools() {
  if (cachedTools) return cachedTools;

  try {
    const esmPath = path.resolve(__dirname, '../../client/src/components/toolkit/toolConfig.js');
    if (!fs.existsSync(esmPath)) {
      return [];
    }

    const content = fs.readFileSync(esmPath, 'utf8');
    const cjsContent = content
      .replace(/export const TOOL_TYPES =/g, 'const TOOL_TYPES =')
      .replace(/export const TOOL_STATUS =/g, 'const TOOL_STATUS =')
      .replace(/export const INPUT_TYPES =/g, 'const INPUT_TYPES =')
      .replace(/export const CATEGORIES =/g, 'const CATEGORIES =')
      .replace(/export const CATEGORY_METADATA =/g, 'const CATEGORY_METADATA =')
      .replace(/export const getToolConfig =/g, 'const getToolConfig =')
      .replace(/export const getAllTools =/g, 'const getAllTools =')
      .replace(/export const getToolsByStatus =/g, 'const getToolsByStatus =')
      .replace(/export const getToolsByCategory =/g, 'const getToolsByCategory =')
      .replace(/export const getToolsByType =/g, 'const getToolsByType =')
      .replace(/export const getAllCategories =/g, 'const getAllCategories =')
      .replace(/export const isToolActive =/g, 'const isToolActive =')
      .replace(/export const getStatusBadge =/g, 'const getStatusBadge =')
      .replace(/export default TOOL_CONFIG;/g, '')
      + '\nmodule.exports = { TOOL_CONFIG, TOOL_STATUS, CATEGORIES };';

    const tmpPath = path.resolve(__dirname, `temp_tools_${Date.now()}.cjs`);
    fs.writeFileSync(tmpPath, cjsContent, 'utf8');
    const { TOOL_CONFIG } = require(tmpPath);
    try { fs.unlinkSync(tmpPath); } catch {}

    const toolList = Object.values(TOOL_CONFIG).map(t => {
      let executionTarget = 'CYBERSHIELD_API_ENGINE';
      if (NATIVE_TOOLS.has(t.id)) {
        executionTarget = 'HOST_NATIVE';
      } else if (BROWSER_TOOLS.has(t.id)) {
        executionTarget = 'CLIENT_BROWSER';
      } else if (STRICT_BLOCKED.has(t.id)) {
        executionTarget = 'BLOCKED_DEPENDENCY';
      }

      return {
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description,
        inputType: t.inputType,
        executionTarget,
        status: t.status
      };
    });

    cachedTools = toolList;
    return toolList;
  } catch (err) {
    console.warn('[CANONICAL TOOLS] Fallback to minimal set due to parse error:', err.message);
    return [];
  }
}

/**
 * Returns dynamic availability taking into account unlocked dependencies
 */
function getCanonicalToolsWithStatus() {
  const tools = loadCanonicalTools();
  return tools.map(t => {
    let available = true;
    let effectiveTarget = t.executionTarget;

    if (t.executionTarget === 'BLOCKED_DEPENDENCY') {
      if (hostEnvironmentService.unlockedTools && hostEnvironmentService.unlockedTools.has(t.id)) {
        available = true;
        effectiveTarget = 'HOST_NATIVE';
      } else {
        available = false;
      }
    }

    return {
      ...t,
      executionTarget: effectiveTarget,
      available
    };
  });
}

module.exports = {
  loadCanonicalTools,
  getCanonicalToolsWithStatus,
  NATIVE_TOOLS,
  BROWSER_TOOLS,
  STRICT_BLOCKED
};
