import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import { logger } from '../utils/logger';

interface NotificationPayload {
  ticketId: string;
  newState: string;
  message: string;
  timestamp: string;
}

// Temporary in-memory storage for notifications
const notificationsStore: NotificationPayload[] = [];

/**
 * Receive notification from Caseworker Engine
 * POST /api/notify
 */
export const receiveNotification = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId, newState, message } = req.body;

  const notification: NotificationPayload = {
    ticketId,
    newState,
    message,
    timestamp: new Date().toISOString()
  };

  notificationsStore.push(notification);
  logger.info('Received and stored notification', { ticketId, newState });

  res.status(201).json({ success: true, message: 'Notification stored successfully' });
});

/**
 * Get notifications for a specific citizen
 * GET /api/notifications/:citizenId
 */
export const getCitizenNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { citizenId } = req.params;

  try {
    // 1. Fetch citizen's tickets from Graph Service
    const graphUrl = `${(process.env.GRAPH_SERVICE_URL || 'http://localhost:4000').replace(/\/$/, '')}/api/graph/citizen/${citizenId}/grievances`;
    const response = await axios.get(graphUrl, { timeout: 10000 });
    const grievances = response.data.grievances || [];
    
    // Extract ticket IDs
    const ticketIds = grievances.map((g: any) => g.id);

    // 2. Filter notifications belonging to these ticket IDs
    const citizenNotifications = notificationsStore
      .filter(n => ticketIds.includes(n.ticketId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // newest first

    res.status(200).json({ success: true, notifications: citizenNotifications });
  } catch (error: any) {
    logger.error('Error fetching citizen notifications', { error: error.message, citizenId });
    // If graph service fails, just return empty to be safe
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});
