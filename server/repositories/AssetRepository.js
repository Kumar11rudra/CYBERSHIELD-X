const Asset = require('../models/Asset');

class AssetRepository {
    async create(data) {
        return await Asset.create(data);
    }

    async findByIdAndOrg(id, organizationId) {
        return await Asset.findOne({ _id: id, organizationId });
    }

    async countByOrg(organizationId) {
        return await Asset.countDocuments({ organizationId, status: { $ne: 'deleted' } });
    }

    async checkDuplicate(organizationId, hostname) {
        return await Asset.exists({ organizationId, hostname, status: { $ne: 'deleted' } });
    }

    async update(id, organizationId, updateData) {
        return await Asset.findOneAndUpdate(
            { _id: id, organizationId },
            updateData,
            { new: true, runValidators: true }
        );
    }
}

module.exports = new AssetRepository();
