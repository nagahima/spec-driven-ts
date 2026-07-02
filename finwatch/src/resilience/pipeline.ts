/**
 * ADR-0007: 共通resilienceパイプライン。
 * cache(TTL内なら即返却) → retry → circuit breaker → fn の順に適用し、
 * 失敗時(429・breaker open・リトライ枯渇)はstaleキャッシュへグレースフルデグラデーション。
 * silent stalenessの禁止: staleで返す場合はmeta.stale=trueを必ず立てる。
 */
import type { CacheKey, ResiliencePolicy, ToolResult } from "../types.js";
import { CircuitBreaker } from "./circuit-breaker.js";
import { retry, type RetryOptions } from "./retry.js";
import { SqliteCache, type CacheEntry } from "./cache.js";

export interface ResiliencePipelineOptions {
  cache: SqliteCache;
  breaker?: CircuitBreaker;
  retryOptions?: RetryOptions;
  /** テスト注入用クロック(epoch ms) */
  now?: () => number;
}

export class ResiliencePipeline implements ResiliencePolicy {
  readonly #cache: SqliteCache;
  readonly #breaker: CircuitBreaker;
  readonly #retryOptions: RetryOptions;
  readonly #now: () => number;

  constructor(options: ResiliencePipelineOptions) {
    this.#cache = options.cache;
    this.#breaker = options.breaker ?? new CircuitBreaker();
    this.#retryOptions = options.retryOptions ?? {};
    this.#now = options.now ?? Date.now;
  }

  async execute<T>(
    key: CacheKey,
    fn: () => Promise<T>,
  ): Promise<{ value: T; meta: ToolResult["meta"] }> {
    const entry = this.#cache.get(key.tool, key.argsHash);
    if (entry !== undefined && this.#ageSeconds(entry) <= key.ttlSeconds) {
      return { value: entry.value as T, meta: this.#cacheMeta(entry, false) };
    }
    try {
      const value = await retry(() => this.#breaker.execute(fn), this.#retryOptions);
      this.#cache.set(key.tool, key.argsHash, value);
      return {
        value,
        meta: { fetchedAt: new Date(this.#now()).toISOString(), fromCache: false, stale: false },
      };
    } catch (error) {
      // ADR-0007: 429はTTL無視でキャッシュ優先。その他の障害もstaleキャッシュがあれば
      // 「古いが明示された情報 > 情報なし」でデグラデーション。なければfail-visibleで再throw
      if (entry !== undefined) {
        return { value: entry.value as T, meta: this.#cacheMeta(entry, true) };
      }
      throw error;
    }
  }

  #ageSeconds(entry: CacheEntry): number {
    return (this.#now() - entry.fetchedAtMs) / 1000;
  }

  #cacheMeta(entry: CacheEntry, stale: boolean): ToolResult["meta"] {
    return { fetchedAt: new Date(entry.fetchedAtMs).toISOString(), fromCache: true, stale };
  }
}
