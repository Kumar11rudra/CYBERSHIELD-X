const dns = require('dns').promises;
const axios = require('axios');

const RDAP_BASE = 'https://rdap.org/domain';
const PARKING_KEYWORDS = ['park', 'parking', 'sedoparking', 'cashparking', 'bodis', 'afternic'];
const HOLD_STATUSES = ['inactive', 'hold', 'server hold', 'client hold'];

const safeResolve = async (resolver, fallback = []) => {
  try {
    return await resolver();
  } catch {
    return fallback;
  }
};

const flattenTxt = (records) => records.map((entry) => entry.join(''));

const findRdapEvent = (events = [], actions = []) => {
  const normalized = new Set(actions.map((action) => action.toLowerCase()));
  const match = events.find((event) => normalized.has(String(event.eventAction || '').toLowerCase()));
  return match?.eventDate || null;
};

const getRegistrarName = (entities = []) => {
  const registrar = entities.find((entity) => Array.isArray(entity.roles) && entity.roles.includes('registrar'));
  const vcard = registrar?.vcardArray?.[1] || [];
  const nameEntry = vcard.find((entry) => entry[0] === 'fn');
  return nameEntry?.[3] || registrar?.handle || null;
};

const computeDomainIntelScore = ({ ageDays, parked, statusFlags, hasMx, hasSpf, hasDmarc, ipCount, dnssecSigned }) => {
  let score = 0;
  const riskFactors = [];

  if (ageDays === null) {
    score += 8;
    riskFactors.push('Domain age could not be confirmed.');
  } else if (ageDays < 14) {
    score += 50;
    riskFactors.push('Domain was registered in the last two weeks.');
  } else if (ageDays < 30) {
    score += 35;
    riskFactors.push('Domain is very new.');
  } else if (ageDays < 90) {
    score += 20;
    riskFactors.push('Domain is still relatively new.');
  } else if (ageDays < 180) {
    score += 10;
    riskFactors.push('Domain is younger than six months.');
  }

  if (parked) {
    score += 20;
    riskFactors.push('Nameserver pattern suggests parked infrastructure.');
  }

  if (statusFlags.length > 0) {
    score += 22;
    riskFactors.push('RDAP status indicates the domain may be inactive or under hold.');
  }

  if (ipCount === 0 && !hasMx) {
    score += 18;
    riskFactors.push('Domain has no web or mail resolution records.');
  }

  if (hasMx && !hasSpf) {
    score += 8;
    riskFactors.push('Mail is configured but SPF was not found.');
  }

  if (hasMx && !hasDmarc) {
    score += 10;
    riskFactors.push('Mail is configured but DMARC was not found.');
  }

  if (dnssecSigned === false) {
    score += 5;
    riskFactors.push('DNSSEC is not enabled.');
  }

  return {
    score: Math.min(Math.round(score), 100),
    riskFactors: Array.from(new Set(riskFactors)),
  };
};

const scanDomainIntel = async (domain) => {
  const normalizedDomain = domain.trim().toLowerCase();

  const [aRecords, aaaaRecords, mxRecords, nsRecords, txtRecords, dmarcTxtRecords, rdapResponse] = await Promise.all([
    safeResolve(() => dns.resolve4(normalizedDomain)),
    safeResolve(() => dns.resolve6(normalizedDomain)),
    safeResolve(() => dns.resolveMx(normalizedDomain)),
    safeResolve(() => dns.resolveNs(normalizedDomain)),
    safeResolve(() => dns.resolveTxt(normalizedDomain)),
    safeResolve(() => dns.resolveTxt(`_dmarc.${normalizedDomain}`)),
    axios.get(`${RDAP_BASE}/${normalizedDomain}`, {
      headers: { accept: 'application/json' },
      timeout: 12000,
      maxRedirects: 5,
    }).then((response) => response.data).catch(() => null),
  ]);

  const txtFlat = flattenTxt(txtRecords);
  const dmarcFlat = flattenTxt(dmarcTxtRecords);
  const hasSpf = txtFlat.some((value) => value.toLowerCase().startsWith('v=spf1'));
  const hasDmarc = dmarcFlat.some((value) => value.toLowerCase().startsWith('v=dmarc1'));
  const nameservers = (rdapResponse?.nameservers || []).map((entry) => entry.ldhName || entry.unicodeName).filter(Boolean);
  const fallbackNameservers = nsRecords.length > 0 ? nsRecords : nameservers;
  const rdapStatuses = Array.isArray(rdapResponse?.status) ? rdapResponse.status : [];
  const statusFlags = rdapStatuses.filter((status) =>
    HOLD_STATUSES.some((keyword) => String(status).toLowerCase().includes(keyword))
  );
  const parked = fallbackNameservers.some((server) =>
    PARKING_KEYWORDS.some((keyword) => server.toLowerCase().includes(keyword))
  );
  const registrationDate = findRdapEvent(rdapResponse?.events, ['registration', 'registered']);
  const lastChangedDate = findRdapEvent(rdapResponse?.events, ['last changed', 'changed']);
  const ageDays = registrationDate
    ? Math.max(0, Math.floor((Date.now() - new Date(registrationDate).getTime()) / (24 * 60 * 60 * 1000)))
    : null;
  const dnssecSigned = typeof rdapResponse?.secureDNS?.delegationSigned === 'boolean'
    ? rdapResponse.secureDNS.delegationSigned
    : null;

  const { score, riskFactors } = computeDomainIntelScore({
    ageDays,
    parked,
    statusFlags,
    hasMx: mxRecords.length > 0,
    hasSpf,
    hasDmarc,
    ipCount: aRecords.length + aaaaRecords.length,
    dnssecSigned,
  });

  return {
    source: 'domainIntel',
    domain: normalizedDomain,
    registrar: getRegistrarName(rdapResponse?.entities),
    registrationDate,
    lastChangedDate,
    ageDays,
    status: rdapStatuses,
    dnssecSigned,
    parked,
    hasSpf,
    hasDmarc,
    aRecords,
    aaaaRecords,
    mxRecords: mxRecords.map((entry) => ({ exchange: entry.exchange, priority: entry.priority })),
    nameservers: fallbackNameservers,
    txtSample: txtFlat.slice(0, 4),
    riskScore: score,
    riskFactors,
  };
};

module.exports = { scanDomainIntel };
