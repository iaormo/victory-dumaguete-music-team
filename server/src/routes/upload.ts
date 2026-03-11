/**
 * File Upload Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadFile } from '../config/minio.js';

const router = Router();

router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const url = await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype);
    res.json({ url, filename: req.file.originalname, size: req.file.size });
  } catch (err) {
    console.error('[Upload] Error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
