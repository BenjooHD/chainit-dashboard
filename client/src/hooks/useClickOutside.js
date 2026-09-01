import { useEffect } from 'react';

export function useClickOutside(ref, onOutside, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside, enabled]);
}
