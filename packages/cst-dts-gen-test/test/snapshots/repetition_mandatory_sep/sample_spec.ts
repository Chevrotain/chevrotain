import { executeSampleTest, testNameFromDir } from "../../sample_test.js"
import { parser } from "./input.js"
describe(`${testNameFromDir(__dirname)}`, () => {
  executeSampleTest(__dirname, parser)
})
