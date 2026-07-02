import { useState, useEffect } from 'react';
import { CONFIG } from '../constants/config';

export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Unknown';

export const useTicketPolling = (reportId: string | null) => {
  const [status, setStatus] = useState<TicketStatus>('Unknown');
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!reportId) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    const pollStatus = async () => {
      try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/grievance/status/${reportId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status) {
            setStatus(data.status);
          }
        }
      } catch (error) {
        console.warn('Polling failed, retrying on next tick...', error);
      }
    };

    // Initial poll
    pollStatus();
    
    // Set up interval for every 5 seconds
    const intervalId = setInterval(pollStatus, 5000);

    return () => clearInterval(intervalId);
  }, [reportId]);

  return { status, isPolling };
};
