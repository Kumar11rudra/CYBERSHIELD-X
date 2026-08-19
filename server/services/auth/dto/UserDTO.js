/**
 * @module UserDTO
 * @description Immutable Data Transfer Object for User Entity
 */
class UserDTO {
    /**
     * @param {Object} data 
     */
    constructor(data = {}) {
        this.id = data._id ? data._id.toString() : (data.id ? data.id.toString() : undefined);
        this._id = this.id;
        this.username = data.username;
        this.email = data.email;
        this.mobileNumber = data.mobileNumber;
        this.fullName = data.fullName;
        this.age = data.age;
        this.country = data.country;
        this.gender = data.gender;
        this.preferredNickname = data.preferredNickname;
        this.role = data.role;
        this.emailAlerts = data.emailAlerts;
        this.alertThreshold = data.alertThreshold;
        this.webhookUrl = data.webhookUrl;
        this.avatar = data.avatar;
        this.emailVerified = data.emailVerified;
        this.emailVerifiedAt = data.emailVerifiedAt;
        this.status = data.status;
        this.totalScans = data.totalScans;
        this.lastLoginAt = data.lastLoginAt;
        this.lastLogoutAt = data.lastLogoutAt;
        this.trustedDevices = data.trustedDevices || [];
        this.twoFactorEnabled = data.twoFactorEnabled;
        this.isTotpEnabled = data.isTotpEnabled;
        this.isBanned = data.isBanned;
        this.blockedIPs = data.blockedIPs || [];
        
        // Internal Auth fields that must be accessed occasionally by Auth Service but NOT exposed out
        this.password = data.password;
        this.lockoutUntil = data.lockoutUntil;
        this.failedLoginAttempts = data.failedLoginAttempts;
        this.emailHash = data.emailHash;
        
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        Object.freeze(this);
    }
}

module.exports = UserDTO;
