const SOURCE_LABELS = {
  virusTotal: 'VirusTotal',
  abuseIPDB: 'AbuseIPDB',
  domainIntel: 'Domain Intel',
  hashlookup: 'CIRCL Hashlookup',
};

const joinLabels = (items) => {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const getRiskLevel = (scan) => scan?.risk?.level || scan?.riskLevel || 'safe';

const getTargetTypeLabel = (type) => {
  if (type === 'ip') return 'IP address';
  if (type === 'url') return 'URL';
  if (type === 'domain') return 'domain';
  if (type === 'hash') return 'file hash';
  return 'target';
};

const pushReason = (reasons, value) => {
  if (value && !reasons.includes(value)) reasons.push(value);
};

const getPrimaryDrivers = (sourceScores = {}) => {
  return Object.entries(sourceScores)
    .filter(([, score]) => typeof score === 'number' && score > 0)
    .sort(([, left], [, right]) => right - left)
    .map(([source]) => SOURCE_LABELS[source] || source);
};

const collectReasons = (scan) => {
  const reasons = [];
  const vt = scan?.breakdown?.virusTotal;
  const abuse = scan?.breakdown?.abuseIPDB;
  const domainIntel = scan?.breakdown?.domainIntel;
  const hashlookup = scan?.breakdown?.hashlookup;

  if (vt && !vt.error) {
    if ((vt.malicious || 0) > 0) {
      pushReason(
        reasons,
        `${vt.malicious} security engines marked this ${getTargetTypeLabel(scan.targetType)} as malicious on VirusTotal${vt.suspicious ? `, and ${vt.suspicious} more marked it suspicious` : ''}.`
      );
    } else if ((vt.suspicious || 0) > 0) {
      pushReason(reasons, `${vt.suspicious} VirusTotal engines marked this ${getTargetTypeLabel(scan.targetType)} as suspicious.`);
    } else if (vt.total) {
      pushReason(reasons, `VirusTotal did not report malicious detections across ${vt.total} engines.`);
    }
  }

  if (abuse && !abuse.error && typeof abuse.abuseConfidenceScore === 'number') {
    if (abuse.abuseConfidenceScore >= 50 || abuse.totalReports > 0) {
      pushReason(
        reasons,
        `AbuseIPDB shows ${abuse.abuseConfidenceScore}% abuse confidence with ${abuse.totalReports || 0} community reports for this IP.`
      );
    } else if (abuse.isWhitelisted) {
      pushReason(reasons, 'AbuseIPDB indicates this IP is whitelisted, which lowers immediate concern.');
    }
  }

  if (domainIntel && !domainIntel.error) {
    if (Array.isArray(domainIntel.riskFactors) && domainIntel.riskFactors.length > 0) {
      domainIntel.riskFactors.slice(0, 2).forEach((factor) => pushReason(reasons, factor));
    } else if (domainIntel.ageDays !== null && domainIntel.ageDays >= 180) {
      pushReason(reasons, `The domain appears mature at roughly ${domainIntel.ageDays} days old, which reduces suspicion.`);
    }

    if ((domainIntel.mxRecords?.length || 0) > 0 && !domainIntel.hasDmarc) {
      pushReason(reasons, 'The domain accepts email but DMARC protection was not found.');
    }
  }

  if (hashlookup && !hashlookup.error) {
    if (hashlookup.found === false) {
      pushReason(reasons, 'The hash was not found in CIRCL trusted file datasets, so trust could not be confirmed.');
    } else if (typeof hashlookup.trust === 'number') {
      if (hashlookup.trust >= 80) {
        pushReason(reasons, `CIRCL Hashlookup reports strong trust for this file hash (${hashlookup.trust}/100).`);
      } else if (hashlookup.trust < 50) {
        pushReason(reasons, `CIRCL Hashlookup trust is only ${hashlookup.trust}/100, which increases caution.`);
      } else {
        pushReason(reasons, `CIRCL Hashlookup reports moderate trust for this file hash (${hashlookup.trust}/100).`);
      }
    }
  }

  if (reasons.length === 0) {
    pushReason(reasons, 'No strong signal was available from the connected sources, so this score is conservative.');
  }

  return reasons.slice(0, 4);
};

const collectCoverageNotes = (scan) => {
  const notes = [];
  const sourceScores = scan?.sourceScores || {};
  const breakdown = scan?.breakdown || {};

  if (Object.keys(sourceScores).length <= 1) {
    notes.push('Only a limited number of intelligence sources contributed to this score, so business context still matters.');
  }

  Object.values(breakdown).forEach((result) => {
    if (!result || result.notApplicable || !result.error) return;

    if (/api key not configured/i.test(result.error)) {
      notes.push('One external threat feed is not configured right now, so the result may be more conservative than a fully enriched scan.');
    } else {
      notes.push('One supporting source could not be checked during this scan.');
    }
  });

  return Array.from(new Set(notes)).slice(0, 2);
};

const getSuggestedActions = (scan) => {
  const riskLevel = getRiskLevel(scan);
  const type = scan?.targetType;

  if (riskLevel === 'dangerous') {
    return [
      type === 'hash'
        ? 'Do not run files matching this hash. Quarantine them and inspect affected hosts.'
        : 'Do not open, visit, or trust this target until it has been investigated.',
      type === 'ip'
        ? 'Block or monitor this IP in firewall, proxy, or SIEM rules if it touches your environment.'
        : type === 'domain' || type === 'url'
          ? 'Block this domain or URL in browser, DNS, or email security controls if applicable.'
          : 'Contain the related indicator in the relevant security control as soon as possible.',
      'Export the report and share it with your admin or security team for follow-up.',
    ];
  }

  if (riskLevel === 'medium') {
    return [
      type === 'hash'
        ? 'Verify the original file source before execution, or open it only in a sandbox.'
        : 'Verify the sender, source, or business context before interacting with this target.',
      type === 'ip'
        ? 'Check whether this IP appears in your logs, alerts, or recent traffic before allowing it.'
        : 'Open or investigate this target only in an isolated environment if you must inspect it.',
      'Rescan later or after enabling more threat feeds to confirm the result.',
    ];
  }

  if (riskLevel === 'low') {
    return [
      'No urgent block is suggested, but treat the result as mildly suspicious until context is confirmed.',
      'Cross-check the source, sender, or expected business use before allowing it widely.',
      'Keep the result saved in history so you can compare it if the indicator changes later.',
    ];
  }

  return [
    'No urgent action is suggested, but keep normal caution and review business context.',
    'If this target changes behavior later, run another scan to confirm it still looks clean.',
    'Use the full report if you need an audit trail or want to share the result with someone else.',
  ];
};

export const getScanGuidance = (scan) => {
  const riskLevel = getRiskLevel(scan);
  const targetLabel = getTargetTypeLabel(scan?.targetType);
  const primaryDrivers = getPrimaryDrivers(scan?.sourceScores || {}).slice(0, 3);
  const reasons = collectReasons(scan);
  const coverageNotes = collectCoverageNotes(scan);
  const score = typeof scan?.threatScore === 'number' ? scan.threatScore : 0;

  let summary = `This ${targetLabel} scored ${score}/100. `;

  if (riskLevel === 'dangerous') {
    summary += primaryDrivers.length
      ? `It looks high risk because ${joinLabels(primaryDrivers)} contributed the strongest warning signals.`
      : 'It looks high risk because the available sources returned strong warning signals.';
  } else if (riskLevel === 'medium') {
    summary += primaryDrivers.length
      ? `It needs manual review because ${joinLabels(primaryDrivers)} reported moderate concern.`
      : 'It needs manual review because one or more sources reported moderate concern.';
  } else if (riskLevel === 'low') {
    summary += primaryDrivers.length
      ? `It shows a few weaker warning signals, mainly from ${joinLabels(primaryDrivers)}.`
      : 'It shows some low-confidence warning signs, so context still matters.';
  } else {
    summary += primaryDrivers.length
      ? `No strong malicious signal was found, and ${joinLabels(primaryDrivers)} stayed in a low-risk range.`
      : 'No strong malicious signal was found from the connected sources.';
  }

  return {
    summary,
    reasons,
    actions: getSuggestedActions(scan),
    coverageNotes,
    primaryDrivers,
  };
};

export const getAssistantBrief = (scan) => {
  const guidance = getScanGuidance(scan);
  const riskLevel = getRiskLevel(scan);
  const score = typeof scan?.threatScore === 'number' ? scan.threatScore : 0;
  const primaryAction = guidance.actions[0] || 'Review the full report before taking action.';

  const headlineByRisk = {
    dangerous: 'High-confidence suspicious indicator',
    medium: 'Manual review strongly recommended',
    low: 'Low-confidence warning signal',
    safe: 'No strong malicious evidence found',
  };

  const confidenceByRisk = {
    dangerous: 'High confidence',
    medium: 'Moderate confidence',
    low: 'Low confidence',
    safe: 'Cautious confidence',
  };

  let narrative = guidance.summary;
  if (guidance.reasons[0]) {
    narrative += ` Key driver: ${guidance.reasons[0]}`;
  }

  return {
    headline: headlineByRisk[riskLevel] || headlineByRisk.safe,
    confidence: confidenceByRisk[riskLevel] || confidenceByRisk.safe,
    narrative,
    primaryAction,
    primaryDrivers: guidance.primaryDrivers,
    score,
    riskLevel,
  };
};
