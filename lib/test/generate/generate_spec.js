"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parser_traits_1 = require("../../src/parse/parser/traits/parser_traits");
var generate_public_1 = require("../../src/generate/generate_public");
var tokens_public_1 = require("../../src/scan/tokens_public");
var matchers_1 = require("../utils/matchers");
var gast_public_1 = require("../../src/parse/grammar/gast/gast_public");
var describeNodeOnly = describe;
if (typeof window !== "undefined") {
    describeNodeOnly = describe.skip;
}
describe("The Code Generation capabilities", function () {
    it("can generate a Terminal", function () {
        var Identifier = tokens_public_1.createToken({ name: "Identifier", pattern: /\w+/ });
        var tokenVocabulary = [Identifier];
        var rules = [
            new gast_public_1.Rule({
                name: "topRule",
                definition: [new gast_public_1.Terminal({ terminalType: Identifier })]
            })
        ];
        var parserFactory = generate_public_1.generateParserFactory({
            name: "genTerminalParser",
            rules: rules,
            tokenVocabulary: tokenVocabulary
        });
        var myParser = parserFactory({});
        myParser.input = [matchers_1.createRegularToken(Identifier)];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
    });
    it("can generate a NonTerminal", function () {
        var Identifier = tokens_public_1.createToken({ name: "Identifier", pattern: /\w+/ });
        var tokenVocabulary = [Identifier];
        var rules = [
            new gast_public_1.Rule({
                name: "topRule",
                definition: [
                    new gast_public_1.NonTerminal({ nonTerminalName: "nestedRules" })
                ]
            }),
            new gast_public_1.Rule({
                name: "nestedRules",
                definition: [new gast_public_1.Terminal({ terminalType: Identifier })]
            })
        ];
        var parserFactory = generate_public_1.generateParserFactory({
            name: "genNoneTerminalParser",
            rules: rules,
            tokenVocabulary: tokenVocabulary
        });
        var myParser = parserFactory();
        myParser.input = [matchers_1.createRegularToken(Identifier)];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
    });
    it("can generate a Option", function () {
        var Identifier = tokens_public_1.createToken({ name: "Identifier", pattern: /\w+/ });
        var tokenVocabulary = [Identifier];
        var rules = [
            new gast_public_1.Rule({
                name: "topRule",
                definition: [
                    new gast_public_1.Option({
                        definition: [
                            new gast_public_1.Flat({
                                definition: [
                                    new gast_public_1.Terminal({ terminalType: Identifier })
                                ]
                            })
                        ]
                    })
                ]
            })
        ];
        var parserFactory = generate_public_1.generateParserFactory({
            name: "genOptionParser",
            rules: rules,
            tokenVocabulary: tokenVocabulary
        });
        var myParser = parserFactory();
        myParser.input = [matchers_1.createRegularToken(Identifier)];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
        myParser.input = [];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
    });
    it("can generate a Or", function () {
        var Identifier = tokens_public_1.createToken({ name: "Identifier", pattern: /\w+/ });
        var Integer = tokens_public_1.createToken({ name: "Integer", pattern: /\d+/ });
        var tokenVocabulary = [Identifier, Integer];
        var rules = [
            new gast_public_1.Rule({
                name: "topRule",
                definition: [
                    new gast_public_1.Alternation({
                        definition: [
                            new gast_public_1.Flat({
                                definition: [
                                    new gast_public_1.Terminal({
                                        terminalType: Identifier
                                    })
                                ]
                            }),
                            new gast_public_1.Flat({
                                definition: [
                                    new gast_public_1.Terminal({ terminalType: Integer })
                                ],
                                name: "$inlinedRule"
                            })
                        ]
                    })
                ]
            })
        ];
        var parserFactory = generate_public_1.generateParserFactory({
            name: "genOrParser",
            rules: rules,
            tokenVocabulary: tokenVocabulary
        });
        var myParser = parserFactory();
        myParser.input = [matchers_1.createRegularToken(Identifier)];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
        myParser.input = [matchers_1.createRegularToken(Integer)];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
    });
    it("can generate a Repetition", function () {
        var Identifier = tokens_public_1.createToken({ name: "Identifier", pattern: /\w+/ });
        var tokenVocabulary = [Identifier];
        var rules = [
            new gast_public_1.Rule({
                name: "topRule",
                definition: [
                    new gast_public_1.Repetition({
                        definition: [
                            new gast_public_1.Terminal({ terminalType: Identifier })
                        ],
                        idx: 1,
                        name: "$inlinedRule"
                    })
                ]
            })
        ];
        var parserFactory = generate_public_1.generateParserFactory({
            name: "genManyParser",
            rules: rules,
            tokenVocabulary: tokenVocabulary
        });
        var myParser = parserFactory();
        myParser.input = [matchers_1.createRegularToken(Identifier)];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
        myParser.input = [
            matchers_1.createRegularToken(Identifier),
            matchers_1.createRegularToken(Identifier),
            matchers_1.createRegularToken(Identifier)
        ];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
    });
    it("can generate a Mandatory Repetition", function () {
        var Identifier = tokens_public_1.createToken({ name: "Identifier", pattern: /\w+/ });
        var tokenVocabulary = [Identifier];
        var rules = [
            new gast_public_1.Rule({
                name: "topRule",
                definition: [
                    new gast_public_1.RepetitionMandatory({
                        definition: [new gast_public_1.Terminal({ terminalType: Identifier })]
                    })
                ]
            })
        ];
        var parserFactory = generate_public_1.generateParserFactory({
            name: "genAtLeastOneParser",
            rules: rules,
            tokenVocabulary: tokenVocabulary
        });
        var myParser = parserFactory();
        myParser.input = [matchers_1.createRegularToken(Identifier)];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
        myParser.input = [
            matchers_1.createRegularToken(Identifier),
            matchers_1.createRegularToken(Identifier),
            matchers_1.createRegularToken(Identifier)
        ];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
    });
    it("can generate a Repetition with separator", function () {
        var Identifier = tokens_public_1.createToken({ name: "Identifier", pattern: /\w+/ });
        var Comma = tokens_public_1.createToken({ name: "Comma", pattern: /,/ });
        var tokenVocabulary = [Identifier, Comma];
        var rules = [
            new gast_public_1.Rule({
                name: "topRule",
                definition: [
                    new gast_public_1.RepetitionWithSeparator({
                        definition: [
                            new gast_public_1.Terminal({ terminalType: Identifier })
                        ],
                        separator: Comma
                    })
                ]
            })
        ];
        var parserFactory = generate_public_1.generateParserFactory({
            name: "genManySepParser",
            rules: rules,
            tokenVocabulary: tokenVocabulary
        });
        var myParser = parserFactory();
        myParser.input = [];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
        myParser.input = [
            matchers_1.createRegularToken(Identifier),
            matchers_1.createRegularToken(Comma),
            matchers_1.createRegularToken(Identifier),
            matchers_1.createRegularToken(Comma),
            matchers_1.createRegularToken(Identifier)
        ];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
    });
    it("can generate a Mandatory Repetition with separator", function () {
        var Identifier = tokens_public_1.createToken({ name: "Identifier", pattern: /\w+/ });
        var Comma = tokens_public_1.createToken({ name: "Comma", pattern: /,/ });
        var tokenVocabulary = [Identifier, Comma];
        var rules = [
            new gast_public_1.Rule({
                name: "topRule",
                definition: [
                    new gast_public_1.RepetitionMandatoryWithSeparator({
                        definition: [
                            new gast_public_1.Terminal({ terminalType: Identifier })
                        ],
                        separator: Comma
                    })
                ]
            })
        ];
        var parserFactory = generate_public_1.generateParserFactory({
            name: "genAtLeastOneSepParser",
            rules: rules,
            tokenVocabulary: tokenVocabulary
        });
        var myParser = parserFactory();
        myParser.input = [matchers_1.createRegularToken(Identifier)];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
        myParser.input = [
            matchers_1.createRegularToken(Identifier),
            matchers_1.createRegularToken(Comma),
            matchers_1.createRegularToken(Identifier),
            matchers_1.createRegularToken(Comma),
            matchers_1.createRegularToken(Identifier)
        ];
        myParser.topRule();
        expect(myParser.errors).to.be.empty;
    });
    describeNodeOnly("moduleGeneration", function () {
        before(function () {
            var mock = require("mock-require");
            mock("chevrotain", { Parser: parser_traits_1.Parser });
        });
        it("Can generate a module", function () {
            var requireFromString = require("require-from-string");
            var Identifier = tokens_public_1.createToken({
                name: "Identifier",
                pattern: /\w+/
            });
            var Integer = tokens_public_1.createToken({ name: "Integer", pattern: /\d+/ });
            var tokenVocabulary = [Identifier, Integer];
            var rules = [
                new gast_public_1.Rule({
                    name: "topRule",
                    definition: [
                        new gast_public_1.Alternation({
                            definition: [
                                new gast_public_1.Flat({
                                    definition: [
                                        new gast_public_1.RepetitionMandatory({
                                            definition: [
                                                new gast_public_1.Terminal({
                                                    terminalType: Identifier
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                new gast_public_1.Flat({
                                    definition: [
                                        new gast_public_1.Terminal({
                                            terminalType: Integer
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ];
            var parserModuleText = generate_public_1.generateParserModule({
                name: "genOrParserModule",
                rules: rules
            });
            var parserModule = requireFromString(parserModuleText);
            var myParser = new parserModule.genOrParserModule(tokenVocabulary);
            myParser.input = [matchers_1.createRegularToken(Identifier)];
            myParser.topRule();
            expect(myParser.errors).to.be.empty;
            myParser.input = [matchers_1.createRegularToken(Integer)];
            myParser.topRule();
            expect(myParser.errors).to.be.empty;
        });
        after(function () {
            var mock = require("mock-require");
            mock.stop("chevrotain");
        });
    });
});
//# sourceMappingURL=generate_spec.js.map