/**
 * IValidator Interface (Architecture Placeholder)
 * Exposes validation contracts for future implementations (e.g., Joi, Zod).
 * Do NOT implement logic here.
 */
class IValidator {
  /**
   * Validates a given payload against a predefined schema.
   * @param {Object} payload - The data to validate.
   * @param {string} schemaName - The schema identifier.
   * @returns {Object} Structured result { isValid, errors }
   */
  validate(payload, schemaName) {
    throw new Error('Method not implemented.');
  }
}

module.exports = IValidator;
