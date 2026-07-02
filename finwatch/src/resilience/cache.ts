/**
 * ADR-0007: SQLiteキャッシュ。キーは (tool, canonical_args_hash)。
 * 鮮度(TTL)の判定はエントリを使う側(pipeline)の責務 — staleフォールバックのために
 * 期限切れエントリも保持し、getは常に返す。
 */
import { createHash } from "node:crypto";
import Database from "better-sqlite3";

/** 引数オブジェクトをキー順序に依存しない正規形にしてsha256を取る */
export function canonicalArgsHash(args: Record<string, unknown>): string {
  return createHash("sha256").update(canonicalStringify(args)).digest("hex");
}

function canonicalStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalStringify(v)}`);
  return `{${entries.join(",")}}`;
}

export interface CacheEntry {
  /** JSON round-trip済みの値 */
  value: unknown;
  /** 取得時刻(epoch ms)。鮮度SLIの源泉 */
  fetchedAtMs: number;
}

interface Row {
  value: string;
  fetched_at: number;
}

export class SqliteCache {
  readonly #db: Database.Database;
  readonly #now: () => number;

  constructor(path = ":memory:", now: () => number = Date.now) {
    this.#db = new Database(path);
    this.#now = now;
    this.#db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        tool       TEXT    NOT NULL,
        args_hash  TEXT    NOT NULL,
        value      TEXT    NOT NULL,
        fetched_at INTEGER NOT NULL,
        PRIMARY KEY (tool, args_hash)
      )
    `);
  }

  get(tool: string, argsHash: string): CacheEntry | undefined {
    const row = this.#db
      .prepare<[string, string], Row>(
        "SELECT value, fetched_at FROM cache WHERE tool = ? AND args_hash = ?",
      )
      .get(tool, argsHash);
    if (row === undefined) return undefined;
    return { value: JSON.parse(row.value), fetchedAtMs: row.fetched_at };
  }

  set(tool: string, argsHash: string, value: unknown): void {
    this.#db
      .prepare(
        `INSERT INTO cache (tool, args_hash, value, fetched_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (tool, args_hash) DO UPDATE SET value = excluded.value, fetched_at = excluded.fetched_at`,
      )
      .run(tool, argsHash, JSON.stringify(value), this.#now());
  }

  close(): void {
    this.#db.close();
  }
}
