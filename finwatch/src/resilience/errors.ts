/**
 * resilience層のエラー型。ドメイン(MCP/LLM)を知らない(CLAUDE.md ディレクトリ責務)。
 */

/** 外部APIのレート制限(429)。ADR-0007: 検知時はリトライせずキャッシュ優先に切り替える */
export class RateLimitError extends Error {
  override readonly name = "RateLimitError";
  constructor(message = "Rate limited (429)") {
    super(message);
  }
}

/** サーキットブレーカーがopenで呼び出しを遮断した */
export class CircuitOpenError extends Error {
  override readonly name = "CircuitOpenError";
  constructor(message = "Circuit breaker is open") {
    super(message);
  }
}
