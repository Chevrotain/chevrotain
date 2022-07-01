import { executeSampleTest, testNameFromDir } from "../../sample_test"
import { parser } from "./input"
describe(`${testNameFromDir(__dirname)}`, () => {
  executeSampleTest(__dirname, parser)
})
