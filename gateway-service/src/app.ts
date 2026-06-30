import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { grievanceRouter } from './routes/grievance.routes';
import { logger } from './utils/logger';
import { errorConverter, errorHandler } from './middleware/error.middleware';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
});

// Health Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Grievance Routes
app.use('/api/grievance', grievanceRouter);

// Convert all loose errors to standardized ApiError
app.use(errorConverter);

// Apply Global Error Handler
app.use(errorHandler);

export { app, logger };
