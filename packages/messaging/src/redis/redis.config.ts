import { Redis } from '@upstash/redis';

export function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;

  if (!url || !token) {
    console.warn(
      '[MessagingModule] REDIS_URL/REDIS_TOKEN not set — running in no-op mode. ' +
      'Messaging events will be silently discarded. Set these vars for full functionality.',
    );
    return null;
  }

  return new Redis({ url, token });
}
