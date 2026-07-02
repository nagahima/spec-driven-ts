/**
 * ADR-0007: サーキットブレーカー。5連続失敗でopen、60s経過でhalf-open。
 * half-openでの試行が成功すればclosed、失敗すれば再びopen。
 */
import { CircuitOpenError } from "./errors.js";

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  /** openに遷移する連続失敗回数。デフォルト5(ADR-0007) */
  failureThreshold?: number;
  /** openからhalf-openに遷移するまでの時間。デフォルト60s(ADR-0007) */
  openDurationMs?: number;
  /** テスト注入用クロック(epoch ms) */
  now?: () => number;
}

export class CircuitBreaker {
  readonly #failureThreshold: number;
  readonly #openDurationMs: number;
  readonly #now: () => number;

  #consecutiveFailures = 0;
  #openedAt: number | undefined;
  #halfOpenTrialInFlight = false;

  constructor(options: CircuitBreakerOptions = {}) {
    this.#failureThreshold = options.failureThreshold ?? 5;
    this.#openDurationMs = options.openDurationMs ?? 60_000;
    this.#now = options.now ?? Date.now;
  }

  get state(): CircuitState {
    if (this.#openedAt === undefined) return "closed";
    return this.#now() - this.#openedAt >= this.#openDurationMs ? "half-open" : "open";
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.state;
    if (state === "open") {
      throw new CircuitOpenError();
    }
    if (state === "half-open") {
      // half-openで許可する試行は同時に1つだけ
      if (this.#halfOpenTrialInFlight) throw new CircuitOpenError();
      this.#halfOpenTrialInFlight = true;
    }
    try {
      const result = await fn();
      this.#onSuccess();
      return result;
    } catch (error) {
      this.#onFailure(state);
      throw error;
    } finally {
      if (state === "half-open") this.#halfOpenTrialInFlight = false;
    }
  }

  #onSuccess(): void {
    this.#consecutiveFailures = 0;
    this.#openedAt = undefined;
  }

  #onFailure(stateAtCall: CircuitState): void {
    if (stateAtCall === "half-open") {
      this.#openedAt = this.#now();
      return;
    }
    this.#consecutiveFailures += 1;
    if (this.#consecutiveFailures >= this.#failureThreshold) {
      this.#openedAt = this.#now();
      this.#consecutiveFailures = 0;
    }
  }
}
