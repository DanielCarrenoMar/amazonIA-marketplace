import { WorkerService } from './worker.service';

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
