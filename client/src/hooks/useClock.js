import { useState, useEffect } from 'react';

/**
 * useClock Hook
 * Provides reactively updating clock state.
 */
export function useClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
}

export default useClock;
