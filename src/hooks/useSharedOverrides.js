import { useEffect, useState, useRef } from 'react';

const POLL_MS = 30000; // re-check every 30s, same cadence as live results

// Fetches public/overrides.json from wherever this app is currently deployed
// (works automatically on GitHub Pages, localhost, or any static host).
// This file is manually edited via GitHub's web UI to share corrections with everyone.
export function useSharedOverrides() {
  const [overrides, setOverrides] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchOnce = async () => {
    try {
      // Cache-bust so browsers/CDNs don't serve a stale copy after an edit.
      const url = `${import.meta.env.BASE_URL}overrides.json?t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`overrides.json ${res.status}`);
      const json = await res.json();
      setOverrides(json || {});
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchOnce();
    intervalRef.current = setInterval(fetchOnce, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  return { overrides, loaded, error, refetch: fetchOnce };
}
