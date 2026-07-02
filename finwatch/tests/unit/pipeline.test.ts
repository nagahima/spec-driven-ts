import { afterEach, describe, expect, it, vi } from "vitest";
import { CircuitBreaker } from "../../src/resilience/circuit-breaker.js";
import { RateLimitError } from "../../src/resilience/errors.js";
import { ResiliencePipeline } from "../../src/resilience/pipeline.js";
import { SqliteCache } from "../../src/resilience/cache.js";
import type { CacheKey } from "../../src/types.js";

const KEY: CacheKey = { tool: "get_financials", argsHash: "abc", ttlSeconds: 86_400 };

function setup(): {
  cache: SqliteCache;
  pipeline: ResiliencePipeline;
  breaker: CircuitBreaker;
  advance: (ms: number) => void;
} {
  let t = 0;
  const now = (): number => t;
  const cache = new SqliteCache(":memory:", now);
  const breaker = new CircuitBreaker({ now });
  const pipeline = new ResiliencePipeline({
    cache,
    breaker,
    now,
    retryOptions: { sleep: () => Promise.resolve(), random: () => 0 },
  });
  return { cache, pipeline, breaker, advance: (ms) => (t += ms) };
}

let teardown: (() => void) | undefined;
afterEach(() => teardown?.());

describe("ResiliencePipeline (ADR-0007)", () => {
  it("キャッシュミス時はfnを呼び、結果をキャッシュしてfromCache=falseで返す", async () => {
    const { cache, pipeline } = setup();
    teardown = () => {
      cache.close();
    };
    const fn = vi.fn().mockResolvedValue({ revenue: 100 });

    const result = await pipeline.execute(KEY, fn);
    expect(result.value).toEqual({ revenue: 100 });
    expect(result.meta).toEqual({
      fetchedAt: new Date(0).toISOString(),
      fromCache: false,
      stale: false,
    });
    expect(cache.get(KEY.tool, KEY.argsHash)?.value).toEqual({ revenue: 100 });
  });

  it("TTL内のキャッシュヒットではfnを呼ばない", async () => {
    const { cache, pipeline, advance } = setup();
    teardown = () => {
      cache.close();
    };
    await pipeline.execute(KEY, () => Promise.resolve("fresh"));

    advance(KEY.ttlSeconds * 1000); // ちょうどTTL境界(age <= ttl は fresh)
    const fn = vi.fn();
    const result = await pipeline.execute(KEY, fn);
    expect(fn).not.toHaveBeenCalled();
    expect(result.value).toBe("fresh");
    expect(result.meta.fromCache).toBe(true);
    expect(result.meta.stale).toBe(false);
  });

  it("TTL切れならfnを呼び直してキャッシュを更新する", async () => {
    const { cache, pipeline, advance } = setup();
    teardown = () => {
      cache.close();
    };
    await pipeline.execute(KEY, () => Promise.resolve("old"));

    advance(KEY.ttlSeconds * 1000 + 1);
    const result = await pipeline.execute(KEY, () => Promise.resolve("new"));
    expect(result.value).toBe("new");
    expect(result.meta.fromCache).toBe(false);
  });

  it("429検知時はTTL無視でキャッシュ優先に切り替える(リトライもしない)", async () => {
    const { cache, pipeline, advance } = setup();
    teardown = () => {
      cache.close();
    };
    await pipeline.execute(KEY, () => Promise.resolve({ revenue: 100 }));

    advance(KEY.ttlSeconds * 1000 * 3); // TTLを大きく超過
    const fn = vi.fn().mockRejectedValue(new RateLimitError());
    const result = await pipeline.execute(KEY, fn);

    expect(fn).toHaveBeenCalledTimes(1); // 429はリトライでクォータを浪費しない
    expect(result.value).toEqual({ revenue: 100 });
    expect(result.meta.fromCache).toBe(true);
    expect(result.meta.stale).toBe(true); // silent staleness禁止
    expect(result.meta.fetchedAt).toBe(new Date(0).toISOString()); // 鮮度は元の取得時刻
  });

  it("429でキャッシュが無ければfail-visibleで再throwする", async () => {
    const { cache, pipeline } = setup();
    teardown = () => {
      cache.close();
    };
    const fn = vi.fn().mockRejectedValue(new RateLimitError());
    await expect(pipeline.execute(KEY, fn)).rejects.toBeInstanceOf(RateLimitError);
  });

  it("一般障害はリトライし、枯渇したらstaleキャッシュでデグラデーションする", async () => {
    const { cache, pipeline, advance } = setup();
    teardown = () => {
      cache.close();
    };
    await pipeline.execute(KEY, () => Promise.resolve("cached"));

    advance(KEY.ttlSeconds * 1000 + 1);
    const fn = vi.fn().mockRejectedValue(new Error("503"));
    const result = await pipeline.execute(KEY, fn);
    expect(fn).toHaveBeenCalledTimes(3); // max 3試行
    expect(result.value).toBe("cached");
    expect(result.meta.stale).toBe(true);
  });

  it("breaker openの間はfnを呼ばずstaleキャッシュで返す", async () => {
    const { cache, pipeline, breaker, advance } = setup();
    teardown = () => {
      cache.close();
    };
    await pipeline.execute(KEY, () => Promise.resolve("cached"));
    advance(KEY.ttlSeconds * 1000 + 1);

    // 5連続失敗でbreakerをopenにする(リトライ3回 + 2回)
    const failing = vi.fn().mockRejectedValue(new Error("503"));
    await pipeline.execute(KEY, failing); // 3失敗 → stale返却
    await pipeline.execute(KEY, failing); // 2失敗でopen → stale返却
    expect(breaker.state).toBe("open");
    expect(failing).toHaveBeenCalledTimes(5);

    const fn = vi.fn();
    const result = await pipeline.execute(KEY, fn);
    expect(fn).not.toHaveBeenCalled(); // openなので上流に到達しない
    expect(result.value).toBe("cached");
    expect(result.meta.stale).toBe(true);
  });

  it("キャッシュも無く障害なら最後のエラーを再throwする", async () => {
    const { cache, pipeline } = setup();
    teardown = () => {
      cache.close();
    };
    await expect(pipeline.execute(KEY, () => Promise.reject(new Error("503")))).rejects.toThrow(
      "503",
    );
  });
});
