import { Redis } from '@upstash/redis';
import { STREAM_TOPICS } from '../streams';

async function clearRedis() {
  console.log('--- Clearing Redis (Upstash) Data ---');
  if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
    console.error('Error: REDIS_URL and REDIS_TOKEN environment variables are required.');
    process.exit(1);
  }

  const redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
  });

  const topics = Object.values(STREAM_TOPICS);
  
  try {
    console.log(`Deleting keys for topics: ${topics.join(', ')}...`);
    const deletedCount = await redis.del(...topics);
    console.log(`✅ Successfully deleted ${deletedCount} key(s) from Redis.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to delete keys:', err);
    process.exit(1);
  }
}

clearRedis();
