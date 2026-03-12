/**
 * Local File Storage Configuration
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');

export const initStorage = async (): Promise<void> => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`[Storage] Created uploads directory: ${UPLOAD_DIR}`);
  } else {
    console.log(`[Storage] Uploads directory ready: ${UPLOAD_DIR}`);
  }
};

export const uploadFile = async (
  fileName: string,
  buffer: Buffer,
  _contentType: string
): Promise<string> => {
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${safeName}`;
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const fileName = fileUrl.split('/uploads/').pop();
    if (fileName) {
      const filePath = path.join(UPLOAD_DIR, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error('[Storage] Delete error:', err);
  }
};

export const getUploadDir = () => UPLOAD_DIR;
