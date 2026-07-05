import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchMyReports, Grievance } from '../services/api';

export const useMyReports = (citizenId: string) => {
  const [reports, setReports] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async (isSilent = false) => {
    // Prevent duplicate requests
    if (loading || isRefreshing) return;
    
    if (isSilent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    // Setup abort controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const data = await fetchMyReports(citizenId, abortControllerRef.current.signal);
      setReports(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load reports.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [citizenId, loading, isRefreshing]);

  // Cancel requests when screen unmounts
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Automatic refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      load(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return { 
    reports, 
    loading, 
    isRefreshing, 
    error, 
    refresh: () => load(false) 
  };
};
