var chevrotain = require("chevrotain");
var extendToken = chevrotain.extendToken;
var Lexer = chevrotain.Lexer;

// numbers Tokens
var One = extendToken("One", /1/);
var Two = extendToken("Two", /2/);
var Three = extendToken("Three", /3/);

// Letter Tokens
var Alpha = extendToken("Alpha", /A/);
var Beta = extendToken("Beta", /B/);
var Gamma = extendToken("Gamma", /G/);

// signs Tokens
var Hash = extendToken("Hash", /#/);
var Caret = extendToken("Caret", /\^/);
var Amp = extendToken("Amp", /&/);


// Tokens which control entering a new mode.
var EnterNumbers = extendToken("EnterNumbers", /NUMBERS/);
EnterNumbers.PUSH_MODE = "numbers_mode";

var EnterLetters = extendToken("EnterLetters", /LETTERS/);
EnterLetters.PUSH_MODE = "Letter_mode";

var EnterSigns = extendToken("EnterSigns", /SIGNS/);
EnterSigns.PUSH_MODE = "signs_mode";


// Tokens which control exiting modes
var ExitNumbers = extendToken("ExitNumbers", /EXIT_NUMBERS/);
ExitNumbers.POP_MODE = true;

var ExitLetter = extendToken("ExitLetter", /EXIT_LETTERS/);
ExitLetter.POP_MODE = true;

var ExitSigns = extendToken("ExitSigns", /EXIT_SIGNS/);
ExitSigns.POP_MODE = true;


var Whitespace = extendToken("Whitespace", /(\t| )/);
Whitespace.GROUP = Lexer.SKIPPED;

// Each key defines a Lexer mode's name.
// And each value is an array of Tokens which are valid in this Lexer mode.
var multiModeLexerDefinition = {

    modes: {
        "numbers_mode": [
            One,
            Two,
            Three,
            ExitNumbers, // encountering an ExitNumbers Token will cause the lexer to revert to the previous mode
            EnterLetters, // switch to "Letter_mode" after encountering "ENTER_Letter" while in "numbers_mode"
            Whitespace
        ],
        "Letter_mode":  [
            Alpha,
            Beta,
            Gamma,
            ExitLetter, // encountering an ExitNumbers Token will cause the lexer to revert to the previous mode
            EnterSigns,  // switch to "signs_mode" after encountering "ENTER_SIGNS" while in "numbers_mode"
            Whitespace
        ],
        "signs_mode":   [
            Hash,
            Caret,
            Amp,
            ExitSigns, // encountering an ExitSigns Token will cause the lexer to revert to the previous mode
            EnterNumbers, // switch to "numbers_mode" after encountering "ENTER_NUMBERS" while in "signs_mode"
            Whitespace
        ]
    },

    defaultMode: "numbers_mode"
};

// Our new lexer now support 3 different modes
// To mode switching logic works by using a mode stack and pushing and popping modes.
// using the PUSH_MODE and POP_MODE static properties defined on the Token classes
var MultiModeLexer = new Lexer(multiModeLexerDefinition);


module.exports = MultiModeLexer;
