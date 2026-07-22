const Watchlist = require('../models/Watchlist');
const WatchlistDTO = require('../models/dto/WatchlistDTO');

class WatchlistRepository {
    async findById(id) {
        const doc = await Watchlist.findById(id);
        if (!doc) return null;
        return new WatchlistDTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await Watchlist.find(filter);
        return docs.map(doc => new WatchlistDTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await Watchlist.findOne(filter);
        if (!doc) return null;
        return new WatchlistDTO(doc.toObject());
    }

    async create(data) {
        const doc = await Watchlist.create(data);
        return new WatchlistDTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await Watchlist.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new WatchlistDTO(doc.toObject());
    }

    async delete(id) {
        const doc = await Watchlist.findByIdAndDelete(id);
        if (!doc) return null;
        return new WatchlistDTO(doc.toObject());
    }
}

module.exports = WatchlistRepository;
