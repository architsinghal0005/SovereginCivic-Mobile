import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Define the schema for the multipart body fields (coercing strings from form-data)
export const grievanceBodySchema = z.object({
  citizenId: z.string().trim().min(1, 'citizenId cannot be empty'),
  latitude: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  imageUrl: z.string().trim().url('Invalid imageUrl provided').optional(),
});

// Define the comprehensive schema including files attached by Multer
export const reportGrievanceRequestSchema = z.object({
  body: grievanceBodySchema,
  files: z.any().optional(), // Using any to flexibly handle Multer's file dictionary structure
}).superRefine((data, ctx) => {
  const files = data.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  
  // 1. Validate required audio file
  if (!files || !files['audio'] || files['audio'].length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Audio file is required',
      path: ['files', 'audio'],
    });
  }

  // 2. Validate either image file OR imageUrl is present
  const hasImageFile = files && files['image'] && files['image'].length > 0;
  const hasImageUrl = !!data.body.imageUrl;

  if (!hasImageFile && !hasImageUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either image file OR imageUrl must be provided',
      path: ['body', 'imageUrl'], // Attached to imageUrl path for convenience
    });
  }
});

/**
 * Reusable Express Middleware to validate the POST /api/grievance/report request
 */
export const validateReportGrievance = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = reportGrievanceRequestSchema.parse({
      body: req.body,
      files: req.files,
    });
    
    // Coerce parsed fields back into req.body (e.g. string -> number for lat/long)
    req.body = validated.body;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};
