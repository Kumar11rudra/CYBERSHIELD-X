const axios = require('axios');

const HASHLOOKUP_BASE = 'https://hashlookup.circl.lu/lookup';

const hashTypeFromValue = (hash) => {
  if (/^[a-f0-9]{32}$/i.test(hash)) return 'md5';
  if (/^[a-f0-9]{40}$/i.test(hash)) return 'sha1';
  if (/^[a-f0-9]{64}$/i.test(hash)) return 'sha256';
  return null;
};

const lookupHash = async (hash) => {
  const hashType = hashTypeFromValue(hash);
  if (!hashType) {
    return { error: 'Unsupported hash format', source: 'hashlookup' };
  }

  try {
    const response = await axios.get(`${HASHLOOKUP_BASE}/${hashType}/${hash.toUpperCase()}`, {
      headers: { accept: 'application/json' },
      timeout: 10000,
    });

    const data = response.data || {};
    return {
      source: 'hashlookup',
      hash: hash.toLowerCase(),
      hashType,
      found: true,
      trust: typeof data['hashlookup:trust'] === 'number' ? data['hashlookup:trust'] : 50,
      fileName: data.FileName || null,
      fileSize: data.FileSize ? Number(data.FileSize) : null,
      database: data.db || null,
      sourceName: data.source || null,
      md5: data.MD5 || null,
      sha1: data['SHA-1'] || null,
      sha256: data.SHA256 || null,
      productName: data.ProductCode?.ProductName || null,
      productVersion: data.ProductCode?.ProductVersion || null,
      applicationType: data.ProductCode?.ApplicationType || null,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        source: 'hashlookup',
        hash: hash.toLowerCase(),
        hashType,
        found: false,
        trust: 35,
        note: 'Hash not found in CIRCL trusted file datasets.',
      };
    }

    console.error('Hashlookup error:', error.message);
    return { error: error.message, source: 'hashlookup' };
  }
};

module.exports = { lookupHash, hashTypeFromValue };
