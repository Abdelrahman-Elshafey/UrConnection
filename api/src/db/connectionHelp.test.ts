import { describe, expect, it } from "vitest";
import { explainDatabaseError } from "./connectionHelp";

// vitest.config.ts sets DATABASE_URL=postgres://test:test@localhost:5432/test
const pgError = (code: string) => Object.assign(new Error("pg"), { code });

describe("explainDatabaseError", () => {
  it("explains a refused connection, also when wrapped in an AggregateError", () => {
    const err = new AggregateError([pgError("ECONNREFUSED"), pgError("ECONNREFUSED")], "");
    expect(explainDatabaseError(err)).toContain("npm run db:up");
  });

  it("finds the code in an error's cause", () => {
    expect(explainDatabaseError(new Error("wrapped", { cause: pgError("ECONNREFUSED") }))).toContain("Docker");
  });

  it.each([
    ["28P01", "username or password"],
    ["3D000", "doesn't exist"],
    ["42P01", "npm run db:migrate"],
    ["ENOTFOUND", "can't be found"],
  ])("explains %s", (code, expected) => {
    expect(explainDatabaseError(pgError(code))).toContain(expected);
  });

  it("never prints the password from DATABASE_URL", () => {
    const message = explainDatabaseError(pgError("28P01"))!;
    expect(message).toContain("localhost:5432/test");
    expect(message).not.toContain("test:test");
  });

  it("returns null for other errors, so real bugs keep their stack trace", () => {
    expect(explainDatabaseError(new TypeError("x is undefined"))).toBeNull();
    expect(explainDatabaseError(pgError("23505"))).toBeNull(); // unique violation: a real bug
  });
});
