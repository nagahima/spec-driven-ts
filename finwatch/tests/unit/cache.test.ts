import { afterEach, describe, expect, it } from "vitest";
import { SqliteCache, canonicalArgsHash } from "../../src/resilience/cache.js";

describe("canonicalArgsHash", () => {
  it("キーの順序に依存しない", () => {
    expect(canonicalArgsHash({ a: 1, b: "x" })).toBe(canonicalArgsHash({ b: "x", a: 1 }));
  });

  it("ネストしたオブジェクトも正規化される", () => {
    expect(canonicalArgsHash({ q: { year: 2026, code: "5932" }, list: [1, 2] })).toBe(
      canonicalArgsHash({ list: [1, 2], q: { code: "5932", year: 2026 } }),
    );
  });

  it("値が異なればハッシュも異なる", () => {
    expect(canonicalArgsHash({ code: "5932" })).not.toBe(canonicalArgsHash({ code: "5938" }));
  });

  it("配列の順序は意味を持つ(正規化しない)", () => {
    expect(canonicalArgsHash({ list: [1, 2] })).not.toBe(canonicalArgsHash({ list: [2, 1] }));
  });

  it("undefined値のキーは無視される", () => {
    expect(canonicalArgsHash({ code: "5932", opt: undefined })).toBe(
      canonicalArgsHash({ code: "5932" }),
    );
  });
});

describe("SqliteCache", () => {
  let cache: SqliteCache | undefined;
  afterEach(() => cache?.close());

  it("set/getのラウンドトリップ", () => {
    let t = 1_000;
    cache = new SqliteCache(":memory:", () => t);
    cache.set("get_financials", "hash1", { revenue: 123 });
    expect(cache.get("get_financials", "hash1")).toEqual({
      value: { revenue: 123 },
      fetchedAtMs: 1_000,
    });
    t = 2_000; // getは時刻に依存しない(TTL判定は呼び出し側)
    expect(cache.get("get_financials", "hash1")?.fetchedAtMs).toBe(1_000);
  });

  it("存在しないキーはundefined", () => {
    cache = new SqliteCache();
    expect(cache.get("get_financials", "nope")).toBeUndefined();
  });

  it("同一キーへのsetは上書きされfetchedAtが更新される", () => {
    let t = 1_000;
    cache = new SqliteCache(":memory:", () => t);
    cache.set("t", "h", "old");
    t = 5_000;
    cache.set("t", "h", "new");
    expect(cache.get("t", "h")).toEqual({ value: "new", fetchedAtMs: 5_000 });
  });

  it("toolが異なれば別エントリ", () => {
    cache = new SqliteCache();
    cache.set("tool_a", "h", 1);
    cache.set("tool_b", "h", 2);
    expect(cache.get("tool_a", "h")?.value).toBe(1);
    expect(cache.get("tool_b", "h")?.value).toBe(2);
  });
});
