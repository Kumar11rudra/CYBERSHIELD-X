const crypto = require('crypto');

/**
 * ObservationPipeline Service
 * Normalizes every observation into a strict standardized structure.
 */
class ObservationPipeline {
  constructor() {
    this.observations = [];
  }

  /**
   * Normalizes raw data into a standard Observation object.
   * @param {Object} rawData - The raw observation data.
   * @param {string} rawData.source - Source of the observation.
   * @param {string} rawData.category - Category of the observation.
   * @param {string} rawData.severity - Severity level.
   * @param {string} rawData.summary - Human-readable summary.
   * @param {Object} rawData.metadata - Contextual metadata.
   * @param {number} rawData.confidence - Confidence score (0.0 - 1.0).
   * @returns {Object} Structured response containing the normalized observation.
   */
  normalize(rawData) {
    try {
      const observation = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        source: rawData.source || 'unknown',
        category: rawData.category || 'uncategorized',
        severity: rawData.severity || 'INFO',
        summary: rawData.summary || 'No summary provided',
        metadata: rawData.metadata || {},
        confidence: typeof rawData.confidence === 'number' ? rawData.confidence : 1.0
      };

      // Keep recent normalized observations in memory
      this.observations.unshift(observation);
      if (this.observations.length > 500) {
        this.observations.pop();
      }

      return {
        success: true,
        status: 'normalized',
        data: { observation },
        error: null,
        metadata: { timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        data: null,
        error: `Failed to normalize observation: ${error.message}`,
        metadata: { timestamp: new Date().toISOString() }
      };
    }
  }

  /**
   * Retrieves recent normalized observations.
   * @param {number} limit - Max number to return.
   * @returns {Object} Structured response.
   */
  getRecentObservations(limit = 20) {
    return {
      success: true,
      status: 'retrieved',
      data: { observations: this.observations.slice(0, limit) },
      error: null,
      metadata: { timestamp: new Date().toISOString() }
    };
  }
}

module.exports = ObservationPipeline;
