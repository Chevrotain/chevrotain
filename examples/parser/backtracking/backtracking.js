// DOCS: simple language with two statements which require backtracking to differentiate during parse time
//       element A:ns1.ns2...nsN = 5;
//       element B:ns1.ns2...nsN default 5;
// generally one should avoid having to use backtracking, and this specific example can be resolved by parsing
// both statements in a single rule and only distinguishing between them later, but lets see an example of using backtracking :)

const {createToken, Lexer, Parser} = require("chevrotain")

const Number = createToken({name: "NumberTok", pattern: /\d+/})
const Element = createToken({name: "ElementTok", pattern: /element/})
const Default = createToken({name: "DefaultTok", pattern: /default/})
const Dot = createToken({name: "DotTok", pattern: /\./})
const Colon = createToken({name: "ColonTok", pattern: /:/})
const Equals = createToken({name: "EqualsTok", pattern: /=/})
const SemiColon = createToken({name: "SemiColonTok", pattern: /;/})
const Ident = createToken({name: "IdentTok", pattern: /[a-z]+/})
const WhiteSpace = createToken({
    name:        "WhiteSpace",
    pattern:     /\s+/,
    group:       Lexer.SKIPPED,
    line_breaks: true
})

const allTokens = [WhiteSpace, Number, Element, Default, Dot, Colon, Equals, SemiColon, Ident]

const backtrackingLexer = new Lexer(allTokens)

// extending the BaseErrorRecoveryRecognizer in this example because it too has logic related to backtracking
// that needs to be tested too.
class BackTrackingParser extends Parser {
    constructor(input = []) {
        // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
        //       it is mandatory to provide this map to be able to perform self analysis
        //       and allow the framework to "understand" the implemented grammar.
        super(
            input,
            allTokens,
            // We have to tell Chevrotain to ignore the ambiguity in the statement rule
            // As
            {
                ignoredIssues: {
                    statement: {OR1: true}
                }
            }
        )

        const $ = this

        this.RULE("statement", () => {
            $.OR([
                // both statements have the same prefix which may be of "infinite" length, this means there is no K for which
                // we can build an LL(K) parser that can distinguish the two alternatives as a negative example
                // would be to simply create a qualifiedName with a length of k+1.
                {
                    GATE: $.BACKTRACK($.withEqualsStatement),
                    ALT:  () => { $.SUBRULE($.withEqualsStatement)}
                },
                {
                    GATE: $.BACKTRACK($.withDefaultStatement),
                    ALT:  () => {$.SUBRULE($.withDefaultStatement)}
                }
            ])
        })

        this.RULE("withEqualsStatement", () => {
            this.CONSUME(Element)  
            this.CONSUME(Ident)  
            this.CONSUME(Colon)  
            // qualifiedName is of possibly infinite length so no fixed lookahead can be used to disambiguate.
            this.SUBRULE($.qualifiedName)
            // The "Equals" Token is the first token we can be used to distinguish between the two statement rules.
            this.CONSUME(Equals)  
            this.CONSUME(Number)  
            this.CONSUME(SemiColon)  
        })

        $.RULE("withDefaultStatement", () => {
            $.CONSUME(Element)
            $.CONSUME(Ident)
            $.CONSUME(Colon)
            // qualifiedName is of possibly infinite length so no fixed lookahead can be used to disambiguate.
            $.SUBRULE($.qualifiedName)
            // The "Default" Token is the first token we can be used to distinguish between the two statement rules.
            $.CONSUME(Default)
            $.CONSUME(Number)
            $.CONSUME(SemiColon)
        })

        $.RULE("qualifiedName", () => {
            $.CONSUME(Ident)
            $.MANY(() => {
                $.CONSUME(Dot)
                $.CONSUME2(Ident)
            })
        })
        
        // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined.
        Parser.performSelfAnalysis(this)
    }
}

// reuse the same parser instance.
var parser = new BackTrackingParser([])

module.exports = function(text) {
    var lexResult = backtrackingLexer.tokenize(text)

    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens

    // any top level rule may be used as an entry point
    var value = parser.statement()

    return {
        value: value, // this is a pure grammar, the value will always be <undefined>
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}

