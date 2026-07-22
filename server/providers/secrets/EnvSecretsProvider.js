class EnvSecretsProvider {
  getSecret(key) {
    return process.env[key] || '';
  }
}
module.exports = EnvSecretsProvider;
