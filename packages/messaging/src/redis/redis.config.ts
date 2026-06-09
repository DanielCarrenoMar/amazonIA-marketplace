import { Redis } from '@upstash/redis';

export function createRedisClient(): Redis {
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;

  if (!url || !token) {
    throw new Error(
      'REDIS_URL or REDIS_TOKEN environment variables are missing',
    );
  }

  return new Redis({
    url,
    token,
  });
}
