import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import assert from "assert";
import { parseCsv } from "./csv.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("The CSV Grammar", () => {
  const samplePath = path.resolve(__dirname, "./sample.csv");
  const sampleCsvText = fs.readFileSync(samplePath, "utf8").toString();

  it("can parse a simple CSV without errors", () => {
    const lexAndParseResult = parseCsv(sampleCsvText);

    assert.equal(lexAndParseResult.lexResult.errors.length, 0);
    assert.equal(lexAndParseResult.parseErrors.length, 0);
  });
});
