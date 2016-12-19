"use strict";
var chevrotain = require("chevrotain");
var XRegExp = require("xregexp")

// ----------------- lexer -----------------
var Token = chevrotain.Token;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;

// A little mini DSL for easier lexer definition using xRegExp.
var fragments = {}

function FRAGMENT(name, def) {
    fragments[name] = XRegExp.build(def, fragments)
}

function MAKE_PATTERN(def, flags) {
    return XRegExp.build(def, fragments, flags)
}

FRAGMENT('NameStartChar', '([a-zA-Z]|\\u2070-\\u218F|\\u2C00-\\u2FEF|\\u3001-\\uD7FF|\\uF900-\\uFDCF|\\uFDF0-\\uFFFD)');
FRAGMENT('NameChar', '{{NameStartChar}}|-|_|\\.|\\d|\\u00B7||[\\u0300-\\u036F]|[\\u203F-\\u2040]');
FRAGMENT('Name', '{{NameStartChar}}({{NameChar}})*');

// Unfortunately no support for static class properties in ES2015, only in ES2016...
// so the PATTERN/GROUP static props are defined outside the class declarations.
// see: https://github.com/jeffmo/es-class-fields-and-static-properties
class Comment extends Token {}
Comment.PATTERN = /<!--.*?-->/;

class CData extends Token {}
CData.PATTERN = /<!\[CDATA\[.*?]]>/;

class DTD extends Token {}
DTD.PATTERN = /<!.*?>/;
DTD.GROUP = Lexer.SKIPPED;

class EntityRef extends Token {}
EntityRef.PATTERN = MAKE_PATTERN('&{{Name}};');

class CharRef extends Token {}
CharRef.PATTERN = /&#\d+;|&#x[a-fA-F0-9]/;

class SEA_WS extends Token {}
SEA_WS.PATTERN = /( |\t|\n|\r\n)+/;

class XMLDeclOpen extends Token {}
XMLDeclOpen.PATTERN = /<\?xml[ \t\r\n]/;
XMLDeclOpen.PUSH_MODE = "INSIDE";

class SLASH_OPEN extends Token {}
SLASH_OPEN.PATTERN = /<\//;
SLASH_OPEN.PUSH_MODE = "INSIDE";

class OPEN extends Token {}
OPEN.PATTERN = /</;
OPEN.PUSH_MODE = "INSIDE";

class PROCESSING_INSTRUCTION extends Token {}
PROCESSING_INSTRUCTION.PATTERN = MAKE_PATTERN('<\\?{{Name}}.*\\?>');

class TEXT extends Token {}
TEXT.PATTERN = /[^<&]+/;

class CLOSE extends Token {}
CLOSE.PATTERN = />/;
CLOSE.POP_MODE = true;

class SPECIAL_CLOSE extends Token {}
SPECIAL_CLOSE.PATTERN = /\?>/;
SPECIAL_CLOSE.POP_MODE = true;

class SLASH_CLOSE extends Token {}
SLASH_CLOSE.PATTERN = /\/>/;
SLASH_CLOSE.POP_MODE = true;

class SLASH extends Token {}
SLASH.PATTERN = /\//;

class STRING extends Token {}
STRING.PATTERN = /"[^<"]*"|'[^<']*'/;

class EQUALS extends Token {}
EQUALS.PATTERN = /=/;

class Name extends Token {}
Name.PATTERN = MAKE_PATTERN('{{Name}}');

class S extends Token {}
S.PATTERN = /[ \t\r\n]/;
S.GROUP = Lexer.SKIPPED;

var XmlLexerDefinition = {

    defaultMode: "OUTSIDE",

    modes: {
        // the default (inital) mode is "numbers_mode"
        OUTSIDE: [
            Comment,
            CData,
            DTD,
            EntityRef,
            CharRef,
            SEA_WS,
            XMLDeclOpen,
            SLASH_OPEN,
            OPEN,
            PROCESSING_INSTRUCTION,
            TEXT
        ],
        INSIDE:  [
            CLOSE,
            SPECIAL_CLOSE,
            SLASH_CLOSE,
            SLASH,
            EQUALS,
            STRING,
            Name,
            S
        ]
    }
};

var XmlLexer = new Lexer(XmlLexerDefinition);
var allTokens = XmlLexerDefinition.modes.INSIDE.concat(XmlLexerDefinition.modes.OUTSIDE);


// ----------------- parser -----------------
class XmlParserES6 extends chevrotain.Parser {

    // Unfortunately no support for class fields with initializer in ES2015, only in ES2016...
    // so the parsing rules are defined inside the constructor, as each parsing rule must be initialized by
    // invoking RULE(...)
    // see: https://github.com/jeffmo/es-class-fields-and-static-properties
    constructor(input) {
        super(input, allTokens,
            // by default the error recovery / fault tolerance capabilities are disabled
            // use this flag to enable them
            {recoveryEnabled: true});

        // not mandatory, using $ (or any other sign) to reduce verbosity (this. this. this. this. .......)
        var $ = this;

        $.document = $.RULE("document", () => {
            $.OPTION(() => {
                $.SUBRULE($.prolog);
            });

            $.MANY(() => {
                $.SUBRULE($.misc);
            });

            $.SUBRULE($.element);

            $.MANY2(() => {
                $.SUBRULE2($.misc);
            });
        });

        $.prolog = $.RULE("prolog", () => {
            $.CONSUME(XMLDeclOpen);
            $.MANY2(() => {
                $.SUBRULE($.attribute);
            })
            $.CONSUME(SPECIAL_CLOSE);
        });

        $.content = $.RULE("content", () => {
            $.OPTION(() => {
                $.SUBRULE($.chardata);
            })

            $.MANY(() => {
                $.OR([
                    {ALT: () => { $.SUBRULE($.element)}},
                    {ALT: () => { $.SUBRULE($.reference)}},
                    {ALT: () => { $.CONSUME(CData)}},
                    {ALT: () => { $.CONSUME(PROCESSING_INSTRUCTION)}},
                    {ALT: () => { $.CONSUME(Comment)}}
                ]);

                $.OPTION2(() => {
                    $.SUBRULE2($.chardata);
                })
            });
        });

        $.element = $.RULE("element", () => {
            $.CONSUME(OPEN);
            $.CONSUME(Name);
            $.MANY(() => {
                $.SUBRULE($.attribute);
            })

            $.OR([
                {
                    ALT: () => {
                        $.CONSUME(CLOSE);
                        $.SUBRULE($.content);
                        $.CONSUME(SLASH_OPEN);
                        $.CONSUME2(Name);
                        $.CONSUME2(CLOSE);
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(SLASH_CLOSE);
                    }
                }
            ]);
        });

        $.reference = $.RULE("reference", () => {
            $.OR([
                {ALT: () => { $.CONSUME(EntityRef)}},
                {ALT: () => { $.CONSUME(CharRef)}}
            ]);
        });

        $.attribute = $.RULE("attribute", () => {
            $.CONSUME(Name);
            $.CONSUME(EQUALS);
            $.CONSUME(STRING);
        });

        $.chardata = $.RULE("chardata", () => {
            $.OR([
                {ALT: () => { $.CONSUME(TEXT)}},
                {ALT: () => { $.CONSUME(SEA_WS)}}
            ]);
        });

        $.misc = $.RULE("misc", () => {
            $.OR([
                {ALT: () => { $.CONSUME(Comment)}},
                {ALT: () => { $.CONSUME(PROCESSING_INSTRUCTION)}},
                {ALT: () => { $.CONSUME(SEA_WS)}}
            ]);
        });

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
var parser = new XmlParserES6([]);

module.exports = function(text) {
    var lexResult = XmlLexer.tokenize(text);
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens;
    // any top level rule may be used as an entry point
    var value = parser.document();

    return {
        value:       value, // this is a pure grammar, the value will always be <undefined>
        lexErrors:   lexResult.errors,
        parseErrors: parser.errors
    };
};