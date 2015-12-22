function initExamplesDropDown() {
    examplesDropdown.find("option").remove()
    _.forEach(_.keys(samples), function (exampleName, idx) {
        examplesDropdown.append("<option value=\"" + exampleName + "\">" + exampleName + "</option>")
    })
}


function loadExample(exampleName, firstTime) {
    var sample = samples[exampleName]
    // reduce whitespace used for Indentation, 2 spaces is also used in the code mirror editor
    var sampleText = "(" + sample.implementation.toString().replace(/    /g, "  ") + "())"

    javaScriptEditor.setValue(sampleText)
    updateSamplesDropDown()
    if (firstTime) {
        onImplementationEditorContentChange() // can't wait for debounce on the first load as loadSamples will trigger lexAndParse
    }
    loadSamples(samplesDropdown.val())
}


function loadSamples(sampleKey) {
    var exampleKey = examplesDropdown.val()
    inputEditor.setValue(samples[exampleKey].sampleInputs[sampleKey])
    parserOutput.setValue("")
}


function updateSamplesDropDown() {
    samplesDropdown.find("option").remove()
    _.forOwn(samples[examplesDropdown.val()].sampleInputs, function (exampleValue, exampleName) {
        samplesDropdown.append("<option>" + exampleName + "</option>")
    })
}


function jsonExample() {
    // ----------------- Lexer -----------------
    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;

    // In ES6, custom inheritance implementation
    // (such as the one above) can be replaced
    // with a more simple: "class X extends Y"...
    var True = extendToken("True", /true/);
    var False = extendToken("False", /false/);
    var Null = extendToken("Null", /null/);
    var LCurly = extendToken("LCurly", /{/);
    var RCurly = extendToken("RCurly", /}/);
    var LSquare = extendToken("LSquare", /\[/);
    var RSquare = extendToken("RSquare", /]/);
    var Comma = extendToken("Comma", /,/);
    var Colon = extendToken("Colon", /:/);
    var StringLiteral = extendToken("StringLiteral",
        /"(:?[^\\"\n\r]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
    var NumberLiteral = extendToken("NumberLiteral",
        /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;


    var jsonTokens = [WhiteSpace, NumberLiteral, StringLiteral, RCurly, LCurly,
        LSquare, RSquare, Comma, Colon, True, False, Null];

    var ChevJsonLexer = new Lexer(jsonTokens, true);


    // ----------------- parser -----------------
    var ChevrotainParser = chevrotain.Parser;

    function ChevrotainJsonParser(input) {
        ChevrotainParser.call(this, input, jsonTokens);
        var $ = this;


        this.object = this.RULE("object", function () {
            // use debugger statements to add breakpoints
            // (if your browser supports debugging evaluated code)
            // debugger;
            var obj = {}

            $.CONSUME(LCurly);
            $.MANY_SEP(Comma, function () {
                _.assign(obj, $.SUBRULE($.objectItem));
            });
            $.CONSUME(RCurly);

            return obj;
        });


        this.objectItem = this.RULE("objectItem", function () {
            var lit, key, value, obj = {};

            lit = $.CONSUME(StringLiteral)
            $.CONSUME(Colon);
            value = $.SUBRULE($.value);

            // an empty json key is not valid, use "BAD_KEY" instead
            key = lit.isInsertedInRecovery ?
                "BAD_KEY" : lit.image.substr(1, lit.image.length - 2);
            obj[key] = value;
            return obj;
        });


        this.array = this.RULE("array", function () {
            var arr = [];
            $.CONSUME(LSquare);
            $.MANY_SEP(Comma, function () {
                arr.push($.SUBRULE($.value));
            });
            $.CONSUME(RSquare);

            return arr;
        });


        // @formatter:off
        this.value = this.RULE("value", function () {
            return $.OR([
                { ALT: function () {
                    var stringLiteral = $.CONSUME(StringLiteral).image
                    // chop of the quotation marks
                    return stringLiteral.substr(1, stringLiteral.length  - 2);
                }},
                { ALT: function () { return Number($.CONSUME(NumberLiteral).image) }},
                { ALT: function () { return $.SUBRULE($.object) }},
                { ALT: function () { return $.SUBRULE($.array) }},
                { ALT: function () {
                    $.CONSUME(True);
                    return true;
                }},
                { ALT: function () {
                    $.CONSUME(False);
                    return false;
                }},
                { ALT: function () {
                    $.CONSUME(Null);
                    return null;
                }}
            ], "a value");
        });
        // @formatter:on

        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        ChevrotainParser.performSelfAnalysis(this);
    }

    ChevrotainJsonParser.prototype = Object.create(ChevrotainParser.prototype);
    ChevrotainJsonParser.prototype.constructor = ChevrotainJsonParser;

    // for the playground to work the returned object must contain these fields
    return {
        lexer      : ChevJsonLexer,
        parser     : ChevrotainJsonParser,
        defaultRule: "object"
    };
}


function calculatorExample() {
    // ----------------- lexer -----------------
    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;
    var Parser = chevrotain.Parser;

    // using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
    // AdditionOperator defines a Tokens hierarchy but only leafs in this hierarchy
    // define actual Tokens that can appear in the text
    var AdditionOperator = extendToken("AdditionOperator", Lexer.NA);
    var Plus = extendToken("Plus", /\+/, AdditionOperator);
    var Minus = extendToken("Minus", /-/, AdditionOperator);

    var MultiplicationOperator = extendToken("MultiplicationOperator", Lexer.NA);
    var Multi = extendToken("Multi", /\*/, MultiplicationOperator);
    var Div = extendToken("Div", /\//, MultiplicationOperator);

    var LParen = extendToken("LParen", /\(/);
    var RParen = extendToken("RParen", /\)/);
    var NumberLiteral = extendToken("NumberLiteral", /[1-9]\d*/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;

    // whitespace is normally very common so it is placed first to speed up the lexer
    var allTokens = [WhiteSpace,
        Plus, Minus, Multi, Div, LParen, RParen,
        NumberLiteral, AdditionOperator, MultiplicationOperator];
    var CalculatorLexer = new Lexer(allTokens, true);


    // ----------------- parser -----------------
    function Calculator(input) {
        Parser.call(this, input, allTokens);

        var $ = this;

        this.expression = $.RULE("expression", function () {
            // use debugger statements to add breakpoints (works in chrome/firefox)
            debugger;
            return $.SUBRULE($.additionExpression)
        });


        // Lowest precedence thus it is first in the rule chain
        // The precedence of binary expressions is determined by
        // how far down the Parse Tree the binary expression appears.
        this.additionExpression = $.RULE("additionExpression", function () {
            var value, op, rhsVal;

            // parsing part
            value = $.SUBRULE($.multiplicationExpression);
            $.MANY(function () {
                // consuming 'AdditionOperator' will consume
                // either Plus or Minus as they are subclasses of AdditionOperator
                op = $.CONSUME(AdditionOperator);
                //  the index "2" in SUBRULE2 is needed to identify the unique
                // position in the grammar during runtime
                rhsVal = $.SUBRULE2($.multiplicationExpression);

                // interpreter part
                if (op instanceof Plus) {
                    value += rhsVal
                } else { // op instanceof Minus
                    value -= rhsVal
                }
            });

            return value
        });


        this.multiplicationExpression = $.RULE("multiplicationExpression", function () {
            var value, op, rhsVal;

            // parsing part
            value = $.SUBRULE($.atomicExpression);
            $.MANY(function () {
                op = $.CONSUME(MultiplicationOperator);
                //  the index "2" in SUBRULE2 is needed to identify the unique
                // position in the grammar during runtime
                rhsVal = $.SUBRULE2($.atomicExpression);

                // interpreter part
                if (op instanceof Multi) {
                    value *= rhsVal
                } else { // op instanceof Div
                    value /= rhsVal
                }
            });

            return value
        });


        this.atomicExpression = $.RULE("atomicExpression", function () {
            // @formatter:off
            return $.OR([
                // parenthesisExpression has the highest precedence and thus it
                // appears in the "lowest" leaf in the expression ParseTree.
                {ALT: function(){ return $.SUBRULE($.parenthesisExpression)}},
                {ALT: function(){ return parseInt($.CONSUME(NumberLiteral).image, 10)}}
            ]);
            // @formatter:on
        });


        this.parenthesisExpression = $.RULE("parenthesisExpression", function () {
            var expValue;

            $.CONSUME(LParen);
            expValue = $.SUBRULE($.expression);
            $.CONSUME(RParen);

            return expValue
        });

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }

    // avoids inserting number literals as these have a additional meaning.
    // and we can never choose the "right meaning".
    // For example: a Comma has just one meaning, but a Number may be any of:
    // 1,2,3,...n, 0.4E+3 which value should we used when inserting... ?
    Calculator.prototype.canTokenTypeBeInsertedInRecovery = function (tokClass) {
        return tokClass !== NumberLiteral
    };


    Calculator.prototype = Object.create(Parser.prototype);
    Calculator.prototype.constructor = Calculator;

    // for the playground to work the returned object must contain these fields
    return {
        lexer      : CalculatorLexer,
        parser     : Calculator,
        defaultRule: "expression"
    };
}


function tutorialLexerExample() {

    // Tutorial Step 1:
    // Implementation of A lexer for a simple SELECT statement grammar
    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;

    // extendToken is used to create a constructor for a Token class
    // The Lexer's output will contain an array of
    // instances created by these constructors
    var Select = extendToken("Select", /SELECT/);
    var From = extendToken("From", /FROM/);
    var Where = extendToken("Where", /WHERE/);
    var Comma = extendToken("Comma", /,/);
    var identifier = extendToken("identifier", /\w+/);
    var Integer = extendToken("Integer", /0|[1-9]\d+/);
    var GreaterThan = extendToken("GreaterThan", /</);
    var LessThan = extendToken("LessThan", />/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;

    // whitespace is normally very common so it is placed first to speed up the lexer
    var allTokens = [WhiteSpace, Select, From, Where, Comma,
        identifier, Integer, GreaterThan, LessThan];

    var SelectLexer = new Lexer(allTokens, true);

    return {
        // becuase only a lexer is returned the output will display
        // the Lexed token array.
        lexer: SelectLexer
    };
}

// TODO: avoid duplication of code from step 1
function tutorialGrammarExample() {

    // Tutorial Step 2:

    // Adding a Parser (grammar only, only reads the input
    // without any actions) using the Tokens defined in the previous step.
    // modification to the grammar will be displayed in the syntax diagrams panel.

    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;
    var Parser = chevrotain.Parser;

    var Select = extendToken("Select", /SELECT/);
    var From = extendToken("From", /FROM/);
    var Where = extendToken("Where", /WHERE/);
    var Comma = extendToken("Comma", /,/);
    var Identifier = extendToken("Identifier", /\w+/);
    var Integer = extendToken("Integer", /0|[1-9]\d+/);
    var GreaterThan = extendToken("GreaterThan", /</);
    var LessThan = extendToken("LessThan", />/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;

    // whitespace is normally very common so it is placed first to speed up the lexer
    var allTokens = [WhiteSpace, Select, From, Where, Comma,
        Identifier, Integer, GreaterThan, LessThan];
    var SelectLexer = new Lexer(allTokens, true);


    // ----------------- parser -----------------
    function SelectParser(input) {
        Parser.call(this, input, allTokens);
        var $ = this;


        this.selectStatment = $.RULE("selectStatment", function () {
            $.SUBRULE($.selectClause)
            $.SUBRULE($.fromClause)
            $.OPTION(function () {
                $.SUBRULE($.whereClause)
            })

            return "No output, grammar only example."
        });


        this.selectClause = $.RULE("selectClause", function () {
            $.CONSUME(Select);
            $.AT_LEAST_ONE_SEP(Comma, function () {
                $.CONSUME(Identifier);
            }, "column name");
        });


        this.fromClause = $.RULE("fromClause", function () {
            $.CONSUME(From);
            $.CONSUME(Identifier);

            // example:
            // replace the contents of this rule with the commented out lines
            // below to implement multiple tables to select from (implicit join).

            //$.CONSUME(From);
            //$.AT_LEAST_ONE_SEP(Comma, function () {
            //    $.CONSUME(Identifier);
            //}, "table name");
        });


        this.whereClause = $.RULE("whereClause", function () {
            $.CONSUME(Where)
            $.SUBRULE($.expression)
        });


        this.expression = $.RULE("expression", function () {
            $.SUBRULE($.atomicExpression);
            $.SUBRULE($.relationalOperator);
            $.SUBRULE2($.atomicExpression); // note the '2' suffix to distinguish
                                            // from the 'SUBRULE(atomicExpression)'
                                            // 2 lines above.
        });


        this.atomicExpression = $.RULE("atomicExpression", function () {
            // @formatter:off
            return $.OR([
                {ALT: function(){ $.CONSUME(Integer)}},
                {ALT: function(){ $.CONSUME(Identifier)}}
            ]);
            // @formatter:on
        });


        this.relationalOperator = $.RULE("relationalOperator", function () {
            // @formatter:off
            return $.OR([
                {ALT: function(){ $.CONSUME(GreaterThan)}},
                {ALT: function(){ $.CONSUME(LessThan)}}
            ]);
            // @formatter:on
        });


        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }

    SelectParser.prototype = Object.create(Parser.prototype);
    SelectParser.prototype.constructor = SelectParser;

    return {
        lexer      : SelectLexer,
        parser     : SelectParser,
        defaultRule: "selectStatment"
    };
}

function tutorialGrammarActionsExample() {

    // Tutorial Step 3:

    // Adding grammar action to build an AST instead of just reading the input.
    // The output AST can be observed in the output panel.

    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;
    var Parser = chevrotain.Parser;

    var Select = extendToken("Select", /SELECT/);
    var From = extendToken("From", /FROM/);
    var Where = extendToken("Where", /WHERE/);
    var Comma = extendToken("Comma", /,/);
    var Identifier = extendToken("Identifier", /\w+/);
    var Integer = extendToken("Integer", /0|[1-9]\d+/);
    var GreaterThan = extendToken("GreaterThan", /</);
    var LessThan = extendToken("LessThan", />/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;

    // whitespace is normally very common so it is placed first to speed up the lexer
    var allTokens = [WhiteSpace, Select, From, Where, Comma,
        Identifier, Integer, GreaterThan, LessThan];
    var SelectLexer = new Lexer(allTokens, true);


    // ----------------- parser -----------------
    function SelectParser(input) {
        Parser.call(this, input, allTokens);
        var $ = this;


        this.selectStatment = $.RULE("selectStatment", function () {
            var select, from, where
            select = $.SUBRULE($.selectClause)
            from = $.SUBRULE($.fromClause)
            $.OPTION(function () {
                where = $.SUBRULE($.whereClause)
            })

            // a parsing rule may return a value.
            // In this case our AST is is a simple javascript object.
            // Generally the returned value may be any javascript value.
            return {
                type      : "SELECT_STMT", selectClause: select,
                fromClause: from, whereClause: where
            }
        });


        this.selectClause = $.RULE("selectClause", function () {
            var columns = []

            $.CONSUME(Select);
            $.AT_LEAST_ONE_SEP(Comma, function () {
                // accessing a token's string via .image property
                columns.push($.CONSUME(Identifier).image);
            }, "column name");

            return {type: "SELECT_CLAUSE", columns: columns}
        });


        this.fromClause = $.RULE("fromClause", function () {
            var table

            $.CONSUME(From);
            table = $.CONSUME(Identifier).image;

            return {type: "FROM_CLAUSE", table: table}
        });


        this.whereClause = $.RULE("whereClause", function () {
            var condition
            debugger;

            $.CONSUME(Where)
            // a SUBRULE call will return the value the called rule returns.
            condition = $.SUBRULE($.expression)

            return {type: "WHERE_CLAUSE", condition: condition}
        });


        this.expression = $.RULE("expression", function () {
            var lhs, operator, rhs

            lhs = $.SUBRULE($.atomicExpression);
            operator = $.SUBRULE($.relationalOperator);
            rhs = $.SUBRULE2($.atomicExpression);

            return {type: "EXPRESSION", lhs: lhs, operator: operator, rhs: rhs}
        });


        this.atomicExpression = $.RULE("atomicExpression", function () {
            // @formatter:off
            return $.OR([ // OR returns the value of the chosen alternative.
                {ALT: function(){ return $.CONSUME(Integer)}},
                {ALT: function(){ return $.CONSUME(Identifier)}}
            ]).image;
            // @formatter:on
        });


        this.relationalOperator = $.RULE("relationalOperator", function () {
            // @formatter:off
            return $.OR([
                {ALT: function(){ return $.CONSUME(GreaterThan)}},
                {ALT: function(){ return $.CONSUME(LessThan)}}
            ]).image;
            // @formatter:on
        });


        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }

    SelectParser.prototype = Object.create(Parser.prototype);
    SelectParser.prototype.constructor = SelectParser;

    return {
        lexer      : SelectLexer,
        parser     : SelectParser,
        defaultRule: "selectStatment"
    };
}


var samples = {
    json      : {
        implementation: jsonExample,
        sampleInputs  : {
            'valid': '{' +
            '\n\t"firstName": "John",' +
            '\n\t"lastName": "Smith",' +
            '\n\t"isAlive": true,' +
            '\n\t"age": 25' +
            '\n}',

            'missing colons': '{' +
            '\n\t"look" "mom",' +
            '\n\t"no" "colons",' +
            '\n\t"!" "success!",' +
            '\n}',

            'also missing opening curly': '\t"the" "dog",' +
            '\n\t"ate" "my",' +
            '\n\t"opening" "left",' +
            '\n\t"curly" "success!"' +
            '\n}',

            'too many commas': '{' +
            '\n\t"three commas" : 3,,,' +
            '\n\t"five commas": 5,,,,,' +
            '\n\t"!" : "success"' +
            '\n}',

            'missing comma': '{' +
            '\n\t"missing ": "comma->" ' +
            '\n\t"I will be lost in": "recovery", ' +
            '\n\t"but I am still": "here",' +
            '\n\t"partial success": "only one property lost"' +
            '\n}',

            'missing comma in array': '{' +
            '\n\t"name" : "Bobby",' +
            '\n\t"children ages" : [1, 2 3, 4],' +
            '\n\t"partial success": "only one array element lost"' +
            '\n}'
        }
    },
    calculator: {
        implementation: calculatorExample,
        sampleInputs  : {
            "parenthesis precedence"      : "2 * ( 3 + 7)",
            "operator precedence"         : "2 + 4 * 5 / 10",
            "unidentified Token - success": "1 + @@1 + 1"
        }
    },

    "tutorial lexer": {
        implementation: tutorialLexerExample,
        sampleInputs  : {
            "valid"         : "SELECT name, age FROM students WHERE age > 22",
            "invalid tokens": "SELECT lastName, wage #$@#$ FROM employees ? WHERE wage > 666"
        }
    },

    "tutorial grammar": {
        implementation: tutorialGrammarExample,
        sampleInputs  : {
            "valid"         : "SELECT name, age FROM students WHERE age > 22",
            "invalid tokens": "SELECT lastName, wage #$@#$ FROM employees ? WHERE wage > 666"
        }
    },

    "tutorial actions": {
        implementation: tutorialGrammarActionsExample,
        sampleInputs  : {
            "valid"         : "SELECT name, age FROM students WHERE age > 22",
            "invalid tokens": "SELECT lastName, wage #$@#$ FROM employees ? WHERE wage > 666"
        }
    }
}
