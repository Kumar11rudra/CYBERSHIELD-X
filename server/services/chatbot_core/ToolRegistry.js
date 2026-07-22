const { RISK_LEVELS } = require('./types/constants');

/**
 * ToolRegistry Service
 * Maintains structural metadata about every CyberShield X module.
 * Does NOT contain execution logic or depend on AI function calling frameworks.
 */
class ToolRegistry {
  constructor() {
    // Registry of tools
    this.tools = new Map();
    this._initializeMockTools();
  }

  _initializeMockTools() {
    this.registerTool({
      id: 'nmap_scanner',
      name: 'Network Port & Device Scanner',
      category: 'Scanner',
      riskLevel: RISK_LEVELS.YELLOW,
      description: 'Scans target IP or domain for open ports and services.',
      executionHandlerRef: 'toolkitController.executeNmap'
    });

    this.registerTool({
      id: 'whois_lookup',
      name: 'WHOIS Lookup',
      category: 'OSINT',
      riskLevel: RISK_LEVELS.GREEN,
      description: 'Retrieves public WHOIS registration data for a domain.',
      executionHandlerRef: 'toolkitController.executeWhois'
    });
  }

  /**
   * Registers a new tool in the registry.
   * @param {Object} toolData - Tool metadata.
   * @returns {Object} Structured response.
   */
  registerTool(toolData) {
    if (!toolData || !toolData.id) {
      return { success: false, error: 'Tool ID is required' };
    }
    
    this.tools.set(toolData.id, toolData);
    return { success: true, status: 'registered', data: { id: toolData.id } };
  }

  /**
   * Retrieves metadata for all registered tools.
   * @returns {Object} Structured response containing tool metadata array.
   */
  getAllTools() {
    return {
      success: true,
      status: 'retrieved',
      data: {
        tools: Array.from(this.tools.values())
      },
      error: null,
      metadata: {
        timestamp: new Date().toISOString(),
        count: this.tools.size
      }
    };
  }

  /**
   * Retrieves metadata for a specific tool by ID.
   * @param {string} toolId - The unique identifier of the tool.
   * @returns {Object} Structured response.
   */
  getToolById(toolId) {
    const tool = this.tools.get(toolId);
    
    if (!tool) {
      return {
        success: false,
        status: 'not_found',
        data: null,
        error: `Tool with ID ${toolId} not found`,
        metadata: { timestamp: new Date().toISOString() }
      };
    }

    return {
      success: true,
      status: 'retrieved',
      data: { tool },
      error: null,
      metadata: { timestamp: new Date().toISOString() }
    };
  }
}

module.exports = ToolRegistry;
