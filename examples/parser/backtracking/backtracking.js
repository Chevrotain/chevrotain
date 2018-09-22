// DOCS: simple language with two statements which require backtracking to differentiate at parse time
//       element A:ns1.ns2...nsN = 5;
//       element B:ns1.ns2...nsN default 5;
// generally one should avoid having to use backtracking, and this specific example can be resolved without backtracking
// by factoring out the common prefix, but for the sake of the example let us assume backtracking is required...

const { createToken, Lexer, Parser } = require("chevrotain")

const Number = createToken({ name: "Number", pattern: /\d+/ })
const Element = createToken({ name: "Element", pattern: /element/ })
const Default = createToken({ name: "Default", pattern: /default/ })
const Dot = createToken({ name: "Dot", pattern: /\./ })
const Colon = createToken({ name: "Colon", pattern: /:/ })
const Equals = createToken({ name: "Equals", pattern: /=/ })
const SemiColon = createToken({ name: "SemiColon", pattern: /;/ })
const Ident = createToken({ name: "Ident", pattern: /[a-z]+/ })
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED
})

const allTokens = [
    WhiteSpace,
    Number,
    Element,
    Default,
    Dot,
    Colon,
    Equals,
    SemiColon,
    Ident
]

const backtrackingLexer = new Lexer(allTokens)

class BackTrackingParser extends Parser {
    constructor(input = []) {
        super(
            input,
            allTokens,
            // We have to tell Chevrotain to ignore the ambiguity in the statement rule
            // As Chevrotain is unable to "understand" we are using a GATE to resolve the ambiguity (at design time).
            {
                ignoredIssues: {
                    statement: { OR: true }
                }
            }
        )

        const $ = this

        this.RULE("statement", () => {
            $.OR([
                // both statements have the same prefix which may be of "infinite" length, this means there is no K for which
                // we can build an LL(K) parser that can distinguish the two alternatives.
                {
                    GATE: $.BACKTRACK($.withEqualsStatement),
                    ALT: () => {
                        $.SUBRULE($.withEqualsStatement)
                    }
                },
                {
                    GATE: $.BACKTRACK($.withDefaultStatement),
                    ALT: () => {
                        $.SUBRULE($.withDefaultStatement)
                    }
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

        // DOCS: The call to performSelfAnalysis must happen after all the RULEs have been defined.
        this.performSelfAnalysis()
    }
}

// reuse the same parser instance.
const parser = new BackTrackingParser([])

module.exports = function(text) {
    const lexResult = backtrackingLexer.tokenize(text)

    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens

    // any top level rule may be used as an entry point
    const cst = parser.statement()

    return {
        cst: cst,
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
