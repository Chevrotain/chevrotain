var assert = require("assert");
var groupsLexer = require("./token_groups");

describe('The Chevrotain Lexer ability to group the Tokens according to their groups', function () {

    it('will output the comments into a separate ouput object and will ignore whitespaces', function () {
        var text =
            'if (666) // some comment!\n' +
            '   return 333\n' +
            '// some other comment!\n' +
            'else \n' +
            '   return 667\n';

        var lexResult = groupsLexer.tokenize(text);

        assert.equal(lexResult.errors.length, 0);
        assert.equal(lexResult.tokens.length, 9);

        lexResult.tokens.forEach(function (lexedToken) {
            // the whitespace has been completely skipped/ignored
            assert.notEqual(lexedToken instanceof groupsLexer.Whitespace, true);
        });

        var commentsGroup = lexResult.groups.singleLineComments;
        assert.equal(commentsGroup.length, 2);
        assert.equal(commentsGroup[0] instanceof groupsLexer.Comment, true);
        assert.equal(commentsGroup[0].image, '// some comment!');
        assert.equal(commentsGroup[1] instanceof groupsLexer.Comment, true);
        assert.equal(commentsGroup[1].image, '// some other comment!');


    });

});
