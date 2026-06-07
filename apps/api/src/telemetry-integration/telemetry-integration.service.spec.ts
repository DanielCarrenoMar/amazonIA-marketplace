import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ShipmentEventDocument } from 'database';
import { TelemetryIntegrationService } from './telemetry-integration.service';
import { CircuitState } from './circuit-breaker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDoc(overrides: Record<string, unknown> = {}) {
  return {
    event_id: 'evt-001',
    event_type: 'shipment_telemetry',
    recorded_at: new Date('2024-06-08T10:00:00Z'),
    ingested_at: new Date('2024-06-08T10:00:01Z'),
    metadata: { tracking_number: 'AMZ-001', container_id: 'CONT-01' },
    location: { type: 'Point', coordinates: [-73.12, -3.89] },
    business_context: { status: 'in_transit', scan_type: 'gps' },
    telemetry: { temperature_celsius: 4.2, shock_g_force: 0.3 },
    ...overrides,
  };
}

function buildFindChain(result: unknown[] | Error) {
  const exec = result instanceof Error
    ? jest.fn().mockRejectedValue(result)
    : jest.fn().mockResolvedValue(result);
  return { sort: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec }) }) }) };
}

function buildSkipChain(result: unknown[] | Error) {
  const exec = result instanceof Error
    ? jest.fn().mockRejectedValue(result)
    : jest.fn().mockResolvedValue(result);
  return { sort: jest.fn().mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec }) }) }) }) };
}

function buildQueryChain(result: unknown[] | Error) {
  return {
    find: jest.fn().mockReturnValue(buildFindChain(result)),
    countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
  };
}

function buildFullModelMock(count: number, docs: unknown[], error?: Error) {
  const countExec = error
    ? jest.fn().mockRejectedValue(error)
    : jest.fn().mockResolvedValue(count);
  const docsExec = error
    ? jest.fn().mockRejectedValue(error)
    : jest.fn().mockResolvedValue(docs);
  return {
    find: jest.fn().mockReturnValue(buildSkipChain(error ?? docs)),
    countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    _docsExec: docsExec,
  };
}

// ---------------------------------------------------------------------------
// Factory — creates a fresh service with configurable env vars
// ---------------------------------------------------------------------------

async function createService(
  modelMock: Record<string, jest.Mock>,
  env: Record<string, string> = {},
): Promise<TelemetryIntegrationService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TelemetryIntegrationService,
      {
        provide: getModelToken(ShipmentEventDocument.name),
        useValue: modelMock,
      },
      {
        provide: ConfigService,
        useValue: {
          get: (key: string, fallback: string) => env[key] ?? fallback,
        },
      },
    ],
  }).compile();

  return module.get(TelemetryIntegrationService);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TelemetryIntegrationService', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  describe('null tracking number', () => {
    it('returns null immediately without querying MongoDB', async () => {
      const chain = buildQueryChain([buildDoc()]);
      const svc = await createService(chain);

      const result = await svc.getShipmentTelemetry(null);

      expect(result).toBeNull();
      expect(chain.find).not.toHaveBeenCalled();
    });
  });

  describe('CLOSED circuit — normal path', () => {
    it('returns mapped ShipmentEventDto array on success', async () => {
      const chain = buildQueryChain([buildDoc()]);
      const svc = await createService(chain);

      const result = await svc.getShipmentTelemetry('AMZ-001');

      expect(result).toHaveLength(1);
      expect(result![0].event_id).toBe('evt-001');
      expect(result![0].recorded_at).toBe('2024-06-08T10:00:00.000Z');
      expect(result![0].ingested_at).toBe('2024-06-08T10:00:01.000Z');
      expect(result![0].telemetry.temperature_celsius).toBe(4.2);
    });

    it('returns empty array when MongoDB returns no documents', async () => {
      const chain = buildQueryChain([]);
      const svc = await createService(chain);

      const result = await svc.getShipmentTelemetry('AMZ-999');

      expect(result).toEqual([]);
      expect(svc.circuitState).toBe(CircuitState.CLOSED);
    });
  });

  describe('circuit opens after consecutive MongoDB failures', () => {
    it('returns null for each failure and opens after threshold', async () => {
      const threshold = 3;
      const error = new Error('MongoNetworkError');
      const chain = buildQueryChain(error);
      const svc = await createService(chain, { CB_FAILURE_THRESHOLD: String(threshold) });

      for (let i = 0; i < threshold; i++) {
        const r = await svc.getShipmentTelemetry('AMZ-001');
        expect(r).toBeNull();
      }

      expect(svc.circuitState).toBe(CircuitState.OPEN);
    });

    it('fast-fails without querying MongoDB when circuit is OPEN', async () => {
      const threshold = 2;
      const chain = buildQueryChain(new Error('connection refused'));
      const svc = await createService(chain, { CB_FAILURE_THRESHOLD: String(threshold) });

      // Open the circuit
      for (let i = 0; i < threshold; i++) await svc.getShipmentTelemetry('AMZ-001');
      expect(svc.circuitState).toBe(CircuitState.OPEN);

      // Reset call count
      chain.find.mockClear();

      // Further calls should be intercepted
      const result = await svc.getShipmentTelemetry('AMZ-001');
      expect(result).toBeNull();
      expect(chain.find).not.toHaveBeenCalled();
    });
  });

  describe('circuit recovery (HALF_OPEN)', () => {
    const threshold = 2;
    const cooldown = 10_000;

    async function openCircuit(svc: TelemetryIntegrationService, chain: Record<string, jest.Mock>) {
      const origExec = chain.find().sort().limit().lean().exec;
      origExec.mockRejectedValue(new Error('down'));
      for (let i = 0; i < threshold; i++) await svc.getShipmentTelemetry('AMZ-001');
    }

    it('sends a probe after cooldown and closes on success', async () => {
      const chain = buildQueryChain(new Error('down'));
      const svc = await createService(chain, {
        CB_FAILURE_THRESHOLD: String(threshold),
        CB_COOLDOWN_MS: String(cooldown),
      });

      await openCircuit(svc, chain);
      expect(svc.circuitState).toBe(CircuitState.OPEN);

      // Swap to a successful response
      chain.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([buildDoc()]),
            }),
          }),
        }),
      });

      jest.advanceTimersByTime(cooldown);
      const result = await svc.getShipmentTelemetry('AMZ-001');

      expect(result).not.toBeNull();
      expect(svc.circuitState).toBe(CircuitState.CLOSED);
    });

    it('reopens the circuit when the probe fails', async () => {
      const chain = buildQueryChain(new Error('still down'));
      const svc = await createService(chain, {
        CB_FAILURE_THRESHOLD: String(threshold),
        CB_COOLDOWN_MS: String(cooldown),
      });

      await openCircuit(svc, chain);
      jest.advanceTimersByTime(cooldown);

      const result = await svc.getShipmentTelemetry('AMZ-001');
      expect(result).toBeNull();
      expect(svc.circuitState).toBe(CircuitState.OPEN);
    });
  });

  describe('timeout handling', () => {
    it('returns null and counts as a failure when MongoDB exceeds timeout', async () => {
      const timeoutMs = 100;
      const slowExec = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([buildDoc()]), timeoutMs + 500)),
      );
      const chain = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({ exec: slowExec }),
            }),
          }),
        }),
        countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
      };

      const svc = await createService(chain, { MONGODB_TIMEOUT_MS: String(timeoutMs) });

      const resultPromise = svc.getShipmentTelemetry('AMZ-001');
      jest.advanceTimersByTime(timeoutMs + 1);
      const result = await resultPromise;

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getShipmentHistory — paginated query
  // ---------------------------------------------------------------------------

  describe('getShipmentHistory', () => {
    it('returns paginated data and total on success', async () => {
      const doc = buildDoc();
      const chain = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([doc]) }),
              }),
            }),
          }),
        }),
        countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(42) }),
      };

      const svc = await createService(chain);
      const result = await svc.getShipmentHistory('AMZ-001', 1, 10);

      expect(result).not.toBeNull();
      expect(result!.total).toBe(42);
      expect(result!.data).toHaveLength(1);
      expect(result!.data[0].event_id).toBe('evt-001');
    });

    it('returns null when MongoDB fails and opens the circuit after threshold', async () => {
      const threshold = 2;
      const error = new Error('MongoNetworkError');
      const chain = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({ exec: jest.fn().mockRejectedValue(error) }),
              }),
            }),
          }),
        }),
        countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockRejectedValue(error) }),
      };

      const svc = await createService(chain, { CB_FAILURE_THRESHOLD: String(threshold) });

      for (let i = 0; i < threshold; i++) {
        expect(await svc.getShipmentHistory('AMZ-001', 1, 10)).toBeNull();
      }

      expect(svc.circuitState).toBe(CircuitState.OPEN);
    });

    it('shares circuit state with getShipmentTelemetry', async () => {
      const threshold = 2;
      const error = new Error('down');

      // Open the circuit via getShipmentTelemetry failures
      const chain = buildQueryChain(error);
      const svc = await createService(chain, { CB_FAILURE_THRESHOLD: String(threshold) });

      for (let i = 0; i < threshold; i++) await svc.getShipmentTelemetry('AMZ-001');
      expect(svc.circuitState).toBe(CircuitState.OPEN);

      // getShipmentHistory should also fast-fail (same circuit)
      const histChain = {
        find: jest.fn(),
        countDocuments: jest.fn(),
      };
      // Re-create service is not possible here since it's the same instance,
      // so we just verify the circuit is OPEN and getShipmentHistory returns null
      const result = await svc.getShipmentHistory('AMZ-001', 1, 10);
      expect(result).toBeNull();
      // The model's find/countDocuments were not called (fast-fail)
      expect(chain.find).toHaveBeenCalledTimes(threshold); // only from the setup calls
    });
  });
});
