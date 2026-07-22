class BreachIntelligenceService {
    constructor(breachProviderManager, activityLogRepository) {
        this.providerManager = breachProviderManager;
        this.activityLogRepository = activityLogRepository;
    }

    async checkEmail(email, userId) {
        return await this.providerManager.checkEmail(email);
    }

    async checkPhone(phone, userId) {
        return await this.providerManager.checkPhone(phone);
    }

    async checkPassword(password) {
        return await this.providerManager.checkPassword(password);
    }
}
module.exports = BreachIntelligenceService;
