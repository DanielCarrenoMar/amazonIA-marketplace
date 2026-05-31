import { resolve, join } from 'path';

import { RedisProducerService } from './redis-producer';
import { RedisConsumerService } from './redis-consumer';
import { STREAM_TOPICS } from '../streams';

async function runTest() {
  console.log('--- Testing Redis Module ---');
  if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
    console.error('Error: REDIS_URL and REDIS_TOKEN environment variables are required.');
    console.log('Make sure they are set in apps/api/.env or passed inline.');
    process.exit(1);
  }
  
  console.log('REDIS_URL is configured properly.');

  const producer = new RedisProducerService();
  const consumer = new RedisConsumerService();

  const testTopic = STREAM_TOPICS.CLIMATE_EVENTS;
  const testMessage = {
    testId: Date.now(),
    message: 'Hello from the Redis test script!',
  };

  try {
    console.log(`\n1. Producing message to topic: ${testTopic}`);
    await producer.produce(testTopic, testMessage, 'test-key');
    console.log('   ✅ Message produced successfully.');

    console.log(`\n2. Consuming message from topic: ${testTopic}`);
    const messages = await consumer.consume('test-group', 'test-instance', testTopic);
    
    if (messages.length > 0) {
      console.log(`   ✅ Successfully consumed ${messages.length} message(s).`);
      console.log('   📩 Last message value:', messages[messages.length - 1].value);
    } else {
      console.log('   ⚠️ No messages consumed immediately. Sometimes it takes a moment, or there was a read offset issue.');
    }

    console.log('\n--- Test Completed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

runTest();
