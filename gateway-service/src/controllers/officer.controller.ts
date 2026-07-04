import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger';

const CASEWORKER_URL = process.env.CASEWORKER_URL || 'http://localhost:3001';

export const getTickets = asyncHandler(async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${CASEWORKER_URL}/api/officer/tickets`, { timeout: 10000 });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    const axiosError = error as AxiosError;
    logger.error('Failed to forward getTickets to Caseworker Engine', { error: error.message });
    res.status(axiosError.response?.status || 502).json(axiosError.response?.data || { error: 'Bad Gateway' });
  }
});

export const startTicket = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  try {
    const response = await axios.patch(`${CASEWORKER_URL}/api/officer/${ticketId}/start`, req.body, { timeout: 10000 });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    const axiosError = error as AxiosError;
    logger.error('Failed to forward startTicket to Caseworker Engine', { error: error.message, ticketId });
    res.status(axiosError.response?.status || 502).json(axiosError.response?.data || { error: 'Bad Gateway' });
  }
});

export const resolveTicket = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  try {
    const response = await axios.patch(`${CASEWORKER_URL}/api/officer/${ticketId}/resolve`, req.body, { timeout: 10000 });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    const axiosError = error as AxiosError;
    logger.error('Failed to forward resolveTicket to Caseworker Engine', { error: error.message, ticketId });
    res.status(axiosError.response?.status || 502).json(axiosError.response?.data || { error: 'Bad Gateway' });
  }
});
