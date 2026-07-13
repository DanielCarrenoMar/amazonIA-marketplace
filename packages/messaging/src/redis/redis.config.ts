import { Redis } from '@upstash/redis';

export function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;

  if (!url || !token) {
    console.warn('REDIS_URL or REDIS_TOKEN environment variables are missing. Running without Redis.');
    return null;
  }

  return new Redis({
    url,
    token,
  });
}
