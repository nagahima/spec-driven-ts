import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  assertToolAllowed,
  isToolAllowed,
  parseAllowlist,
} from "../../src/mcp/allowlist.js";

const allowlist = parseAllowlist({
  edinetdb: ["search_companies", "get_financials"],
});

describe("allowlist判定 (ADR-0006: fail-closed)", () => {
  it("allowlistにあるツールは許可される", () => {
    expect(isToolAllowed(allowlist, "edinetdb", "get_financials")).toBe(true);
    expect(() => {
      assertToolAllowed(allowlist, "edinetdb", "search_companies");
    }).not.toThrow();
  });

  it("allowlist外のツールは拒否されAuthorizationErrorをthrowする", () => {
    expect(isToolAllowed(allowlist, "edinetdb", "delete_company")).toBe(false);
    expect(() => {
      assertToolAllowed(allowlist, "edinetdb", "delete_company");
    }).toThrow(AuthorizationError);
  });

  it("未知のサーバーはfail-closedで拒否される", () => {
    expect(isToolAllowed(allowlist, "unknown-server", "get_financials")).toBe(false);
    expect(() => {
      assertToolAllowed(allowlist, "unknown-server", "get_financials");
    }).toThrow(AuthorizationError);
  });

  it("ツール名の部分一致では許可されない", () => {
    expect(isToolAllowed(allowlist, "edinetdb", "get_financials_v2")).toBe(false);
    expect(isToolAllowed(allowlist, "edinetdb", "get")).toBe(false);
  });
});

describe("parseAllowlist", () => {
  it("$comment等の$始まりキーは無視される", () => {
    const parsed = parseAllowlist({ $comment: "note", edinetdb: ["get_company"] });
    expect(Object.keys(parsed)).toEqual(["edinetdb"]);
  });

  it("不正な形状はエラーになる", () => {
    expect(() => parseAllowlist(null)).toThrow();
    expect(() => parseAllowlist(["a"])).toThrow();
    expect(() => parseAllowlist({ edinetdb: "not-an-array" })).toThrow();
    expect(() => parseAllowlist({ edinetdb: [123] })).toThrow();
  });

  it("実際のconfig/tool-allowlist.jsonがパースできる", () => {
    const raw: unknown = JSON.parse(
      readFileSync(new URL("../../config/tool-allowlist.json", import.meta.url), "utf8"),
    );
    const parsed = parseAllowlist(raw);
    expect(isToolAllowed(parsed, "edinetdb", "get_financials")).toBe(true);
    expect(isToolAllowed(parsed, "edinetdb", "$comment")).toBe(false);
  });
});
