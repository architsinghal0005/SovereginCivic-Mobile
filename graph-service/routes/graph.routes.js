// Cleaned up imports
import { Router } from 'express';
import { 
    getHeatmap, 
    getAnalyticsSummary, 
    getAnalytics 
} from "../controllers/analytics.controller.js";

const router = Router();
router.get('/analytics', getAnalytics);
router.get('/heatmap', getHeatmap);
router.get('/analytics/summary', getAnalyticsSummary);

export default router;