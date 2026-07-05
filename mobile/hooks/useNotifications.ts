import { useState, useCallback } from 'react';
import { fetchNotifications, AppNotification } from '../services/api';

export const useNotifications = (citizenId: string) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications(citizenId);
      // Backend doesn't persist 'read' state, default to unread
      setNotifications(data.map(n => ({ ...n, read: false })));
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [citizenId]);

  const markAsRead = (ticketId: string, timestamp: string) => {
    setNotifications(prev => prev.map(n => 
      (n.ticketId === ticketId && n.timestamp === timestamp) ? { ...n, read: true } : n
    ));
  };

  return { notifications, loading, error, refresh: load, markAsRead };
};
