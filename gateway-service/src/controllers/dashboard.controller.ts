import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { neo4jService } from '../services/neo4j.service';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await neo4jService.getDashboardStats();
  res.status(200).json({ success: true, data: stats });
});
