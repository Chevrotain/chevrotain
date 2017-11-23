{Token, Lexer, Parser} = require 'chevrotain'

class True 
  @PATTERN: /true/

class False 
  @PATTERN: /false/

class Null 
  @PATTERN: /null/

class LCurly 
  @PATTERN: /{/

class RCurly 
  @PATTERN: /}/

class LSquare 
  @PATTERN: /\[/

class RSquare 
  @PATTERN: /]/

class Comma 
  @PATTERN: /,/

class Colon 
  @PATTERN: /:/

class StringLiteral 
  @PATTERN: /"(:?[^\\"]|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/

class NumberLiteral 
  @PATTERN: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/

class WhiteSpace 
  @PATTERN = /\s+/
  @GROUP = Lexer.SKIPPED
  @LINE_BREAKS = true

allTokens = [WhiteSpace, NumberLiteral, StringLiteral, LCurly, RCurly, LSquare, RSquare, Comma, Colon, True, False, Null]
JsonLexer = new Lexer allTokens

class JsonParserCoffeeScript extends Parser
  constructor: (input = []) ->
    super input, allTokens

    @RULE 'json', ->
      @OR [
        {ALT: -> @SUBRULE @object}
        {ALT: -> @SUBRULE @array}
      ]

    @RULE 'object', ->
      @CONSUME LCurly
      @MANY_SEP {
        SEP: Comma, DEF: ->
          @SUBRULE2 @objectItem
      }
      @CONSUME RCurly

    @RULE 'objectItem', ->
      @CONSUME StringLiteral
      @CONSUME Colon
      @SUBRULE @value

    @RULE 'array', ->
      @CONSUME LSquare
      @MANY_SEP {
        SEP: Comma, DEF: ->
          @SUBRULE2 @value
      }
      @CONSUME RSquare

    @RULE 'value', ->
      @OR [
        {ALT: -> @CONSUME StringLiteral}
        {ALT: -> @CONSUME NumberLiteral}
        {ALT: -> @SUBRULE @object}
        {ALT: -> @SUBRULE @array}
        {ALT: -> @CONSUME True}
        {ALT: -> @CONSUME False}
        {ALT: -> @CONSUME Null}
      ]

    Parser.performSelfAnalysis(@)

parser = new JsonParserCoffeeScript

module.exports = (text) ->
  lexResult = JsonLexer.tokenize text
  # setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens
  # any top level rule may be used as an entry point
  value = parser.json()

  value: value
  lexErrors: lexResult.errors
  parseErrors: parser.errors
