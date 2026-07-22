const AnalyticsDTO = require('../../models/dto/AnalyticsDTO');

class AnalyticsFormatter {
    formatOverview(overviewData) {
        const twoFAAdoptionRate = overviewData.totalUsers > 0 ? 
            ((overviewData.twoFAEnabledUsers / overviewData.totalUsers) * 100).toFixed(1) + '%' : '0%';
            
        return new AnalyticsDTO({
            ...overviewData,
            twoFAAdoptionRate
        });
    }
}
module.exports = AnalyticsFormatter;
