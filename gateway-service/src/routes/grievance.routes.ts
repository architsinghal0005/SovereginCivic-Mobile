import { Router } from 'express';
import { grievanceUploadMiddleware } from '../middleware/upload.middleware';
import { validateReportGrievance } from '../validators/grievance.validator';
import { reportGrievance } from '../controllers/grievance.controller';

const router = Router();

// POST /api/grievance/report
router.post(
  '/report',
  grievanceUploadMiddleware,
  validateReportGrievance,
  reportGrievance
);

export { router as grievanceRouter };
