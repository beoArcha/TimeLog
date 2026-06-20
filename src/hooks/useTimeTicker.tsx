import { useState, useEffect } from 'react';

export const useTimeTicker = () => {
  const [nowIso, setNowIso] = useState<string>(new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowIso(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return { nowIso, setNowIso };
};
