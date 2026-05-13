const axios = require('axios');

const CISA_ADVISORIES_URL = 'https://www.cisa.gov/news-events/cybersecurity-advisories';
const CACHE_TTL_MS = 15 * 60 * 1000;

let cache = {
  fetchedAt: 0,
  items: [],
};

const decodeHtml = (value) => {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getTone = (title, meta) => {
  const text = `${title} ${meta}`.toLowerCase();
  if (/known exploited|critical|actively exploited|ransomware|iranian|phishing|state-sponsored/.test(text)) {
    return 'dangerous';
  }
  if (/advisory|malware|vulnerability|catalog/.test(text)) {
    return 'review';
  }
  return 'watch';
};

const parseCisaAdvisories = (html) => {
  const articlePattern = /<article[\s\S]*?<time datetime="([^"]+)"[\s\S]*?<div class="c-teaser__meta">([^<]+)<\/div>[\s\S]*?<h3 class="c-teaser__title">[\s\S]*?<a href="([^"]+)"[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/a>[\s\S]*?<\/h3>/g;
  const items = [];
  let match;

  while ((match = articlePattern.exec(html)) && items.length < 8) {
    const [, publishedAt, meta, href, rawTitle] = match;
    const title = decodeHtml(rawTitle.replace(/<[^>]+>/g, ''));
    const advisoryType = decodeHtml(meta);
    const link = href.startsWith('http') ? href : `https://www.cisa.gov${href}`;

    items.push({
      id: `${publishedAt}-${href}`,
      title,
      advisoryType,
      publishedAt,
      link,
      source: 'CISA Advisories',
      tone: getTone(title, advisoryType),
    });
  }

  return items;
};

const getThreatFeed = async () => {
  const now = Date.now();
  if (cache.items.length > 0 && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }

  const response = await axios.get(CISA_ADVISORIES_URL, {
    timeout: 10000,
    headers: {
      'User-Agent': 'CyberShieldX/1.0 (+https://localhost)',
    },
  });

  const items = parseCisaAdvisories(response.data);
  cache = {
    fetchedAt: now,
    items,
    sourceUrl: CISA_ADVISORIES_URL,
  };

  return cache;
};

module.exports = {
  getThreatFeed,
};
