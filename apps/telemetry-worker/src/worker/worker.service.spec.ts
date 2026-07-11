import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConsumedMessage,
  IMessageConsumer,
  IMessageProducer,
  MESSAGE_CONSUMER,
  MESSAGE_PRODUCER,
  REDIS_CLIENT,
  STREAM_TOPICS,
} from 'messaging';
import { IClimateEvent } from 'event-types';
import { ClimateEventDocument, ShipmentEventDocument } from 'database';
import { WorkerService } from './worker.service';

const CONSUMER_GROUP = 'telemetry-worker-group';

function buildClimateMessage(
  overrides: Partial<IClimateEvent> = {},
  offset = '1-0',
): ConsumedMessage<IClimateEvent> {
  return {
    topic: STREAM_TOPICS.CLIMATE_EVENTS,
    partition: 0,
    offset,
    key: null,
    value: {
      event_id: 'evt-001',
      event_type: 'environment_reading' as any,
      recorded_at: '2024-06-08T10:00:00Z',
      ingested_at: '2024-06-08T10:00:01Z',
      metadata: {
        sensor_id: 'sensor-1',
        facility_id: 'facility-1',
        sensor_type: 'temperature' as any,
      },
      location: { type: 'Point', coordinates: [-73.12, -3.89] },
      telemetry: { temperature_celsius: 22.5 },
      ...overrides,
    },
    timestamp: Date.now(),
  };
}

function buildRedisMock() {
  const hash = new Map<string, number>();

  return {
    hincrby: jest.fn(async (key: string, field: string, increment: number) => {
      const mapKey = `${key}:${field}`;
      const current = hash.get(mapKey) ?? 0;
      const next = current + increment;
      hash.set(mapKey, next);
      return next;
    }),
    hdel: jest.fn(async (key: string, field: string) => {
      const mapKey = `${key}:${field}`;
      hash.delete(mapKey);
      return 1;
    }),
    _hash: hash,
  };
}

async function createService(
  overrides: {
    climateModel?: Record<string, jest.Mock>;
    shipmentModel?: Record<string, jest.Mock>;
    consumer?: Record<string, jest.Mock>;
    producer?: Record<string, jest.Mock>;
    redis?: Record<string, jest.Mock>;
    env?: Record<string, string>;
  } = {},
): Promise<{ service: WorkerService; mocks: ReturnType<typeof buildMocks> }> {
  const mocks = buildMocks(overrides);

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      WorkerService,
      {
        provide: ConfigService,
        useValue: {
          get: (key: string, fallback?: string) =>
            mocks.env[key] ?? fallback ?? undefined,
        },
      },
      {
        provide: getModelToken(ClimateEventDocument.name),
        useValue: mocks.climateModel,
      },
      {
        provide: getModelToken(ShipmentEventDocument.name),
        useValue: mocks.shipmentModel,
      },
      {
        provide: MESSAGE_CONSUMER,
        useValue: mocks.consumer,
      },
      {
        provide: MESSAGE_PRODUCER,
        useValue: mocks.producer,
      },
      {
        provide: REDIS_CLIENT,
        useValue: mocks.redis,
      },
    ],
  }).compile();

  const service = module.get(WorkerService);
  return { service, mocks };
}

function buildMocks(
  overrides: {
    climateModel?: Record<string, jest.Mock>;
    shipmentModel?: Record<string, jest.Mock>;
    consumer?: Record<string, jest.Mock>;
    producer?: Record<string, jest.Mock>;
    redis?: Record<string, jest.Mock>;
    env?: Record<string, string>;
  } = {},
) {
  return {
    env: overrides.env ?? {},
    climateModel: overrides.climateModel ?? {
      create: jest.fn().mockResolvedValue({}),
    },
    shipmentModel: overrides.shipmentModel ?? {
      create: jest.fn().mockResolvedValue({}),
    },
    consumer:
      overrides.consumer ??
      ({
        consume: jest.fn().mockResolvedValue([]),
        ack: jest.fn().mockResolvedValue(undefined),
      } as unknown as Record<string, jest.Mock>),
    producer:
      overrides.producer ??
      ({
        produce: jest.fn().mockResolvedValue(undefined),
      } as unknown as Record<string, jest.Mock>),
    redis: overrides.redis ?? buildRedisMock(),
  };
}

describe('WorkerService', () => {
  it('persists a valid message and acknowledges it', async () => {
    const message = buildClimateMessage();
    const consumer = {
      consume: jest.fn().mockImplementation(async (_g, _i, topic) => {
        return topic === STREAM_TOPICS.CLIMATE_EVENTS ? [message] : [];
      }),
      ack: jest.fn().mockResolvedValue(undefined),
    };

    const { service, mocks } = await createService({ consumer });

    await service.pollStreams();

    expect(mocks.climateModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: 'evt-001',
        event_type: 'environment_reading',
        metadata: expect.objectContaining({ sensor_id: 'sensor-1' }),
        telemetry: expect.objectContaining({ temperature_celsius: 22.5 }),
      }),
    );
    expect(consumer.ack).toHaveBeenCalledWith(
      CONSUMER_GROUP,
      STREAM_TOPICS.CLIMATE_EVENTS,
      [message.offset],
    );
    expect(mocks.redis.hdel).toHaveBeenCalledWith(
      'telemetry-worker:retries:iot.climate.events',
      message.offset,
    );
    expect(mocks.producer.produce).not.toHaveBeenCalled();
  });

  it('retries an invalid message 3 times and then moves it to the DLQ + ack', async () => {
    const invalidMessage = buildClimateMessage(
      { recorded_at: 'not-a-date' },
      'bad-1-0',
    );
    const validMessage = buildClimateMessage({}, 'ok-1-0');

    let callIndex = 0;
    const consumer = {
      consume: jest.fn().mockImplementation(async (_g, _i, topic) => {
        if (topic !== STREAM_TOPICS.CLIMATE_EVENTS) return [];
        // First three calls deliver the bad message; afterwards deliver a valid one.
        callIndex++;
        return callIndex <= 3 ? [invalidMessage] : [validMessage];
      }),
      ack: jest.fn().mockResolvedValue(undefined),
    };

    const climateModel = {
      create: jest
        .fn()
        .mockRejectedValueOnce(new Error('Invalid Date'))
        .mockRejectedValueOnce(new Error('Invalid Date'))
        .mockRejectedValueOnce(new Error('Invalid Date'))
        .mockResolvedValue({}),
    };

    const { service, mocks } = await createService({
      consumer,
      climateModel,
      env: { MAX_MESSAGE_RETRIES: '3' },
    });

    // Attempt 1
    await service.pollStreams();
    expect(mocks.redis.hincrby).toHaveBeenCalledWith(
      'telemetry-worker:retries:iot.climate.events',
      invalidMessage.offset,
      1,
    );
    expect(mocks.producer.produce).not.toHaveBeenCalled();
    expect(consumer.ack).not.toHaveBeenCalled();

    // Attempt 2
    await service.pollStreams();
    expect(mocks.producer.produce).not.toHaveBeenCalled();

    // Attempt 3 -> DLQ
    await service.pollStreams();
    expect(mocks.producer.produce).toHaveBeenCalledTimes(1);
    expect(mocks.producer.produce).toHaveBeenCalledWith(
      STREAM_TOPICS.CLIMATE_EVENTS_DLQ,
      expect.objectContaining({
        originalMessage: invalidMessage.value,
        retryCount: 3,
        topic: STREAM_TOPICS.CLIMATE_EVENTS,
        offset: invalidMessage.offset,
      }),
    );
    expect(consumer.ack).toHaveBeenCalledWith(
      CONSUMER_GROUP,
      STREAM_TOPICS.CLIMATE_EVENTS,
      [invalidMessage.offset],
    );
    expect(mocks.redis.hdel).toHaveBeenCalledWith(
      'telemetry-worker:retries:iot.climate.events',
      invalidMessage.offset,
    );

    // Subsequent valid message is processed normally
    await service.pollStreams();
    expect(climateModel.create).toHaveBeenCalledTimes(4);
    expect(consumer.ack).toHaveBeenCalledWith(
      CONSUMER_GROUP,
      STREAM_TOPICS.CLIMATE_EVENTS,
      [validMessage.offset],
    );
  });

  it('does not block later messages when a corrupt message is in the batch', async () => {
    const corruptMessage = buildClimateMessage(
      { event_id: undefined } as any,
      'corrupt-1-0',
    );
    const validMessage = buildClimateMessage({}, 'valid-1-0');

    const consumer = {
      consume: jest.fn().mockImplementation(async (_g, _i, topic) => {
        return topic === STREAM_TOPICS.CLIMATE_EVENTS
          ? [corruptMessage, validMessage]
          : [];
      }),
      ack: jest.fn().mockResolvedValue(undefined),
    };

    const climateModel = {
      create: jest.fn().mockResolvedValue({}),
    };

    const { service, mocks } = await createService({ consumer, climateModel });

    await service.pollStreams();

    // The corrupt message is rejected during validation, so only the valid one reaches MongoDB.
    expect(climateModel.create).toHaveBeenCalledTimes(1);
    expect(consumer.ack).toHaveBeenCalledTimes(1);
    expect(consumer.ack).toHaveBeenCalledWith(
      CONSUMER_GROUP,
      STREAM_TOPICS.CLIMATE_EVENTS,
      [validMessage.offset],
    );
    expect(mocks.redis.hincrby).toHaveBeenCalledWith(
      'telemetry-worker:retries:iot.climate.events',
      corruptMessage.offset,
      1,
    );
    expect(mocks.producer.produce).not.toHaveBeenCalled();
  });

  it('clears the retry counter after sending a message to the DLQ', async () => {
    const invalidMessage = buildClimateMessage(
      { telemetry: 'not-an-object' } as any,
      'bad-2-0',
    );

    const consumer = {
      consume: jest.fn().mockImplementation(async (_g, _i, topic) => {
        return topic === STREAM_TOPICS.CLIMATE_EVENTS ? [invalidMessage] : [];
      }),
      ack: jest.fn().mockResolvedValue(undefined),
    };

    const climateModel = {
      create: jest.fn().mockRejectedValue(new Error('CastError')),
    };

    const { service, mocks } = await createService({
      consumer,
      climateModel,
      env: { MAX_MESSAGE_RETRIES: '3' },
    });

    for (let i = 0; i < 3; i++) {
      await service.pollStreams();
    }

    expect(mocks.producer.produce).toHaveBeenCalledTimes(1);
    expect(mocks.redis.hdel).toHaveBeenLastCalledWith(
      'telemetry-worker:retries:iot.climate.events',
      invalidMessage.offset,
    );
    expect(consumer.ack).toHaveBeenLastCalledWith(
      CONSUMER_GROUP,
      STREAM_TOPICS.CLIMATE_EVENTS,
      [invalidMessage.offset],
    );
  });
});

type ServiceUnderTest = {
  insertWithRetry: (model: any, docs: any[], maxRetries?: number) => Promise<void>;
  logger: any;
};

function makePartialService(): ServiceUnderTest {
  const svc = Object.create(WorkerService.prototype) as ServiceUnderTest;
  svc.logger = { warn: jest.fn(), log: jest.fn(), error: jest.fn() };
  return svc;
}

function makeModel(failTimes: number) {
  let calls = 0;
  return {
    insertMany: jest.fn().mockImplementation(() => {
      calls++;
      if (calls <= failTimes) return Promise.reject(new Error('mongo blip'));
      return Promise.resolve([]);
    }),
  };
}

describe('WorkerService.insertWithRetry', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('succeeds on first attempt when mongo is healthy', async () => {
    const model = makeModel(0);
    const svc = makePartialService();

    await svc.insertWithRetry(model, [{ a: 1 }]);

    expect(model.insertMany).toHaveBeenCalledTimes(1);
  });

  it('retries and succeeds after 1 failure', async () => {
    const model = makeModel(1);
    const svc = makePartialService();

    const promise = svc.insertWithRetry(model, [{ a: 1 }]);
    await jest.runAllTimersAsync();
    await promise;

    expect(model.insertMany).toHaveBeenCalledTimes(2);
    expect(svc.logger.warn).toHaveBeenCalledTimes(1);
  });

  it('retries and succeeds after 2 failures', async () => {
    const model = makeModel(2);
    const svc = makePartialService();

    const promise = svc.insertWithRetry(model, [{ a: 1 }]);
    await jest.runAllTimersAsync();
    await promise;

    expect(model.insertMany).toHaveBeenCalledTimes(3);
    expect(svc.logger.warn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting all 3 retries', async () => {
    const model = makeModel(10);
    const svc = makePartialService();

    const promise = svc.insertWithRetry(model, [{ a: 1 }]);
    // Attach rejection handler BEFORE advancing timers to avoid PromiseRejectionHandledWarning
    const assertion = expect(promise).rejects.toThrow('mongo blip');
    await jest.runAllTimersAsync();
    await assertion;

    expect(model.insertMany).toHaveBeenCalledTimes(3);
  });

  it('uses exponential backoff: 100ms → 200ms → 400ms', async () => {
    jest.useRealTimers();
    const delays: number[] = [];
    jest.spyOn(global, 'setTimeout').mockImplementation((fn: any, ms?: number) => {
      delays.push(ms ?? 0);
      fn();
      return 0 as any;
    });

    const model = makeModel(10);
    const svc = makePartialService();

    await svc.insertWithRetry(model, [{ a: 1 }]).catch(() => {});

    expect(delays).toEqual([100, 200, 400]);
    jest.restoreAllMocks();
  });
});
