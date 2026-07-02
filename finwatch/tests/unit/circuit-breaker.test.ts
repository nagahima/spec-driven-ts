import { describe, expect, it, vi } from "vitest";
import { CircuitBreaker } from "../../src/resilience/circuit-breaker.js";
import { CircuitOpenError } from "../../src/resilience/errors.js";

/** 注入可能な擬似クロック */
function fakeClock(): { now: () => number; advance: (ms: number) => void } {
  let t = 0;
  return { now: () => t, advance: (ms) => (t += ms) };
}

const failing = () => Promise.reject(new Error("upstream failure"));
const succeeding = () => Promise.resolve("ok");

async function failTimes(breaker: CircuitBreaker, times: number): Promise<void> {
  for (let i = 0; i < times; i++) {
    await expect(breaker.execute(failing)).rejects.toThrow("upstream failure");
  }
}

describe("CircuitBreaker (ADR-0007: 5連続失敗でopen、60s half-open)", () => {
  it("初期状態はclosedで、成功をそのまま返す", async () => {
    const breaker = new CircuitBreaker({ now: fakeClock().now });
    expect(breaker.state).toBe("closed");
    await expect(breaker.execute(succeeding)).resolves.toBe("ok");
    expect(breaker.state).toBe("closed");
  });

  it("閾値未満の失敗ではclosedのまま", async () => {
    const breaker = new CircuitBreaker({ now: fakeClock().now });
    await failTimes(breaker, 4);
    expect(breaker.state).toBe("closed");
  });

  it("途中の成功で連続失敗カウントがリセットされる", async () => {
    const breaker = new CircuitBreaker({ now: fakeClock().now });
    await failTimes(breaker, 4);
    await breaker.execute(succeeding);
    await failTimes(breaker, 4);
    expect(breaker.state).toBe("closed");
  });

  it("5連続失敗でopenになり、以降は関数を呼ばずCircuitOpenError", async () => {
    const breaker = new CircuitBreaker({ now: fakeClock().now });
    await failTimes(breaker, 5);
    expect(breaker.state).toBe("open");

    const fn = vi.fn(succeeding);
    await expect(breaker.execute(fn)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(fn).not.toHaveBeenCalled();
  });

  it("60s経過でhalf-openになり、試行成功でclosedに戻る", async () => {
    const clock = fakeClock();
    const breaker = new CircuitBreaker({ now: clock.now });
    await failTimes(breaker, 5);

    clock.advance(59_999);
    expect(breaker.state).toBe("open");
    clock.advance(1);
    expect(breaker.state).toBe("half-open");

    await expect(breaker.execute(succeeding)).resolves.toBe("ok");
    expect(breaker.state).toBe("closed");
  });

  it("half-openでの試行失敗で再びopenになる(タイマー再スタート)", async () => {
    const clock = fakeClock();
    const breaker = new CircuitBreaker({ now: clock.now });
    await failTimes(breaker, 5);
    clock.advance(60_000);
    expect(breaker.state).toBe("half-open");

    await expect(breaker.execute(failing)).rejects.toThrow("upstream failure");
    expect(breaker.state).toBe("open");

    clock.advance(59_999);
    expect(breaker.state).toBe("open");
    clock.advance(1);
    expect(breaker.state).toBe("half-open");
  });

  it("half-openで同時に許可する試行は1つだけ", async () => {
    const clock = fakeClock();
    const breaker = new CircuitBreaker({ now: clock.now });
    await failTimes(breaker, 5);
    clock.advance(60_000);

    let release!: () => void;
    const blocked = new Promise<string>((resolve) => {
      release = () => {
        resolve("ok");
      };
    });
    const trial = breaker.execute(() => blocked);
    await expect(breaker.execute(succeeding)).rejects.toBeInstanceOf(CircuitOpenError);
    release();
    await expect(trial).resolves.toBe("ok");
    expect(breaker.state).toBe("closed");
  });

  it("閾値はオプションで変更できる", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, now: fakeClock().now });
    await failTimes(breaker, 2);
    expect(breaker.state).toBe("open");
  });
});
