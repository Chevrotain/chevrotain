import assert from "assert";
import { parseIni } from "./ini.js";

describe("The INI Grammar", () => {
  it("can parse a simple INI file without errors", () => {
    const input = [
      "; database configuration",
      "[database]",
      "host = localhost",
      "port = 3306",
      "name = my_app_db",
      "",
      "# server settings",
      "[server]",
      "address = 0.0.0.0",
      "port = 8080",
    ].join("\n");

    const result = parseIni(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse properties with empty values", () => {
    const input = ["[section]", "key ="].join("\n");

    const result = parseIni(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse a file with only comments", () => {
    const input = ["; this is a comment", "# this is also a comment"].join(
      "\n",
    );

    const result = parseIni(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse values with special characters", () => {
    const input = [
      "[paths]",
      "home = /usr/local/bin",
      "url = https://example.com:8080/path?q=1",
    ].join("\n");

    const result = parseIni(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });
});
