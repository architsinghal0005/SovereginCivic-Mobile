import { z } from 'zod';
import { grievanceBodySchema } from '../validators/grievance.validator';

// Infer the type from Zod schema so we have strongly typed body (latitude and longitude are numbers)
export type GrievanceReportBody = z.infer<typeof grievanceBodySchema>;

// Contract for the uploaded Multer files
export interface GrievanceReportFiles {
  audio: Express.Multer.File[];
  image?: Express.Multer.File[];
}

// Full request contract
export interface GrievanceReportRequest {
  body: GrievanceReportBody;
  files: GrievanceReportFiles;
}
