import { expect } from "chai";
import { tokenize } from "./python_indentation.js";

describe("The Chevrotain Lexer ability to lex python like indentation.", () => {
  it("Can Lex a simple python style if-else ", () => {
    let input =
      "if 1\n" +
      "  if 2\n" +
      "    if 3\n" +
      "      print 666\n" +
      "      print 777\n" +
      "  else\n" +
      "    print 999\n";

    let lexResult = tokenize(input);
    const actualTokenTypes = lexResult.tokens.map((tok) => tok.tokenType.name);

    expect(actualTokenTypes).to.eql([
      "If",
      "IntegerLiteral",
      "Indent",
      "If",
      "IntegerLiteral",
      "Indent",
      "If",
      "IntegerLiteral",
      "Indent",
      "Print",
      "IntegerLiteral",
      "Print",
      "IntegerLiteral",
      "Outdent",
      "Outdent",
      "Else",
      "Indent",
      "Print",
      "IntegerLiteral",
      "Outdent",
      "Outdent",
    ]);
  });

  it("Can Lex another simple python style if-else ", () => {
    const input =
      "if 1\n" +
      "  if 2\n" +
      "    if 3\n" +
      "else\n" +
      "  print 666666666666\n";

    const lexResult = tokenize(input);
    const actualTokenTypes = lexResult.tokens.map((tok) => tok.tokenType.name);
    expect(actualTokenTypes).to.eql([
      "If",
      "IntegerLiteral",
      "Indent",
      "If",
      "IntegerLiteral",
      "Indent",
      "If",
      "IntegerLiteral",
      "Outdent",
      "Outdent",
      "Else",
      "Indent",
      "Print",
      "IntegerLiteral",
      "Outdent",
    ]);
  });
});
