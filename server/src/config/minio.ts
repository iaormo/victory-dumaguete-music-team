/**
 * MinIO Object Storage Configuration
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'victory-uploads';

export const initMinIO = async (): Promise<void> => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      });
      await minioClient.setBucketPolicy(BUCKET_NAME, policy);
      console.log(`[MinIO] Bucket '${BUCKET_NAME}' created with public read policy`);
    } else {
      console.log(`[MinIO] Bucket '${BUCKET_NAME}' already exists`);
    }
  } catch (err) {
    console.error('[MinIO] Initialization error:', err);
  }
};

export const uploadFile = async (
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> => {
  const objectName = `${Date.now()}-${fileName}`;
  await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
    'Content-Type': contentType,
  });

  if (process.env.MINIO_PUBLIC_URL) {
    return `${process.env.MINIO_PUBLIC_URL}/${BUCKET_NAME}/${objectName}`;
  }
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const port = process.env.MINIO_PORT || '9000';
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  return `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${objectName}`;
};

export const deleteFile = async (objectUrl: string): Promise<void> => {
  try {
    const objectName = objectUrl.split(`/${BUCKET_NAME}/`).pop();
    if (objectName) {
      await minioClient.removeObject(BUCKET_NAME, objectName);
    }
  } catch (err) {
    console.error('[MinIO] Delete error:', err);
  }
};

export default minioClient;
