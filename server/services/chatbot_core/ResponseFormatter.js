/**
 * ResponseFormatter Service
 * Sanitizes and formats the raw AI output into a consistent JSON or Markdown structure.
 */
class ResponseFormatter {
  /**
   * Formats the final AI response before sending it to the client.
   * @param {string} rawContent - The raw text/markdown from the AI model.
   * @param {Object} metadata - Additional metadata to include in the response.
   * @returns {Object} Structured response object.
   */
  formatResponse(rawContent, metadata = {}) {
    // Phase 1: Basic structural formatting
    // In future phases, this could parse JSON blocks, sanitize markdown, 
    // or extract UI commands embedded by the AI.
    
    let sanitizedContent = rawContent || '';
    
    // Remove null bytes or potentially unsafe invisible characters
    sanitizedContent = sanitizedContent.replace(/\0/g, '');

    return {
      success: true,
      status: 'formatted',
      data: {
        role: 'assistant',
        content: sanitizedContent
      },
      error: null,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * Formats an error response.
   * @param {string} errorMessage - The error message.
   * @param {string} errorCode - The error code.
   * @returns {Object} Structured error response object.
   */
  formatError(errorMessage, errorCode = 'AI_PROCESSING_ERROR') {
    return {
      success: false,
      status: 'error',
      data: null,
      error: errorMessage,
      metadata: {
        timestamp: new Date().toISOString(),
        errorCode
      }
    };
  }
}

module.exports = ResponseFormatter;
