class EnvConfigProvider {
  get(key, defaultValue) {
    return process.env[key] || defaultValue;
  }
}
module.exports = EnvConfigProvider;
