import { useState, useCallback } from 'react';

/**
 * useAsync hook
 * Wraps async functions, providing loading state, result, error, and executor.
 */
export function useAsync(asyncFunction) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [value, setValue] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await asyncFunction(...args);
      setValue(response);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return { loading, error, value, execute, setValue, setError };
}

export default useAsync;
