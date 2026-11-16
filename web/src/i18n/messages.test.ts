import { COUNTRY_LIST, VALIDATION_MESSAGES } from "@urconnections/shared";
import { describe, expect, it } from "vitest";
import { countryName } from "./countries";
import de from "./messages/de";
import { en, type Messages } from "./messages/en";
import fr from "./messages/fr";
import itMessages from "./messages/it";

/*
 * TypeScript already guarantees that every language has exactly the keys of en.ts. These
 * tests check what types can't see: the *contents* of the texts.
 */

/** { a: { b: "x" } } → { "a.b": "x" } */
function flatten(node: object, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string") out[prefix + key] = value;
    else Object.assign(out, flatten(value as object, `${prefix}${key}.`));
  }
  return out;
}

/** The {placeholders} of a text, sorted: "Hi {name}, {count}" → "count,name". */
const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1])
    .sort()
    .join(",");

const english = flatten(en);
const translations: Record<string, Messages> = { it: itMessages, de, fr };

describe.each(Object.entries(translations))("%s", (_name, messages) => {
  const texts = flatten(messages);

  it("has every English key and no other", () => {
    expect(Object.keys(texts).sort()).toEqual(Object.keys(english).sort());
  });

  it("has no empty texts", () => {
    expect(Object.entries(texts).filter(([, text]) => !text.trim())).toEqual([]);
  });

  // A translation that drops or renames {title} would show the raw "{title}" on the page.
  it("keeps the same {placeholders} as English", () => {
    const mismatches = Object.keys(english).filter((key) => placeholders(texts[key] ?? "") !== placeholders(english[key]!));
    expect(mismatches).toEqual([]);
  });

  it("has both forms of every plural pair", () => {
    const pairs = Object.keys(english).filter((key) => key.endsWith("_one"));
    for (const key of pairs) expect(texts[key.replace(/_one$/, "_other")]).toBeTruthy();
  });
});

describe("shared validation messages", () => {
  // The web finds a message's key by its English sentence, so two rules must never share one.
  it("are unique", () => {
    const sentences = Object.values(VALIDATION_MESSAGES);
    expect(new Set(sentences).size).toBe(sentences.length);
  });
});

describe("countryName", () => {
  it("keeps the stored English name in English", () => {
    expect(countryName("Germany", "en")).toBe("Germany");
  });

  it("translates every country we offer", () => {
    for (const country of COUNTRY_LIST) {
      expect(countryName(country, "de")).toBeTruthy();
    }
    expect(countryName("Germany", "de")).toBe("Deutschland");
    expect(countryName("Germany", "fr")).toBe("Allemagne");
    expect(countryName("Germany", "it")).toBe("Germania");
  });

  it("leaves unknown values alone", () => {
    expect(countryName("", "de")).toBe("");
    expect(countryName("Atlantis", "de")).toBe("Atlantis");
  });
});
