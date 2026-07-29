import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../../../services/api';

/**
 * useScanner Hook
 * Manages scan execution states, streams output over WebSockets, and falls back to HTTP.
 */
export default function useScanner(toolId) {
  const [target, setTarget] = useState('');
  const [results, setResults] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const appendResult = useCallback((text) => {
    setResults((prev) => prev + text);
  }, []);

  const executeScanHTTP = useCallback(
    async (scanTarget) => {
      try {
        const response = await api.post('/toolkit/execute', {
          toolId,
          target: scanTarget,
        });
        const data = response.data;
        if (data?.output) {
          appendResult(data.output);
        } else if (data?.results) {
          appendResult(
            typeof data.results === 'string'
              ? data.results
              : JSON.stringify(data.results, null, 2)
          );
        } else if (data?.rawOutput) {
          appendResult(data.rawOutput);
        } else {
          appendResult(JSON.stringify(data, null, 2));
        }
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Scan failed';
        setError(msg);
      } finally {
        setScanning(false);
      }
    },
    [toolId, appendResult]
  );

  const executeScanWS = useCallback(
    (scanTarget) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = window.location.host;
        const ws = new WebSocket(
          `${protocol}://${host}/ws/toolkit?toolId=${encodeURIComponent(
            toolId
          )}&target=${encodeURIComponent(scanTarget)}`
        );
        wsRef.current = ws;

        ws.onopen = () => {
          appendResult(`[*] Connected — scanning ${scanTarget}...\n`);
        };

        ws.onmessage = (event) => {
          appendResult(event.data);
        };

        ws.onerror = () => {
          ws.close();
          wsRef.current = null;
          appendResult('[*] WebSocket unavailable, falling back to HTTP...\n');
          executeScanHTTP(scanTarget);
        };

        ws.onclose = (event) => {
          if (event.wasClean) {
            appendResult('\n[✓] Scan complete.\n');
          }
          setScanning(false);
          wsRef.current = null;
        };
      } catch {
        executeScanHTTP(scanTarget);
      }
    },
    [toolId, appendResult, executeScanHTTP]
  );

  const handleScan = () => {
    const trimmed = target.trim();
    if (!trimmed) return;

    setResults('');
    setError(null);
    setScanning(true);

    if (typeof WebSocket !== 'undefined') {
      executeScanWS(trimmed);
    } else {
      executeScanHTTP(trimmed);
    }
  };

  return {
    target,
    setTarget,
    results,
    scanning,
    error,
    setError,
    handleScan,
  };
}
