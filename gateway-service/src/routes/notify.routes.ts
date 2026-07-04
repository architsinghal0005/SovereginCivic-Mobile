import { Router } from 'express';
import { receiveNotification, getCitizenNotifications } from '../controllers/notify.controller';
import { notifySchema } from '../validators/notify.validator';

// Basic validation middleware helper since we use Zod
const validate = (schema: any) => (req: any, res: any, next: any) => {
  try {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  } catch (err: any) {
    return res.status(400).json({ success: false, errors: err.errors });
  }
};

const notifyRouter = Router();

// POST /api/notify
notifyRouter.post('/', validate(notifySchema), receiveNotification);

const notificationsRouter = Router();

// GET /api/notifications/:citizenId
notificationsRouter.get('/:citizenId', getCitizenNotifications);

export { notifyRouter, notificationsRouter };
