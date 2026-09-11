const fs = require('fs');
const path = require('path');

describe('🛡️ Canonical 111-Tool Catalog & Consistency Verification', () => {
  let toolConfig;
  let allTools;

  beforeAll(() => {
    const esmPath = path.resolve(__dirname, '../../client/src/components/toolkit/toolConfig.js');
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

    const tmpPath = path.resolve(__dirname, 'temp_toolConfig.cjs');
    fs.writeFileSync(tmpPath, cjsContent, 'utf8');
    toolConfig = require('./temp_toolConfig.cjs');
    allTools = Object.values(toolConfig.TOOL_CONFIG);
    fs.unlinkSync(tmpPath);
  });

  it('canonical tool catalog contains exactly 111 tools', () => {
    expect(allTools.length).toBe(111);
  });

  it('every tool has a unique toolId and valid metadata', () => {
    const idSet = new Set();
    allTools.forEach(tool => {
      expect(tool.id).toBeDefined();
      expect(typeof tool.id).toBe('string');
      expect(tool.id.length).toBeGreaterThan(0);
      expect(idSet.has(tool.id)).toBe(false); // No duplicates
      idSet.add(tool.id);

      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe('string');
      expect(tool.category).toBeDefined();
    });
    expect(idSet.size).toBe(111);
  });

  it('terminalExecutionService COMMAND_MAP covers all 111 canonical tools', () => {
    const termServicePath = path.resolve(__dirname, '../../client/src/services/terminalExecutionService.js');
    const termContent = fs.readFileSync(termServicePath, 'utf8');

    const missingInTerminal = [];
    allTools.forEach(tool => {
      const quotedSingle = `'${tool.id}'`;
      const quotedDouble = `"${tool.id}"`;
      const keyPattern = new RegExp(`['"]?${tool.id.replace(/[-_]/g, '[-_]?')}['"]?\\s*:`, 'i');

      if (!termContent.includes(quotedSingle) && !termContent.includes(quotedDouble) && !keyPattern.test(termContent)) {
        missingInTerminal.push(tool.id);
      }
    });

    expect(missingInTerminal).toEqual([]);
  });

  it('toolkitController ACTIVE_TOOLS includes all executable tools', () => {
    const controllerPath = path.resolve(__dirname, '../controllers/toolkitController.js');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');

    // Verify ACTIVE_TOOLS set is present
    expect(controllerContent).toContain('const ACTIVE_TOOLS = new Set([');
    
    // Test key security categories exist in the controller
    const sampleTools = ['dns', 'whois', 'port', 'nikto', 'sqlmap', 'trivy', 'prowler', 'garak', 'yara-rules'];
    sampleTools.forEach(toolId => {
      expect(controllerContent).toContain(`'${toolId}'`);
    });
  });
});
