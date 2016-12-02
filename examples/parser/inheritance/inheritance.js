/*
 * Example Of using Grammar complex grammar inheritance to implement
 * 'Structured natural language' supporting multiple 'spoken languages' using grammar inheritance.
 *
 * 1. An "Abstract" Base Grammar with two concrete grammars extending it.
 * 2. Each concrete grammar has a different lexer
 * 3. This also shows an example of using Token inheritance
 */

var chevrotain = require("chevrotain");

// ----------------- lexer -----------------
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
var extendToken = chevrotain.extendToken;

var RelationWord = extendToken("RelationWord", Lexer.NA);

// Token inheritance CONSUME(RelationWord) will work on any Token extending RelationWord
var And = extendToken("And", /and/, RelationWord);
var Before = extendToken("Before", /before/, RelationWord);
var After = extendToken("After", /after/, RelationWord);
var Und = extendToken("Und", /und/, RelationWord);
var Vor = extendToken("Vor", /vor/, RelationWord);
var Nach = extendToken("Nach", /nach/, RelationWord);

/// English Tokens
var Cook = extendToken("Cook", /cooking|cook/);
var Some = extendToken("Some", /some/);
var Sausages = extendToken("Sausages", /sausages/);
var Clean = extendToken("Clean", /clean/);
var The = extendToken("The", /the/);
var Room = extendToken("Room", /room/);

// German Tokens
var Kochen = extendToken("Kochen", /kochen/);
var Wurstchen = extendToken("Wurstchen", /wurstchen/);
var Wurst = extendToken("Wurst", /wurst/);
var Raum = extendToken("Raum", /raum/);
var Auf = extendToken("Auf", /auf/);
var Den = extendToken("Den", /den/);


var WhiteSpace = extendToken("WhiteSpace", /\s+/);
WhiteSpace.GROUP = Lexer.SKIPPED;

var englishTokens = [WhiteSpace, RelationWord, And, Before, After, Cook,
    Some, Sausages, Clean, The, Room];

var germanTokens = [WhiteSpace, RelationWord, Und, Vor, Nach, Kochen,
    Wurstchen, Wurst, Raum, Auf, Den];

// We can define a different Lexer for each of the sub grammars.
var EnglishLexer = new Lexer(englishTokens);
var GermanLexer = new Lexer(germanTokens);


// ----------------- parser -----------------
function AbstractCommandsParser(input, tokens) {

    Parser.call(this, input, tokens);
    var $ = this;


    $.RULE("commands", function() {
        $.SUBRULE($.command);

        $.MANY(function() {
            $.CONSUME(RelationWord);
            $.SUBRULE2($.command);
        })
    });

    $.RULE("command", function() {
        // The cook and clean commands must be implemented in each sub grammar
        $.OR([
            // @formatter:off
            {ALT: function() {$.SUBRULE($.cookCommand)}},
            {ALT: function() {$.SUBRULE($.cleanCommand)}}
            // @formatter:on
        ]);
    });

    // this is an "abstract" base grammar it should not be instantiated directly
    // therefor it does not invoke "performSelfAnalysis"
}

// MyBaseParser extends the base chevrotain Parser.
AbstractCommandsParser.prototype = Object.create(Parser.prototype);
AbstractCommandsParser.prototype.constructor = AbstractCommandsParser;


function EnglishCommandsParser(input) {
    AbstractCommandsParser.call(this, input, englishTokens);
    var $ = this;

    // implementing the 'cookCommand' referenced in the AbstractCommandsParser
    $.RULE("cookCommand", function() {
        $.CONSUME(Cook);
        $.OPTION(function() {
            $.CONSUME(Some);
        })
        $.CONSUME(Sausages);

    });

    // implementing the 'cleanCommand' referenced in the AbstractCommandsParser
    $.RULE("cleanCommand", function() {
        $.CONSUME(Clean);
        $.CONSUME(The);
        $.CONSUME(Room);
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this);
}

// EnglishCommandsParser extends AbstractCommandsParser
EnglishCommandsParser.prototype = Object.create(AbstractCommandsParser.prototype);
EnglishCommandsParser.prototype.constructor = EnglishCommandsParser;


function GermanCommandsParser(input) {
    AbstractCommandsParser.call(this, input, germanTokens);
    var $ = this;

    // implementing the 'cookCommand' referenced in the AbstractCommandsParser
    $.RULE("cookCommand", function() {
        $.CONSUME(Kochen);
        $.OR([
            // @formatter:off
            {ALT: function() {$.CONSUME(Wurstchen)}},
            {ALT: function() {$.CONSUME(Wurst)}}
            // @formatter:on
        ]);
    });

    // implementing the 'cleanCommand' referenced in the AbstractCommandsParser
    $.RULE("cleanCommand", function() {
        $.CONSUME(Raum);
        $.CONSUME(Den);
        $.CONSUME2(Raum);
        $.CONSUME(Auf);
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this);
}

// GermanCommandsParser extends AbstractCommandsParser
GermanCommandsParser.prototype = Object.create(AbstractCommandsParser.prototype);
GermanCommandsParser.prototype.constructor = GermanCommandsParser;

// ----------------- wrapping it all together -----------------

// reuse the same parser instances.
var englishParser = new EnglishCommandsParser([]);
var germanParser = new GermanCommandsParser([]);

module.exports = function(text, language) {

    // lex
    var lexer;
    // match language and lexer.
    switch (language) {
        case "english":
            lexer = EnglishLexer;
            break;
        case "german":
            lexer = GermanLexer;
            break;
        default:
            throw Error("no valid language chosen")
    }

    var lexResult = lexer.tokenize(text);

    // parse
    var parser;
    // match language and parser.
    switch (language) {
        case "english":
            parser = englishParser;
            break;
        case "german":
            parser = germanParser;
            break;
        default:
            throw Error("no valid language chosen");
    }

    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens;
    // any top level rule may be used as an entry point
    var value = parser.commands();

    return {
        value:       value, // this is a pure grammar, the value will always be <undefined>
        lexErrors:   lexResult.errors,
        parseErrors: parser.errors
    };
};
