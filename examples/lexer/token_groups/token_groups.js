var chevrotain = require("chevrotain");
var extendToken = chevrotain.extendToken;
var Lexer = chevrotain.Lexer;

// using extendToken utility to create the Token constructors and hierarchy
var If = extendToken("if", /if/);
var Else = extendToken("else", /else/);
var Return = extendToken("return", /return/);
var LParen = extendToken("LParen", /\(/);
var RParen = extendToken("RParen", /\)/);
var IntegerLiteral = extendToken("IntegerLiteral", /\d+/);

var Whitespace = extendToken("Whitespace", /\s+/);
Whitespace.GROUP = Lexer.SKIPPED; // the Lexer.SKIPPED group is a special group that will cause the lexer to "ignore"
                                  // certain Tokens. these tokens are still consumed from the text, they just don't appear in the
                                  // lexer's output. the is especially useful for ignoring whitespace and in some use cases comments too.

var Comment = extendToken("Comment", /\/\/.+/);
Comment.GROUP = "singleLineComments"; // a Token's group may be a 'free' String, in that case the lexer's result will contain
                                      // an additional array of all the tokens matched for each group under the 'group' object
                                      // for example in this case: lexResult.groups["singleLineComments"]

TokenGroupsLexer = new Lexer(
    [
        Whitespace, // Whitespace is very common in most languages so placing it first generally speeds up the lexing.
        If,
        Else,
        Return,
        LParen,
        RParen,
        IntegerLiteral,
        Comment
    ]);

module.exports = {

    Comment:    Comment,
    Whitespace: Whitespace,

    tokenize: function(text) {
        var lexResult = TokenGroupsLexer.tokenize(text);

        if (lexResult.errors.length >= 1) {
            throw new Error("sad sad panda lexing errors detected")
        }
        return lexResult;
    }
};
