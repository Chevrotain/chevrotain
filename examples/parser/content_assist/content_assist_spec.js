var expect = require("chai").expect;

describe('The Content Assist Parser Example using ES6 syntax', function() {

    var getContentAssist

    var symbolTable = {
        tableNames:  ['employees', 'managers', 'aliens', 'allies'],
        columnNames: ['name', 'age', 'tenure', 'salary']
    };

    context('works even on invalid inputs!', function() {
        it('missing <FROM> keyword', function() {
            // hack to avoid loading a module with ES6 syntax on node.js 0.12 (during integration builds)
            getContentAssist = require('./content_assist').getContentAssist;

            // content assist point:                                   ^
            var inputText = 'SELECT name, age, salary managers WHERE ag > 67'; // MISSING the <FROM> between salary and managers
            var suggestions = getContentAssist(inputText, 42, symbolTable);
            expect(suggestions).to.have.members(['age'])
                .and.to.have.lengthOf(1);
        });

        it('redundant Comma', function() {
            // content assist point:                    ^
            var inputText = 'SELECT name, age, FROM empl '; // redundant <comma> after age
            var suggestions = getContentAssist(inputText, 27, symbolTable);
            expect(suggestions).to.have.members(['employees'])
                .and.to.have.lengthOf(1);
        });

        it('missing <SELECT> keyword', function() {
            // content assist point:   ^
            var inputText = 'name, age  '; // missing the <SELECT> at the beginning of the statement
            var suggestions = getContentAssist(inputText, 10, symbolTable);
            expect(suggestions).to.have.members(['FROM'])
                .and.to.have.lengthOf(1);
        });
    })

    context('can perform content assist in <selectClause>', function() {

        it('after column names', function() {
            // content assist point:          ^
            var inputText = 'SELECT name, age  ';
            var suggestions = getContentAssist(inputText, 17, symbolTable);
            expect(suggestions).to.have.members(['FROM'])
                .and.to.have.lengthOf(1);

            // content assist point:                    ^
            var inputTextWithSuffix = 'SELECT name, age   aliens';
            expect(getContentAssist(inputTextWithSuffix, 17, symbolTable)).to.deep.equal(suggestions);
        });

        it('after column names with prefix', function() {
            // content assist point:       ^
            var inputText = 'SELECT name FR  ';
            var suggestions = getContentAssist(inputText, 13, symbolTable);
            expect(suggestions).to.have.members(['FROM'])
                .and.to.have.lengthOf(1);

            // content assist point:                 ^
            var inputTextWithSuffix = 'SELECT name FR  managers';
            expect(getContentAssist(inputTextWithSuffix, 13, symbolTable)).to.deep.equal(suggestions);
        });

        it('in column names', function() {
            // content assist point:      ^
            var inputText = 'SELECT name,  ';
            var suggestions = getContentAssist(inputText, 13, symbolTable);
            expect(suggestions).to.have.members(['name', 'age', 'tenure', 'salary'])
                .and.to.have.lengthOf(4);

            // content assist point:                ^
            var inputTextWithSuffix = 'SELECT name,   salary';
            expect(getContentAssist(inputTextWithSuffix, 13, symbolTable)).to.deep.equal(suggestions);
        });

        it('in column names with prefix', function() {
            // content assist point:         ^
            var inputText = 'SELECT name, sal ';
            var suggestions = getContentAssist(inputText, 16, symbolTable);
            expect(suggestions).to.have.members(['salary'])
                .and.to.have.lengthOf(1);

            // content assist point:                   ^
            var inputTextWithSuffix = 'SELECT name, sal FROM';
            expect(getContentAssist(inputTextWithSuffix, 16, symbolTable)).to.deep.equal(suggestions);
        });
    })

    context('can perform content assist in <fromClause>', function() {

        it('after table name', function() {
            // content assist point:                      ^
            var inputText = 'SELECT name, age FROM aliens  ';
            var suggestions = getContentAssist(inputText, 29, symbolTable);
            expect(suggestions).to.have.members(['WHERE'])
                .and.to.have.lengthOf(1);


            // content assist point:                                ^
            var inputTextWithSuffix = 'SELECT name, age FROM aliens   WHERE';
            expect(getContentAssist(inputTextWithSuffix, 29, symbolTable)).to.deep.equal(suggestions);
        });

        it('after table name with prefix', function() {
            // content assist point:                         ^
            var inputText = 'SELECT name, age FROM aliens WHE ';
            var suggestions = getContentAssist(inputText, 32, symbolTable);
            expect(suggestions).to.have.members(['WHERE'])
                .and.to.have.lengthOf(1);

            // content assist point:                                   ^
            var inputTextWithSuffix = 'SELECT name, age FROM aliens WHE  age > 99';
            expect(getContentAssist(inputTextWithSuffix, 32, symbolTable)).to.deep.equal(suggestions);
        });

        it('in table name', function() {
            // content assist point:               ^
            var inputText = 'SELECT name, age FROM  ';
            var suggestions = getContentAssist(inputText, 22, symbolTable);
            expect(suggestions).to.have.members(['employees', 'managers', 'aliens', 'allies'])
                .and.to.have.lengthOf(4);

            // content assist point:                         ^
            var inputTextWithSuffix = 'SELECT name, age FROM   where age < 99';
            expect(getContentAssist(inputTextWithSuffix, 22, symbolTable)).to.deep.equal(suggestions);
        });

        it('in table name with prefix', function() {
            // content assist point:            ^
            var inputText = 'SELECT name FROM al ';
            var suggestions = getContentAssist(inputText, 19, symbolTable);
            expect(suggestions).to.have.members(['aliens', 'allies'])
                .and.to.have.lengthOf(2);

            // content assist point:                      ^
            var inputTextWithSuffix = 'SELECT name FROM al  WHERE';
            expect(getContentAssist(inputTextWithSuffix, 19, symbolTable)).to.deep.equal(suggestions);
        });
    });

    context('can perform content assist in <whereClause>', function() {

        it('after WHERE keyword', function() {
            // content assist point:                            ^
            var inputText = 'SELECT name, age FROM aliens WHERE  ';
            var suggestions = getContentAssist(inputText, 35, symbolTable);
            expect(suggestions).to.have.members(['name', 'age', 'tenure', 'salary'])
                .and.to.have.lengthOf(4);


            // content assist point:                                      ^
            var inputTextWithSuffix = 'SELECT name, age FROM aliens WHERE   > tenure';
            expect(getContentAssist(inputTextWithSuffix, 35, symbolTable)).to.deep.equal(suggestions);
        });

        it('after column name keyword with prefix', function() {
            // content assist point:                               ^
            var inputText = 'SELECT name, age FROM aliens WHERE ten  ';
            var suggestions = getContentAssist(inputText, 38, symbolTable);
            expect(suggestions).to.have.members(['tenure'])
                .and.to.have.lengthOf(1);

            // content assist point:                                         ^
            var inputTextWithSuffix = 'SELECT name, age FROM aliens WHERE ten  < age';
            expect(getContentAssist(inputTextWithSuffix, 38, symbolTable)).to.deep.equal(suggestions);
        });

        it('after operator', function() {
            // content assist point:                                    ^
            var inputText = 'SELECT name, age FROM managers WHERE age >  ';
            var suggestions = getContentAssist(inputText, 43, symbolTable);
            expect(suggestions).to.have.members(['name', 'age', 'tenure', 'salary'])
                .and.to.have.lengthOf(4);
        });

        it('after operator with prefix', function() {
            // content assist point:                                       ^
            var inputText = 'SELECT name, age FROM managers WHERE age >  na ';
            var suggestions = getContentAssist(inputText, 46, symbolTable);
            expect(suggestions).to.have.members(["name"])
                .and.to.have.lengthOf(1);
        });
    });


});

