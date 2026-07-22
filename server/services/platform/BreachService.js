const RBACService = require('../org/RBACService');
const GenericDTO = require('../../models/dto/GenericDTO');

class BreachService {
    static async checkEmail(orgId, userId, email) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        return new GenericDTO({ breaches: [] });
    }
    static async checkPhone(orgId, userId, phone) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        return new GenericDTO({ breaches: [] });
    }
    static async checkPassword(orgId, userId, password) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        return new GenericDTO({ pwned: false });
    }
}
module.exports = BreachService;
