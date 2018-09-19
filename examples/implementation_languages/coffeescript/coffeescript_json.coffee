{Token, Lexer, Parser, createToken} = require 'chevrotain'

True = createToken {name: 'True', pattern: /true/}
False = createToken {name: 'False', pattern: /false/}
Null = createToken {name: 'Null', pattern: /null/}
LCurly = createToken {name: 'LCurly', pattern: /{/}
RCurly = createToken {name: 'RCurly', pattern: /}/}
LSquare = createToken {name: 'LSquare', pattern: /\[/}
RSquare = createToken {name: 'RSquare', pattern: /]/}
Comma = createToken {name: 'Comma', pattern: /,/}
Colon = createToken {name: 'Colon', pattern: /:/}
StringLiteral = createToken {name: 'StringLiteral', pattern: /"(:?[^\\"]|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/}
NumberLiteral = createToken {name: 'NumberLiteral', pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/}
WhiteSpace = createToken {name: 'WhiteSpace', pattern: /[ \t\n\r]+/, group: Lexer.SKIPPED}

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

    @.performSelfAnalysis()

# Only init the parser once.
parser = new JsonParserCoffeeScript

module.exports = (text) ->
  lexResult = JsonLexer.tokenize text
  # setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens
  # any top level rule may be used as an entry point
  cst = parser.json()

  cst: cst
  lexErrors: lexResult.errors
  parseErrors: parser.errors
