import { describe, expect, it, vi } from "vitest";
import { retry, defaultIsRetryable } from "../../src/resilience/retry.js";
import { CircuitOpenError, RateLimitError } from "../../src/resilience/errors.js";

/** sleepを記録だけして即解決するテストダブル */
function recordingSleep(): { delays: number[]; sleep: (ms: number) => Promise<void> } {
  const delays: number[] = [];
  return {
    delays,
    sleep: (ms) => {
      delays.push(ms);
      return Promise.resolve();
    },
  };
}

describe("retry", () => {
  it("初回成功ならスリープせず値を返す", async () => {
    const { delays, sleep } = recordingSleep();
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(retry(fn, { sleep })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(delays).toEqual([]);
  });

  it("一時的な失敗をリトライして成功する(max 3)", async () => {
    const { sleep } = recordingSleep();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("500"))
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue("ok");
    await expect(retry(fn, { sleep })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("maxAttempts超過で最後のエラーをthrowする", async () => {
    const { delays, sleep } = recordingSleep();
    const fn = vi.fn().mockRejectedValue(new Error("persistent"));
    await expect(retry(fn, { sleep })).rejects.toThrow("persistent");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(delays).toHaveLength(2); // 最終試行後はスリープしない
  });

  it("exponential backoff + full jitter: random()=1で500ms, 1000ms", async () => {
    const { delays, sleep } = recordingSleep();
    const fn = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(retry(fn, { sleep, random: () => 1 })).rejects.toThrow();
    expect(delays).toEqual([500, 1000]);
  });

  it("jitterはrandom()に比例する(full jitter)", async () => {
    const { delays, sleep } = recordingSleep();
    const fn = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(retry(fn, { sleep, random: () => 0.5 })).rejects.toThrow();
    expect(delays).toEqual([250, 500]);
  });

  it("maxDelayMsでバックオフ上限を打ち切る", async () => {
    const { delays, sleep } = recordingSleep();
    const fn = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(
      retry(fn, { sleep, random: () => 1, maxAttempts: 5, maxDelayMs: 800 }),
    ).rejects.toThrow();
    expect(delays).toEqual([500, 800, 800, 800]);
  });

  it("429(RateLimitError)はデフォルトでリトライしない(ADR-0007: キャッシュ優先へ)", async () => {
    const fn = vi.fn().mockRejectedValue(new RateLimitError());
    await expect(retry(fn)).rejects.toBeInstanceOf(RateLimitError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("CircuitOpenErrorはデフォルトでリトライしない", async () => {
    const fn = vi.fn().mockRejectedValue(new CircuitOpenError());
    await expect(retry(fn)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("カスタムisRetryableが優先される", async () => {
    const { sleep } = recordingSleep();
    const fn = vi.fn().mockRejectedValue(new Error("fatal"));
    await expect(retry(fn, { sleep, isRetryable: () => false })).rejects.toThrow("fatal");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("defaultIsRetryableは一般エラーをリトライ対象とする", () => {
    expect(defaultIsRetryable(new Error("500"))).toBe(true);
    expect(defaultIsRetryable(new RateLimitError())).toBe(false);
    expect(defaultIsRetryable(new CircuitOpenError())).toBe(false);
  });
});
