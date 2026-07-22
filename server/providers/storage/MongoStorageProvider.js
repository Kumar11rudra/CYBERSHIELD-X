class MongoStorageProvider {
  constructor(uri) { this.uri = uri; }
  async connect() { return { success: true }; }
}
module.exports = MongoStorageProvider;
