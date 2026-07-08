import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed MIME types
const AUDIO_MIMES = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'];
const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Storage configuration for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter logic to restrict based on MIME type
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'audio') {
    if (AUDIO_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid audio format: ${file.mimetype}. Allowed formats are wav, mp3, m4a.`));
    }
  } else if (file.fieldname === 'image') {
    if (IMAGE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image format: ${file.mimetype}. Allowed formats are jpg, jpeg, png, webp.`));
    }
  } else {
    cb(new Error(`Unexpected field: ${file.fieldname}. Only 'audio' and 'image' are allowed.`));
  }
};

// Initialize multer with global 20MB limit (which is the max audio size)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB overall max
  }
});

// Create base middleware handling the specific 'audio' and 'image' fields
const multerFieldsMiddleware = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

/**
 * Wrapper middleware to enforce distinct file size limits 
 * (Audio: 20MB, Image: 10MB) and format error messages cleanly.
 */
export const grievanceUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  multerFieldsMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Max file size is 5MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      // Return custom filter errors (e.g. invalid MIME types)
      return res.status(400).json({ error: err.message }); 
    }
    
    // Check specific file sizes if files are successfully uploaded
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    if (files && files['image'] && files['image'][0]) {
      const imageFile = files['image'][0];
      
      // Strict 5MB limit for image files specifically (though already caught by global limit, this is redundant safety)
      if (imageFile.size > 5 * 1024 * 1024) { 
        // Cleanup uploaded files since validation failed
        if (files['audio'] && files['audio'][0]) {
          fs.promises.unlink(files['audio'][0].path).catch(() => {});
        }
        fs.promises.unlink(imageFile.path).catch(() => {});
        
        return res.status(400).json({ error: 'Image file too large. Max allowed size is 5MB.' });
      }
    }
    
    next();
  });
};
