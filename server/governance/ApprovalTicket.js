/**
 * @module ApprovalTicket
 * @description Issued when Human-in-the-loop or external approval is required.
 * "Runtime Integration Pending"
 */
class ApprovalTicket {
    /**
     * @param {Object} params
     * @param {string} params.contextId
     * @param {string} params.status
     * @param {string} params.requiredRole
     * @param {string} params.issuedAt
     */
    constructor({ contextId, status = 'PENDING', requiredRole, issuedAt }) {
        this.contextId = contextId;
        this.status = status;
        this.requiredRole = requiredRole;
        this.issuedAt = issuedAt;
        this.approvedBy = null;
        this.approvedAt = null;
    }

    /**
     * Checks if the ticket has been approved.
     * @returns {boolean}
     */
    isApproved() {
        return this.status === 'APPROVED' && !!this.approvedBy;
    }
}

module.exports = ApprovalTicket;
