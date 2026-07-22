class UserRepository {
    async find(filter = {}) { return []; }
    async findById(id) { return null; }
    async create(data) { return data; }
    async update(id, data) { return { id, ...data }; }
    async delete(id) { return true; }
}
module.exports = UserRepository;
