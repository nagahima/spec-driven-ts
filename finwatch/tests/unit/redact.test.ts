import { describe, expect, it } from "vitest";
import { redact } from "../../src/mcp/redact.js";

describe("redact (ADR-0005)", () => {
  it("EDINET DB APIキー(edb_)をマスクする", () => {
    expect(redact("Authorization: Bearer edb_AbC123-xyz_9")).toBe(
      "Authorization: Bearer edb_[REDACTED]",
    );
  });

  it("Anthropic APIキー(sk-ant-)をマスクする", () => {
    expect(redact("key=sk-ant-api03-FooBar_123")).toBe("key=sk-ant-[REDACTED]");
  });

  it("複数の秘匿情報を全てマスクする", () => {
    const input = "edb_aaa used with sk-ant-bbb and edb_ccc";
    expect(redact(input)).toBe("edb_[REDACTED] used with sk-ant-[REDACTED] and edb_[REDACTED]");
  });

  it("秘匿情報を含まないテキストはそのまま", () => {
    const input = "三協立山(5932)の売上高は堅調。debug=true";
    expect(redact(input)).toBe(input);
  });

  it("JSONログに埋め込まれたキーもマスクされる", () => {
    const log = JSON.stringify({ header: "Bearer edb_secret123", tool: "get_financials" });
    expect(redact(log)).toContain("edb_[REDACTED]");
    expect(redact(log)).not.toContain("secret123");
  });
});
