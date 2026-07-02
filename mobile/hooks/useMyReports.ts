import { useState, useCallback } from 'react';
import { fetchMyReports, Grievance } from '../services/api';

export const useMyReports = (citizenId: string) => {
  const [reports, setReports] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyReports(citizenId);
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [citizenId]);

  return { reports, loading, error, refresh: load };
};
