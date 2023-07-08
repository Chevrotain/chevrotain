import { executeSampleTest, testNameFromDir } from "../../sample_test.js";
import { parser } from "./input.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe(`${testNameFromDir(__dirname)}`, () => {
  executeSampleTest(__dirname, parser);
});
