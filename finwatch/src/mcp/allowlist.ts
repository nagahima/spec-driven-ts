/**
 * ADR-0006: ツール実行認可。config/tool-allowlist.json に列挙したread-onlyツールのみ
 * 実行可。allowlist外・未知サーバーは常に拒否(fail-closed)。
 */
import { z } from "zod";

const allowlistSchema = z.record(z.string(), z.array(z.string()));

/** serverId → 許可ツール名の配列 */
export type ToolAllowlist = z.infer<typeof allowlistSchema>;

/** ADR-0006: allowlist外の呼び出し要求。当該ターンを失敗させる */
export class AuthorizationError extends Error {
  override readonly name = "AuthorizationError";
}

/** config/tool-allowlist.json のパース。"$"始まりのキー($comment)は無視する */
export function parseAllowlist(raw: unknown): ToolAllowlist {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("tool-allowlist config must be a JSON object");
  }
  const entries = Object.entries(raw as Record<string, unknown>).filter(
    ([key]) => !key.startsWith("$"),
  );
  return allowlistSchema.parse(Object.fromEntries(entries));
}

export function isToolAllowed(
  allowlist: ToolAllowlist,
  serverId: string,
  toolName: string,
): boolean {
  return allowlist[serverId]?.includes(toolName) ?? false;
}

/** fail-closed: 許可されていなければAuthorizationErrorをthrow */
export function assertToolAllowed(
  allowlist: ToolAllowlist,
  serverId: string,
  toolName: string,
): void {
  if (!isToolAllowed(allowlist, serverId, toolName)) {
    throw new AuthorizationError(
      `Tool "${serverId}/${toolName}" is not in the allowlist (fail-closed, ADR-0006)`,
    );
  }
}
