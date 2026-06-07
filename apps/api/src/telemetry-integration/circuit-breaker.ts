export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit */
  failureThreshold: number;
  /** Milliseconds to wait in OPEN state before transitioning to HALF_OPEN */
  cooldownMs: number;
  /** Optional callback fired on every state transition */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

/**
 * State machine implementing the Circuit Breaker pattern.
 *
 * States:
 *   CLOSED   — normal operation; calls pass through to the protected resource
 *   OPEN     — fast-fail; calls return null immediately without hitting the resource
 *   HALF_OPEN — probe state; one call is allowed through to test recovery
 *
 * Transitions:
 *   CLOSED   → OPEN      after `failureThreshold` consecutive failures
 *   OPEN     → HALF_OPEN after `cooldownMs` has elapsed since the circuit opened
 *   HALF_OPEN → CLOSED   on a successful probe call
 *   HALF_OPEN → OPEN     on a failed probe call (resets the cooldown timer)
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures = 0;
  private openedAt: number | null = null;

  constructor(private readonly opts: CircuitBreakerOptions) {}

  get currentState(): CircuitState {
    return this.state;
  }

  get failureCount(): number {
    return this.consecutiveFailures;
  }

  /**
   * Execute `fn` through the circuit breaker.
   * Returns the result of `fn` when CLOSED or on a successful HALF_OPEN probe.
   * Returns null when OPEN (fast-fail) or when `fn` throws.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T | null> {
    if (this.state === CircuitState.OPEN) {
      if (this.cooldownElapsed()) {
        this.transition(CircuitState.HALF_OPEN);
      } else {
        return null;
      }
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch {
      this.recordFailure();
      return null;
    }
  }

  private cooldownElapsed(): boolean {
    return this.openedAt !== null && Date.now() - this.openedAt >= this.opts.cooldownMs;
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = null;
    if (this.state !== CircuitState.CLOSED) {
      this.transition(CircuitState.CLOSED);
    }
  }

  private recordFailure(): void {
    this.consecutiveFailures++;
    const shouldOpen =
      this.state === CircuitState.HALF_OPEN ||
      this.consecutiveFailures >= this.opts.failureThreshold;

    if (shouldOpen) {
      this.openedAt = Date.now();
      this.transition(CircuitState.OPEN);
    }
  }

  private transition(next: CircuitState): void {
    const prev = this.state;
    this.state = next;
    this.opts.onStateChange?.(prev, next);
  }
}
