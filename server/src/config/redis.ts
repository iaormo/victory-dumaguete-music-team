/**
 * Redis Configuration
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 10) return null;
    return Math.min(times * 200, 5000);
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

export default redis;

export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: string, ttlSeconds = 3600): Promise<void> => {
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch (err) {
    console.error('[Redis] Cache set error:', err);
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('[Redis] Cache delete error:', err);
  }
};
