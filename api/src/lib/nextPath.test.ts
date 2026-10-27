import { describe, expect, it } from "vitest";
import { safeNextPath } from "./nextPath";

const SITE = "https://urconnections.example";

describe("safeNextPath", () => {
  it.each([
    ["/create", "/create"],
    ["/groups/abc?x=1#top", "/groups/abc?x=1#top"],
    ["/a/../profile", "/profile"], // normalised like the browser would
  ])("keeps a path on this site: %s", (input, expected) => {
    expect(safeNextPath(input, SITE)).toBe(expected);
  });

  it.each([
    ["another site", "https://evil.example/"],
    ["a protocol-relative URL", "//evil.example"],
    ["a backslash (read as / by browsers)", "/\\evil.example"],
    ["a tab inside (removed by browsers)", "/\t/evil.example"],
    ["javascript:", "javascript:alert(1)"],
    ["a relative path", "create"],
    ["home (the default anyway)", "/"],
    ["something that isn't text", ["/create"]],
    ["a very long value", `/${"x".repeat(500)}`],
  ])("refuses %s", (_name, input) => {
    expect(safeNextPath(input, SITE)).toBeUndefined();
  });
});
