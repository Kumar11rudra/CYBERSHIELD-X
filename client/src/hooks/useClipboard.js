import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * useClipboard hook
 * Handles copying text to system clipboard.
 */
export function useClipboard(successMessage = 'Copied to clipboard!') {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text) => {
    if (!navigator.clipboard) {
      console.warn('[useClipboard] Clipboard API not supported.');
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      console.warn('[useClipboard] Copy failed:', err);
      return false;
    }
  }, [successMessage]);

  return { copied, copy };
}

export default useClipboard;
