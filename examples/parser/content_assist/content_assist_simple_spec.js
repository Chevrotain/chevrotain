import { expect } from "chai";
import { B, C, getContentAssistSuggestions } from "./content_assist_simple.js";

describe("The Official Content Assist Feature example Example", () => {
  context("can perform content assist for inputs:", () => {
    it('Text: "A "', () => {
      const inputText = "A";
      const suggestions = getContentAssistSuggestions(inputText);
      expect(suggestions).to.have.members([B, C]);
    });
  });
});
