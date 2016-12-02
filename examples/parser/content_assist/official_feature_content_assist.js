/*
 * Example Of using Chevrotain's built in syntactic content assist
 * To implement semantic content assist and content assist on partial inputs.
 *
 * Examples:
 * "Public static " --> ["function"]
 * "Public sta" --> ["static"]
 * "call f" --> ["foo"] // assuming foo is in the symbol table.
 */
"use strict";

const _ = require("lodash")
const chevrotain = require('chevrotain');

const Lexer = chevrotain.Lexer;
const Parser = chevrotain.Parser;
const extendToken = chevrotain.extendToken;
const EMPTY_ALT = chevrotain.EMPTY_ALT
const getImage = chevrotain.getImage

const Keyword = extendToken('Keyword', Lexer.NA);

const Private = extendToken('Private', /private/, Keyword);
const Public = extendToken('Public', /public/, Keyword);
const Static = extendToken('Static', /static/, Keyword);
const Declare = extendToken('Declare', /declare/, Keyword);
const Call = extendToken('Call', /call/, Keyword);
const Enum = extendToken('Enum', /enum/, Keyword);
const Function = extendToken('Function', /function/, Keyword);
const Identifier = extendToken("Identifier", /\w+/);
const WhiteSpace = extendToken('WhiteSpace', /\s+/);
WhiteSpace.GROUP = Lexer.SKIPPED;

const allTokens = [WhiteSpace, Call, Private, Public, Static, Enum, Declare, Function, Identifier];
const StatementsLexer = new Lexer(allTokens);

// A completely normal Chevrotain Parser, no changes needed to use the content assist capabilities.
class StatementsParser extends Parser {
    constructor(input) {
        super(input, allTokens);

        let $ = this;

        $.RULE('startRule', () => {
            $.MANY(() => {
                $.SUBRULE($.stmt);
            });
        });

        $.RULE('stmt', () => {
            $.OR([
                {ALT: () => $.SUBRULE($.functionInvocation)},
                {ALT: () => $.SUBRULE($.functionStmt)},
                {ALT: () => $.SUBRULE($.enumStmt)}
            ]);
        });

        $.RULE('functionInvocation', () => {
            $.CONSUME(Call);
            $.CONSUME(Identifier);
        });

        // e.g: "private static function foo"
        $.RULE('functionStmt', () => {
            $.SUBRULE($.visibility);
            $.OPTION(() => {
                $.CONSUME(Static);
            });
            $.CONSUME(Function);
            $.CONSUME(Identifier);
        });

        // e.g "public enum MONTHS"
        $.RULE('enumStmt', () => {
            $.SUBRULE($.visibility);
            $.CONSUME(Enum);
            $.CONSUME(Identifier);
        });

        $.RULE('visibility', () => {
            $.OR([
                {ALT: () => $.CONSUME(Private)},
                {ALT: () => $.CONSUME(Public)},
                {ALT: EMPTY_ALT("EMPTY_ALT")}
            ]);
        });

        Parser.performSelfAnalysis(this);
    }
}

// No need for more than one instance.
const parserInstance = new StatementsParser([])


/**
 * @param text {string} - The text content assist is requested immediately afterwards.
 * @param symbolTable {string[]} - List of available symbol names.
 */
function getContentAssistSuggestions(text, symbolTable) {
    const lexResult = StatementsLexer.tokenize(text);
    if (lexResult.errors.length > 0) {
        throw new Error("sad sad panda, lexing errors detected");
    }

    const lastInputToken = _.last(lexResult.tokens)
    let partialSuggestionMode = false
    let assistanceTokenVector = lexResult.tokens

    // we have requested assistance while inside a Keyword or Identifier
    if ((lastInputToken instanceof Identifier || lastInputToken instanceof Keyword) &&
        /\w/.test(text[text.length - 1])) {
        assistanceTokenVector = _.dropRight(assistanceTokenVector)
        partialSuggestionMode = true
    }

    const syntacticSuggestions = parserInstance.computeContentAssist("startRule", assistanceTokenVector)

    let finalSuggestions = []

    for (let i = 0; i < syntacticSuggestions.length; i++) {
        const currSyntaxSuggestion = syntacticSuggestions[i]
        const currTokenType = currSyntaxSuggestion.nextTokenType
        const currRuleStack = currSyntaxSuggestion.ruleStack
        const lastRuleName = _.last(currRuleStack)

        // easy case where a keyword is suggested.
        if (Keyword.prototype.isPrototypeOf(currTokenType.prototype)) {
            finalSuggestions.push(currTokenType.PATTERN.source)
        }
        else if (currTokenType === Identifier) {
            // in declarations, should not provide content assist for new symbols (Identifiers)
            if (_.contains(["enumStmt", "functionStmt"], lastRuleName)) {
                // NO-OP
            }
            // Inside "functionInvocation" an Identifier is a usage of a symbol
            else if (lastRuleName === "functionInvocation") {
                // This is an overly simplified approach of adding all the symbols
                // in a real world example symbol scoping and probably more in depth logic will be required.
                // This scenario appears in this example to emphasize that Chevrotain only supplies Syntactic content assist
                // The Semantic content assist must be implemented by the Grammar's author.
                finalSuggestions = finalSuggestions.concat(symbolTable)
            }
            else {
                throw Error("non exhaustive match")
            }
        }
        else {
            throw Error("non exhaustive match")
        }
    }

    // throw away any suggestion that is not a suffix of the last partialToken.
    if (partialSuggestionMode) {
        finalSuggestions = _.filter(finalSuggestions, (currSuggestion) => {
            return _.startsWith(currSuggestion, getImage(lastInputToken))
        })
    }

    // we could have duplication because each suggestion also includes a Path, and the same Token may appear in multiple suggested paths.
    return _.uniq(finalSuggestions)
}

module.exports = {
    getContentAssistSuggestions: getContentAssistSuggestions
}
