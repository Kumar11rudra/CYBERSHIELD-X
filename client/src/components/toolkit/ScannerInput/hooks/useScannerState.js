import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { validateTarget } from '../../../../utils/smartValidator';
import { analyzeDomainHeuristics } from '../../../../utils/iocExtractor';
import { extractIOCs } from '../../../../utils/iocExtractor';
import { useAuth } from '../../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { saveRecentLocalScan } from '../../../../utils/localScanHistory';
import { mobileUX } from '../../../../utils/mobileUX';

/**
 * useScannerState Hook
 * Handles target validations, domain heuristics, haptic feedback, and scan request routing.
 */
export default function useScannerState({ onResult, copy, t }) {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [extractedTargets, setExtractedTargets] = useState([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  const validation = useMemo(() => validateTarget(target), [target]);
  const detectedType = validation.type;
  const heuristics = useMemo(() =>
    detectedType === 'domain' || detectedType === 'url'
      ? analyzeDomainHeuristics(target)
      : { suspicious: false },
    [target, detectedType]
  );

  const handleScan = async (e, overrideTarget) => {
    if (e) e.preventDefault();
    const finalTarget = (overrideTarget || target).trim();

    if (!validateTarget(finalTarget).valid) {
      const extracted = extractIOCs(finalTarget);
      if (extracted.length > 0) {
        setExtractedTargets(extracted);
        toast(t('scanner.multipleTargets'), { icon: '🔍' });
        return;
      }
      toast.error(t('scanner.invalidTarget'));
      return;
    }

    if (!user) {
      toast.error(copy.loginToScan);
      navigate('/login');
      return;
    }

    setLoading(true);
    setResult(null);
    setExtractedTargets([]);
    mobileUX.impact('HEAVY');

    try {
      const res = await api.post('/scan', { target: finalTarget });
      setResult(res.data.scan);
      setTarget(finalTarget);
      saveRecentLocalScan(res.data.scan);
      onResult?.(res.data.scan);

      if (res.data.scan.risk.level === 'dangerous') {
        mobileUX.vibrate();
        toast.error(`${copy.dangerToast} ${res.data.scan.threatScore}/100`, { duration: 6000 });
      } else if (res.data.scan.risk.level === 'medium') {
        mobileUX.impact('MEDIUM');
        toast(`${copy.mediumToast} ${res.data.scan.threatScore}/100`, {
          icon: '⚡',
          duration: 5000,
          style: { borderColor: '#ff8c00' },
        });
      } else {
        mobileUX.impact('LIGHT');
        toast.success(`${copy.appears} ${res.data.scan.risk.label}`);
      }
    } catch (err) {
      mobileUX.impact('LIGHT');
      const msg = err.response?.data?.error || copy.scanFailed;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    target,
    setTarget,
    loading,
    result,
    setResult,
    inputFocused,
    setInputFocused,
    extractedTargets,
    setExtractedTargets,
    detectedType,
    heuristics,
    handleScan,
  };
}
