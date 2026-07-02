/**
 * ADR-0007: retry(exponential backoff + jitter, max 3)。
 * full jitter方式: delay = random() * min(maxDelayMs, baseDelayMs * 2^(attempt-1))
 */
import { CircuitOpenError, RateLimitError } from "./errors.js";

export interface RetryOptions {
  /** 総試行回数(初回を含む)。デフォルト3(ADR-0007) */
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** falseを返したエラーは即座に再throwされる */
  isRetryable?: (error: unknown) => boolean;
  /** テスト注入用: 0..1の乱数 */
  random?: () => number;
  /** テスト注入用: スリープ */
  sleep?: (ms: number) => Promise<void>;
}

/**
 * デフォルトのリトライ可否。
 * - 429(RateLimitError)はリトライしない: 100req/日のクォータを浪費せずキャッシュ優先へ(ADR-0007)
 * - CircuitOpenErrorはリトライしない: openの間は即failさせるのがブレーカーの目的
 */
export function defaultIsRetryable(error: unknown): boolean {
  return !(error instanceof RateLimitError) && !(error instanceof CircuitOpenError);
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 10_000;
  const isRetryable = options.isRetryable ?? defaultIsRetryable;
  const random = options.random ?? Math.random;
  const sleep = options.sleep ?? defaultSleep;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryable(error)) throw error;
      const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      await sleep(random() * cap);
    }
  }
}
