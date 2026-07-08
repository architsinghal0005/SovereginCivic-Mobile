import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { grievanceRouter } from './routes/grievance.routes';
import { notifyRouter, notificationsRouter } from './routes/notify.routes';
import { officerRouter } from './routes/officer.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { logger } from './utils/logger';
import { errorConverter, errorHandler } from './middleware/error.middleware';
import { telemetryMiddleware } from './middleware/telemetry.middleware';

const app: Express = express();

import path from 'path';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request Logging Middleware & Telemetry
app.use(telemetryMiddleware);

// Health Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/grievance', grievanceRouter);
app.use('/api/notify', notifyRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/officer', officerRouter);
app.use('/api/dashboard', dashboardRouter);

// Convert all loose errors to standardized ApiError
app.use(errorConverter);

// Apply Global Error Handler
app.use(errorHandler);

export { app, logger };
