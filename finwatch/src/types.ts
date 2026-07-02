/**
 * 境界インターフェース定義。Claude Codeはこの契約に対して実装する。
 * 設計根拠: docs/adr/ 参照。変更はADR更新が先(CLAUDE.md 絶対原則1)。
 */

/** ADR-0005: agent層が見てよいMCPの姿。認証の概念が存在しないことが仕様 */
export interface ToolGateway {
  /** allowlist通過済みツールの一覧(LLMに提示する定義) */
  listAllowedTools(): Promise<ToolDefinition[]>;
  /** ADR-0006: allowlist外はAuthorizationErrorをthrow(fail-closed)。実行は resilience パイプライン経由 */
  callTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolResult {
  /** zodパース・正規化済み。生レスポンスは保持しない(threat-model I) */
  data: unknown;
  meta: {
    fetchedAt: string;      // ISO8601。鮮度SLIの源泉
    fromCache: boolean;
    stale: boolean;         // TTL超過キャッシュをデグラデーションで返した場合true
  };
}

/** ADR-0007 */
export interface ResiliencePolicy {
  execute<T>(key: CacheKey, fn: () => Promise<T>): Promise<{ value: T; meta: ToolResult["meta"] }>;
}
export interface CacheKey { tool: string; argsHash: string; ttlSeconds: number; }

/** ADR-0010: 予算超過はBudgetExceededErrorで打ち切り、部分結果を返す(fail-visible) */
export interface BudgetTracker {
  recordUsage(inputTokens: number, outputTokens: number, toolCalls: number): void;
  assertWithinBudget(): void;
}

/** report層への入力。数値はLLMを経由しない(architecture/c4.md 数値の経路分離) */
export interface CompanySnapshot {
  name: string;
  secCode: string;
  financials: ToolResult;         // 機械転記の源泉
  narrative: string;              // LLM生成はここだけ
  completeness: number;           // 0..1、完全性SLI
}
