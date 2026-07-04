import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';

const dashboardRouter = Router();

// GET /api/dashboard
dashboardRouter.get('/', getDashboardStats);

export { dashboardRouter };
