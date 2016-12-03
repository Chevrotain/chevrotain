{Token, Lexer, Parser} = require 'chevrotain'

class True extends Token
  @PATTERN: /true/

class False extends Token
  @PATTERN: /false/

class Null extends Token
  @PATTERN: /null/

class LCurly extends Token
  @PATTERN: /{/

class RCurly extends Token
  @PATTERN: /}/

class LSquare extends Token
  @PATTERN: /\[/

class RSquare extends Token
  @PATTERN: /]/

class Comma extends Token
  @PATTERN: /,/

class Colon extends Token
  @PATTERN: /:/

class StringLiteral extends Token
  @PATTERN: /"(:?[^\\"]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/

class NumberLiteral extends Token
  @PATTERN: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/

class WhiteSpace extends Token
  @PATTERN = /\s+/
  @GROUP = Lexer.SKIPPED

allTokens = [WhiteSpace, NumberLiteral, StringLiteral, LCurly, RCurly, LSquare, RSquare, Comma, Colon, True, False, Null]
JsonLexer = new Lexer allTokens

class JsonParserCoffeeScript extends Parser
  constructor: (input) ->
    super input, allTokens

    @RULE "json", =>
      @.OR [
        {ALT: => @.SUBRULE @.object}
        {ALT: => @.SUBRULE @.array}
      ]

    @RULE "object", =>
      @.CONSUME LCurly
      @.MANY_SEP Comma, =>
        @.SUBRULE2 @.objectItem
      @.CONSUME RCurly

    @RULE "objectItem", =>
      @.CONSUME StringLiteral
      @.CONSUME Colon
      @.SUBRULE @.value

    @RULE "array", =>
      @.CONSUME LSquare
      @.MANY_SEP Comma, =>
        @.SUBRULE @.value
      @.CONSUME RSquare

    @RULE "value", =>
      @.OR [
        {ALT: => @.CONSUME StringLiteral}
        {ALT: => @.CONSUME NumberLiteral}
        {ALT: => @.SUBRULE @.object}
        {ALT: => @.SUBRULE @.array}
        {ALT: => @.CONSUME True}
        {ALT: => @.CONSUME False}
        {ALT: => @.CONSUME Null}
      ]

    Parser.performSelfAnalysis(@)

parser = new JsonParserCoffeeScript([])

module.exports = (text) ->
  lexResult = JsonLexer.tokenize text
  # setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens
  # any top level rule may be used as an entry point
  value = parser.json()

  value: value
  lexErrors: lexResult.errors
  parseErrors: parser.errors
