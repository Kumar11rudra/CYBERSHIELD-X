const Scan = require('../models/Scan');
const cache = require('../utils/cache');

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cacheKey = `dashboard:stats:${userId}`;
    
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const [
      totalScans,
      riskBreakdown,
      recentScans,
      dailyScans,
      topTargets,
    ] = await Promise.all([
      Scan.countDocuments({ userId }),

      Scan.aggregate([
        { $match: { userId } },
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      ]),

      Scan.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('target targetType threatScore riskLevel tool createdAt'),

      Scan.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgScore: { $avg: '$threatScore' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Scan.aggregate([
        { $match: { userId } },
        { $group: { _id: '$target', count: { $sum: 1 }, avgScore: { $avg: '$threatScore' }, riskLevel: { $last: '$riskLevel' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // Normalize risk breakdown
    const riskMap = { safe: 0, low: 0, medium: 0, dangerous: 0 };
    riskBreakdown.forEach(({ _id, count }) => {
      if (_id in riskMap) riskMap[_id] = count;
    });

    const dangerousCount = riskMap.dangerous + riskMap.medium;
    const safeCount = riskMap.safe + riskMap.low;

    // Fetch all user's scans to compute security score and copilot insights
    const allScans = await Scan.find({ userId }).sort({ createdAt: -1 });

    let dnsScore = 25;
    let sslScore = 25;
    let subScore = 20;
    let threatScore = 15;
    let historyScore = 0;

    const recommendations = [];

    if (allScans.length > 0) {
      // 1. History score
      if (allScans.length > 15) historyScore = 15;
      else if (allScans.length > 5) historyScore = 10;
      else historyScore = 5;

      // 2. Scan inspections
      let dangerousScans = 0;
      let warningScans = 0;

      allScans.forEach(scan => {
        if (scan.riskLevel === 'dangerous') dangerousScans++;
        else if (scan.riskLevel === 'medium') warningScans++;

        const targetLower = (scan.target || '').toLowerCase();

        // Check for open ports in nmap scans
        if (scan.rawOutput && scan.rawOutput.includes('open') && (scan.targetType === 'ip' || targetLower.includes('nmap'))) {
          if (!recommendations.some(r => r.includes('port'))) {
            recommendations.push('Exposed port discovered. Hardening firewall rules is recommended.');
          }
        }
      });

      // Query specific tools to calculate scores
      const dnsScans = allScans.filter(s => s.tool === 'dig' || s.targetType === 'domain');
      if (dnsScans.length > 0) {
        const latestDns = dnsScans[0];
        const failed = latestDns.riskLevel === 'dangerous' || (latestDns.rawOutput && latestDns.rawOutput.includes('Failed'));
        dnsScore = failed ? 10 : 25;
        if (failed) {
          recommendations.push('Domain resolution error or inactive DNS mapping. Verify host status.');
        }
      }

      const sslScans = allScans.filter(s => s.tool === 'ssl');
      if (sslScans.length > 0) {
        const latestSsl = sslScans[0];
        const report = latestSsl.report || {};
        const days = parseInt(report['Days Remaining'] || '90', 10);
        const isValid = report['Status'] === 'VALID' || !latestSsl.rawOutput?.includes('INVALID');
        
        if (!isValid) {
          sslScore = 5;
          recommendations.push('Expired or invalid SSL certificate detected. Renew immediately to prevent HTTPS downtime.');
        } else if (days < 30) {
          sslScore = 15;
          recommendations.push(`SSL certificate expires in ${days} days. Plan renewal before expiration.`);
        } else {
          sslScore = 25;
        }
      }

      const subScans = allScans.filter(s => s.tool === 'subfinder');
      if (subScans.length > 0) {
        const latestSub = subScans[0];
        const count = parseInt(latestSub.report?.['Subdomains Found'] || '0', 10);
        if (count > 8) {
          subScore = 10;
          recommendations.push(`Large subdomain footprint (${count} nodes) exposed. Audit host public configurations.`);
        } else if (count > 3) {
          subScore = 15;
          recommendations.push(`Exposed assets: ${count} subdomains discovered.`);
        } else {
          subScore = 20;
        }
      }

      // 3. Threat integrity
      if (dangerousScans > 0) {
        threatScore = 5;
        recommendations.push('Critical vulnerability warnings active. Review scan details.');
      } else if (warningScans > 0) {
        threatScore = 10;
        recommendations.push('Medium risk vulnerabilities active. Hardening suggested.');
      } else {
        threatScore = 15;
      }
    } else {
      recommendations.push('Run your first DNS, SSL, or Port scan to generate security posture insights.');
    }

    if (recommendations.length === 0) {
      recommendations.push('System posture healthy. No active threats detected.');
    }

    const overallScore = dnsScore + sslScore + subScore + threatScore + historyScore;

    const responseData = {
      overview: {
        totalScans,
        safeCount,
        dangerousCount,
        maliciousRate: totalScans > 0 ? Math.round((dangerousCount / totalScans) * 100) : 0,
      },
      riskBreakdown: riskMap,
      recentScans,
      dailyActivity: dailyScans,
      topTargets,
      securityScore: overallScore,
      copilotRecommendations: recommendations
    };

    await cache.set(cacheKey, responseData, 60);
    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
