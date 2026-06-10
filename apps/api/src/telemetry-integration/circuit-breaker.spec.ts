import { CircuitBreaker, CircuitState } from './circuit-breaker';

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 10_000;

function makeBreaker(onStateChange?: jest.Mock) {
  return new CircuitBreaker({
    failureThreshold: FAILURE_THRESHOLD,
    cooldownMs: COOLDOWN_MS,
    onStateChange,
  });
}

const success = () => Promise.resolve('ok');
const failure = () => Promise.reject(new Error('boom'));

describe('CircuitBreaker', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  // ---------------------------------------------------------------------------
  // CLOSED state
  // ---------------------------------------------------------------------------

  describe('CLOSED state', () => {
    it('starts in CLOSED state', () => {
      expect(makeBreaker().currentState).toBe(CircuitState.CLOSED);
    });

    it('returns the fn result when closed', async () => {
      const result = await makeBreaker().execute(success);
      expect(result).toBe('ok');
    });

    it('stays CLOSED after failures below the threshold', async () => {
      const cb = makeBreaker();
      for (let i = 0; i < FAILURE_THRESHOLD - 1; i++) {
        await cb.execute(failure);
      }
      expect(cb.currentState).toBe(CircuitState.CLOSED);
      expect(cb.failureCount).toBe(FAILURE_THRESHOLD - 1);
    });

    it('resets failure count to zero on success', async () => {
      const cb = makeBreaker();
      await cb.execute(failure);
      await cb.execute(failure);
      await cb.execute(success);
      expect(cb.failureCount).toBe(0);
      expect(cb.currentState).toBe(CircuitState.CLOSED);
    });

    it('opens after exactly N consecutive failures', async () => {
      const cb = makeBreaker();
      for (let i = 0; i < FAILURE_THRESHOLD; i++) {
        await cb.execute(failure);
      }
      expect(cb.currentState).toBe(CircuitState.OPEN);
    });

    it('returns null (not throwing) when fn fails', async () => {
      const result = await makeBreaker().execute(failure);
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // OPEN state
  // ---------------------------------------------------------------------------

  describe('OPEN state', () => {
    async function openBreaker(cb: CircuitBreaker) {
      for (let i = 0; i < FAILURE_THRESHOLD; i++) await cb.execute(failure);
    }

    it('returns null immediately without calling fn', async () => {
      const cb = makeBreaker();
      await openBreaker(cb);

      const fn = jest.fn().mockResolvedValue('should-not-be-called');
      const result = await cb.execute(fn);

      expect(result).toBeNull();
      expect(fn).not.toHaveBeenCalled();
    });

    it('stays OPEN before cooldown elapses', async () => {
      const cb = makeBreaker();
      await openBreaker(cb);

      jest.advanceTimersByTime(COOLDOWN_MS - 1);
      await cb.execute(success);

      expect(cb.currentState).toBe(CircuitState.OPEN);
    });

    it('transitions to HALF_OPEN after cooldown elapses', async () => {
      const cb = makeBreaker();
      await openBreaker(cb);

      jest.advanceTimersByTime(COOLDOWN_MS);
      // The transition happens when the next call arrives
      const fn = jest.fn().mockResolvedValue('probe');
      await cb.execute(fn);

      // fn was called (probe went through) and circuit is now CLOSED
      expect(fn).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // HALF_OPEN state
  // ---------------------------------------------------------------------------

  describe('HALF_OPEN state', () => {
    async function openAndCoolBreaker(cb: CircuitBreaker) {
      for (let i = 0; i < FAILURE_THRESHOLD; i++) await cb.execute(failure);
      jest.advanceTimersByTime(COOLDOWN_MS);
    }

    it('closes the circuit on a successful probe', async () => {
      const cb = makeBreaker();
      await openAndCoolBreaker(cb);

      await cb.execute(success);

      expect(cb.currentState).toBe(CircuitState.CLOSED);
      expect(cb.failureCount).toBe(0);
    });

    it('reopens the circuit on a failed probe', async () => {
      const cb = makeBreaker();
      await openAndCoolBreaker(cb);

      await cb.execute(failure);

      expect(cb.currentState).toBe(CircuitState.OPEN);
    });

    it('resets the cooldown timer when the probe fails', async () => {
      const cb = makeBreaker();
      await openAndCoolBreaker(cb);

      await cb.execute(failure); // probe fails → re-OPEN

      // Advance less than full cooldown — should still be OPEN and fast-fail
      jest.advanceTimersByTime(COOLDOWN_MS - 1);
      const fn = jest.fn().mockResolvedValue('too-soon');
      await cb.execute(fn);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onStateChange callback
  // ---------------------------------------------------------------------------

  describe('onStateChange callback', () => {
    it('fires CLOSED → OPEN on threshold breach', async () => {
      const onChange = jest.fn();
      const cb = makeBreaker(onChange);

      for (let i = 0; i < FAILURE_THRESHOLD; i++) await cb.execute(failure);

      expect(onChange).toHaveBeenCalledWith(CircuitState.CLOSED, CircuitState.OPEN);
    });

    it('fires OPEN → HALF_OPEN after cooldown', async () => {
      const onChange = jest.fn();
      const cb = makeBreaker(onChange);

      for (let i = 0; i < FAILURE_THRESHOLD; i++) await cb.execute(failure);
      jest.advanceTimersByTime(COOLDOWN_MS);
      await cb.execute(success);

      expect(onChange).toHaveBeenCalledWith(CircuitState.OPEN, CircuitState.HALF_OPEN);
    });

    it('fires HALF_OPEN → CLOSED on successful probe', async () => {
      const onChange = jest.fn();
      const cb = makeBreaker(onChange);

      for (let i = 0; i < FAILURE_THRESHOLD; i++) await cb.execute(failure);
      jest.advanceTimersByTime(COOLDOWN_MS);
      await cb.execute(success);

      expect(onChange).toHaveBeenCalledWith(CircuitState.HALF_OPEN, CircuitState.CLOSED);
    });

    it('fires HALF_OPEN → OPEN on failed probe', async () => {
      const onChange = jest.fn();
      const cb = makeBreaker(onChange);

      for (let i = 0; i < FAILURE_THRESHOLD; i++) await cb.execute(failure);
      jest.advanceTimersByTime(COOLDOWN_MS);
      await cb.execute(failure);

      expect(onChange).toHaveBeenCalledWith(CircuitState.HALF_OPEN, CircuitState.OPEN);
    });

    it('does not fire when staying CLOSED on success', async () => {
      const onChange = jest.fn();
      const cb = makeBreaker(onChange);

      await cb.execute(success);
      await cb.execute(success);

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
