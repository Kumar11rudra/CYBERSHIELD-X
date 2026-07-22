const VaultAsset = require('../models/VaultAsset');
const VaultAssetDTO = require('../models/dto/VaultAssetDTO');

class VaultAssetRepository {
    async findById(id) {
        const doc = await VaultAsset.findById(id);
        if (!doc) return null;
        return new VaultAssetDTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await VaultAsset.find(filter);
        return docs.map(doc => new VaultAssetDTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await VaultAsset.findOne(filter);
        if (!doc) return null;
        return new VaultAssetDTO(doc.toObject());
    }

    async create(data) {
        const doc = await VaultAsset.create(data);
        return new VaultAssetDTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await VaultAsset.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new VaultAssetDTO(doc.toObject());
    }

    async delete(id) {
        const doc = await VaultAsset.findByIdAndDelete(id);
        if (!doc) return null;
        return new VaultAssetDTO(doc.toObject());
    }
}

module.exports = VaultAssetRepository;
