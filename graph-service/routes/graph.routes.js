// Cleaned up imports
import { Router } from 'express';
import { 
    getHeatmap, 
    getAnalyticsSummary, 
    getAnalytics 
} from "../controllers/analytics.controller.js";
import { getCitizenGrievances } from "../controllers/citizen.controller.js";
import { updateGrievancesStatus } from "../controllers/update.controller.js";

import { ingestGrievance } from "../controllers/ingest.controller.js";

const router = Router();

// Routes implicitly prefixed with '/api/graph' due to server.js mount
router.post('/ingest', ingestGrievance);
router.get('/analytics', getAnalytics);
router.get('/heatmap', getHeatmap);
router.get('/analytics/summary', getAnalyticsSummary);
router.get('/citizen/:citizenId/grievances', getCitizenGrievances);
router.patch('/grievances/status', updateGrievancesStatus);

export default router;