const STORAGE_KEY = 'csx_recent_scans';
const MAX_ITEMS = 8;

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getRecentLocalScans = () => {
  if (!canUseStorage()) return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveRecentLocalScan = (scan) => {
  if (!canUseStorage() || !scan) return [];

  const nextEntry = {
    id: scan.id || scan._id || null,
    target: scan.target,
    targetType: scan.targetType,
    threatScore: scan.threatScore,
    riskLevel: scan.risk?.level || scan.riskLevel || 'safe',
    scannedAt: scan.scannedAt || scan.createdAt || new Date().toISOString(),
  };

  const history = getRecentLocalScans();
  const deduped = history.filter((entry) => {
    if (nextEntry.id && entry.id) return entry.id !== nextEntry.id;
    return !(entry.target === nextEntry.target && entry.scannedAt === nextEntry.scannedAt);
  });

  const updated = [nextEntry, ...deduped].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const clearRecentLocalScans = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
};
