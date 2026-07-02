/**
 * ADR-0005: ログは全てredact()を通し、秘匿情報パターンをマスクする。
 * redactは事後防御 — 一次防御は境界設計(認証はtransport内で完結)であることに注意。
 */

/** EDINET DB APIキー(edb_)・Anthropic APIキー(sk-ant-)のパターン(ADR-0005) */
const SECRET_PATTERN = /(edb_|sk-ant-)[\w-]*/g;

export function redact(text: string): string {
  return text.replace(SECRET_PATTERN, (_match, prefix: string) => `${prefix}[REDACTED]`);
}
