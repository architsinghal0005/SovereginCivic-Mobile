import { Router } from 'express';
import { grievanceUploadMiddleware } from '../middleware/upload.middleware';
import { validateReportGrievance } from '../validators/grievance.validator';
import { reportGrievance, getGrievanceHistory } from '../controllers/grievance.controller';

const router = Router();

// POST /api/grievance/report
router.post(
  '/report',
  grievanceUploadMiddleware,
  validateReportGrievance,
  reportGrievance
);

// GET /api/grievance/history/:citizenId
router.get('/history/:citizenId', getGrievanceHistory);

export { router as grievanceRouter };
