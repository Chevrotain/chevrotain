import { expect } from "chai"
import { getContentAssistSuggestions } from "./content_assist_complex.js"

describe("The Official Content Assist Feature example Example", () => {
  const symbolTable = ["foo", "bar", "average"]

  context(
    "can perform content assist for simple statements parser (K > 1) for inputs:",
    () => {
      it('Text: "public "', () => {
        const inputText = "public "
        const suggestions = getContentAssistSuggestions(inputText, symbolTable)
        expect(suggestions)
          .to.have.members(["static", "enum", "function"])
          .and.to.have.lengthOf(3)
      })

      it('Text: "public static"', () => {
        const inputText = "public static "
        const suggestions = getContentAssistSuggestions(inputText, symbolTable)
        expect(suggestions)
          .to.have.members(["function"])
          .and.to.have.lengthOf(1)
      })

      it("empty text", () => {
        const inputText = "   "
        const suggestions = getContentAssistSuggestions(inputText, symbolTable)
        expect(suggestions)
          .to.have.members([
            "private",
            "public",
            "static",
            "call",
            "function",
            "enum"
          ])
          .and.to.have.lengthOf(6)
      })

      it('Text: "call "', () => {
        const inputText = "call "
        const suggestions = getContentAssistSuggestions(inputText, symbolTable)
        expect(suggestions)
          .to.have.members(["foo", "bar", "average"])
          .and.to.have.lengthOf(3)
      })

      it('Text: "call aver"', () => {
        const inputText = "call aver"
        const suggestions = getContentAssistSuggestions(inputText, symbolTable)
        expect(suggestions).to.have.members(["average"]).and.to.have.lengthOf(1)
      })

      it('Text: "private enu"', () => {
        const inputText = "private enu"
        const suggestions = getContentAssistSuggestions(inputText, symbolTable)
        expect(suggestions).to.have.members(["enum"]).and.to.have.lengthOf(1)
      })

      it('Text: "private enum "', () => {
        // no suggestion for declaration identifier
        const inputText = "private enum "
        const suggestions = getContentAssistSuggestions(inputText, symbolTable)
        expect(suggestions).to.have.members([]).and.to.have.lengthOf(0)
      })

      it('Text: "private enum MONTHS\n' + '      static "', () => {
        const inputText = "private enum MONTHS\n" + "static "
        const suggestions = getContentAssistSuggestions(inputText, symbolTable)
        expect(suggestions)
          .to.have.members(["function"])
          .and.to.have.lengthOf(1)
      })
    }
  )
})
