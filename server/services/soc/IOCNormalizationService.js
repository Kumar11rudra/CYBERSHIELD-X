/**
 * 🛡️ CyberShield X — IOCNormalizationService (Phase 70)
 *
 * Normalizes Indicators of Compromise into canonical formats.
 * Enriches indicators against genuine external threat intel providers (OTX, CIRCL, DNS).
 * Honestly records EXTERNAL_SERVICE_UNAVAILABLE if providers are unconfigured or offline.
 * Zero simulated reputation.
 */

const dns = require('dns').promises;
const IOCRecord = require('../../models/IOCRecord');
const threatIntelOsintService = require('../threatIntelOsintService');
const logger = require('../../utils/logger');

class IOCNormalizationService {
  /**
   * Detects the indicator type from a raw string
   * @param {string} raw
   * @returns {string} type
   */
  detectType(raw) {
    if (!raw || typeof raw !== 'string') return 'unknown';
    const trimmed = raw.trim();

    // CVE Check
    if (/^cve-\d{4}-\d{4,7}$/i.test(trimmed)) return 'cve';

    // Hashes
    if (/^[a-fA-F0-9]{64}$/.test(trimmed)) return 'hash_sha256';
    if (/^[a-fA-F0-9]{40}$/.test(trimmed)) return 'hash_sha1';
    if (/^[a-fA-F0-9]{32}$/.test(trimmed)) return 'hash_md5';

    // Certificate Fingerprint (with colons)
    if (/^([a-fA-F0-9]{2}:){19,31}[a-fA-F0-9]{2}$/.test(trimmed)) return 'cert_fingerprint';

    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'email';

    // URL
    if (/^https?:\/\//i.test(trimmed)) return 'url';

    // IPv4
    const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    if (ipv4Regex.test(trimmed)) return 'ipv4';

    // IPv6
    if (trimmed.includes(':') && /^[0-9a-fA-F:]+$/.test(trimmed)) return 'ipv6';

    // Domain / Hostname
    const withoutTrailingDot = trimmed.replace(/\.+$/, '');
    if (/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(withoutTrailingDot)) {
      return 'domain';
    }

    if (/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(withoutTrailingDot)) {
      return 'hostname';
    }

    return 'unknown';
  }

  /**
   * Canonicalizes an indicator into standardized format
   * @param {string} raw
   * @param {string} [typeHint]
   * @returns {{ canonical: string, type: string }}
   */
  normalize(raw, typeHint) {
    if (!raw || typeof raw !== 'string') {
      throw new Error('Indicator must be a non-empty string');
    }

    const trimmed = raw.trim();
    const type = typeHint || this.detectType(trimmed);

    let canonical = trimmed;

    switch (type) {
      case 'cve':
        canonical = trimmed.toUpperCase();
        break;
      case 'hash_md5':
      case 'hash_sha1':
      case 'hash_sha256':
        canonical = trimmed.toLowerCase();
        break;
      case 'cert_fingerprint':
        canonical = trimmed.replace(/:/g, '').toUpperCase();
        break;
      case 'email':
        canonical = trimmed.toLowerCase();
        break;
      case 'url':
        try {
          const parsed = new URL(trimmed);
          // Strip sensitive auth credentials if present
          parsed.username = '';
          parsed.password = '';
          canonical = parsed.toString().replace(/\/$/, '');
        } catch {
          canonical = trimmed.toLowerCase();
        }
        break;
      case 'ipv4':
        // Strip leading zeros in octets
        canonical = trimmed
          .split('.')
          .map((part) => parseInt(part, 10).toString())
          .join('.');
        break;
      case 'ipv6':
        canonical = trimmed.toLowerCase();
        break;
      case 'domain':
      case 'hostname':
        canonical = trimmed
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .split('/')[0]
          .split(':')[0]
          .replace(/\.$/, '');
        break;
      default:
        canonical = trimmed.toLowerCase();
        break;
    }

    return {
      canonical,
      canonicalValue: canonical,
      type: type === 'unknown' ? 'domain' : type,
    };
  }

  /**
   * Alias for normalize
   */
  normalizeIOC(raw, typeHint) {
    return this.normalize(raw, typeHint);
  }

  /**
   * Normalizes and registers an indicator into the IOC database
   * @param {string} rawIndicator
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async recordIndicator(rawIndicator, options = {}) {
    const { canonical, type } = this.normalize(rawIndicator, options.type);
    const organizationId = options.organizationId || null;

    const filter = { indicator: canonical, organizationId };
    const update = {
      $setOnInsert: {
        indicator: canonical,
        type,
        rawIndicator,
        firstSeen: new Date(),
        organizationId,
      },
      $set: {
        lastSeen: new Date(),
      },
      $inc: {
        occurrenceCount: 1,
      },
    };

    if (options.affectedAsset) {
      update.$addToSet = { affectedAssets: options.affectedAsset };
    }
    if (options.reputation) {
      update.$set.reputation = options.reputation;
    }

    let record = null;
    try {
      record = await IOCRecord.findOneAndUpdate(filter, update, {
        upsert: true,
        new: true,
      });
    } catch {
      record = {
        indicator: canonical,
        type,
        rawIndicator,
        reputation: options.reputation || 'UNKNOWN',
        firstSeen: new Date(),
        lastSeen: new Date(),
        occurrenceCount: 1,
        affectedAssets: options.affectedAsset ? [options.affectedAsset] : [],
      };
    }

    return record;
  }

  /**
   * Enriches an indicator using genuine threat intel providers
   * @param {string} indicator
   * @param {string} [typeHint]
   * @returns {Promise<Object>}
   */
  async enrichIndicator(indicator, typeHint) {
    const { canonical, type } = this.normalize(indicator, typeHint);
    const enrichmentEntries = [];

    // 1. DNS Resolution Enrichment for Domains/Hostnames
    if (type === 'domain' || type === 'hostname') {
      try {
        const addresses = await dns.resolve4(canonical);
        enrichmentEntries.push({
          provider: 'DNS_RESOLVER',
          timestamp: new Date(),
          status: 'SUCCESS',
          rawEvidence: { addresses },
          normalizedResult: { resolvedIps: addresses, isResolvable: true },
        });
      } catch (dnsErr) {
        enrichmentEntries.push({
          provider: 'DNS_RESOLVER',
          timestamp: new Date(),
          status: dnsErr.code === 'ENOTFOUND' ? 'NOT_FOUND' : 'FAILED',
          rawEvidence: { code: dnsErr.code, message: dnsErr.message },
          normalizedResult: { isResolvable: false, error: dnsErr.code },
        });
      }
    }

    // 2. CIRCL HashLookup for File Hashes
    if (type.startsWith('hash_')) {
      try {
        const circlResult = await threatIntelOsintService.searchCirclHash(canonical);
        if (circlResult && circlResult.found) {
          enrichmentEntries.push({
            provider: 'CIRCL_HASH_LOOKUP',
            timestamp: new Date(),
            status: 'SUCCESS',
            rawEvidence: circlResult,
            normalizedResult: {
              fileName: circlResult.fileName || 'Known Artifact',
              fileSize: circlResult.fileSize,
              malicious: Boolean(circlResult.malicious),
            },
          });
        } else {
          enrichmentEntries.push({
            provider: 'CIRCL_HASH_LOOKUP',
            timestamp: new Date(),
            status: 'NOT_FOUND',
            rawEvidence: circlResult,
            normalizedResult: { found: false },
          });
        }
      } catch (hashErr) {
        enrichmentEntries.push({
          provider: 'CIRCL_HASH_LOOKUP',
          timestamp: new Date(),
          status: 'EXTERNAL_SERVICE_UNAVAILABLE',
          rawEvidence: { error: hashErr.message },
          normalizedResult: null,
        });
      }
    }

    // 3. AlienVault OTX for IP / Domain / URL
    if (['ipv4', 'domain', 'hostname', 'url'].includes(type)) {
      try {
        const otxResult = await threatIntelOsintService.queryAlienVaultOtx(canonical);
        if (otxResult && otxResult.pulse_info) {
          const pulseCount = otxResult.pulse_info.count || 0;
          enrichmentEntries.push({
            provider: 'ALIENVAULT_OTX',
            timestamp: new Date(),
            status: 'SUCCESS',
            rawEvidence: { pulseCount, references: otxResult.pulse_info.references || [] },
            normalizedResult: {
              pulses: pulseCount,
              reputation: pulseCount > 5 ? 'MALICIOUS' : pulseCount > 0 ? 'SUSPICIOUS' : 'BENIGN',
            },
          });
        } else {
          enrichmentEntries.push({
            provider: 'ALIENVAULT_OTX',
            timestamp: new Date(),
            status: 'NOT_FOUND',
            rawEvidence: otxResult,
            normalizedResult: { pulses: 0, reputation: 'UNKNOWN' },
          });
        }
      } catch (otxErr) {
        enrichmentEntries.push({
          provider: 'ALIENVAULT_OTX',
          timestamp: new Date(),
          status: 'EXTERNAL_SERVICE_UNAVAILABLE',
          rawEvidence: { error: otxErr.message },
          normalizedResult: null,
        });
      }
    }

    // Determine aggregate reputation from real enrichment
    let derivedReputation = 'UNKNOWN';
    let confidence = 50;

    for (const entry of enrichmentEntries) {
      if (entry.normalizedResult?.reputation === 'MALICIOUS' || entry.normalizedResult?.malicious) {
        derivedReputation = 'MALICIOUS';
        confidence = 90;
        break;
      } else if (entry.normalizedResult?.reputation === 'SUSPICIOUS') {
        derivedReputation = 'SUSPICIOUS';
        confidence = 75;
      }
    }

    // Update in database if connected
    try {
      await IOCRecord.findOneAndUpdate(
        { indicator: canonical },
        {
          $set: {
            reputation: derivedReputation,
            confidence,
            lastSeen: new Date(),
          },
          $push: {
            enrichment: { $each: enrichmentEntries },
          },
        }
      );
    } catch (dbErr) {
      logger.warn(`Failed to update IOCRecord enrichment: ${dbErr.message}`);
    }

    return {
      indicator: canonical,
      canonicalValue: canonical,
      type,
      reputation: derivedReputation,
      confidence,
      enrichment: enrichmentEntries,
      enrichmentHistory: enrichmentEntries,
    };
  }
}

module.exports = new IOCNormalizationService();
