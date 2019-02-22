"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var gast_public_1 = require("../../../src/parse/grammar/gast/gast_public");
var gast_public_2 = require("../../../src/parse/grammar/gast/gast_public");
var gast_public_3 = require("../../../src/parse/grammar/gast/gast_public");
var gast_public_4 = require("../../../src/parse/grammar/gast/gast_public");
var IdentTok = /** @class */ (function () {
    function IdentTok() {
    }
    IdentTok.PATTERN = /NA/;
    return IdentTok;
}());
exports.IdentTok = IdentTok;
var DotTok = /** @class */ (function () {
    function DotTok() {
    }
    DotTok.PATTERN = /NA/;
    return DotTok;
}());
exports.DotTok = DotTok;
var DotDotTok = /** @class */ (function () {
    function DotDotTok() {
    }
    DotDotTok.PATTERN = /NA/;
    return DotDotTok;
}());
exports.DotDotTok = DotDotTok;
var ColonTok = /** @class */ (function () {
    function ColonTok() {
    }
    ColonTok.PATTERN = /NA/;
    return ColonTok;
}());
exports.ColonTok = ColonTok;
var LSquareTok = /** @class */ (function () {
    function LSquareTok() {
    }
    LSquareTok.PATTERN = /NA/;
    return LSquareTok;
}());
exports.LSquareTok = LSquareTok;
var RSquareTok = /** @class */ (function () {
    function RSquareTok() {
    }
    RSquareTok.PATTERN = /NA/;
    return RSquareTok;
}());
exports.RSquareTok = RSquareTok;
var ActionTok = /** @class */ (function () {
    function ActionTok() {
    }
    ActionTok.PATTERN = /NA/;
    return ActionTok;
}());
exports.ActionTok = ActionTok;
var LParenTok = /** @class */ (function () {
    function LParenTok() {
    }
    LParenTok.PATTERN = /NA/;
    return LParenTok;
}());
exports.LParenTok = LParenTok;
var RParenTok = /** @class */ (function () {
    function RParenTok() {
    }
    RParenTok.PATTERN = /NA/;
    return RParenTok;
}());
exports.RParenTok = RParenTok;
var CommaTok = /** @class */ (function () {
    function CommaTok() {
    }
    CommaTok.PATTERN = /NA/;
    return CommaTok;
}());
exports.CommaTok = CommaTok;
var SemicolonTok = /** @class */ (function () {
    function SemicolonTok() {
    }
    SemicolonTok.PATTERN = /NA/;
    return SemicolonTok;
}());
exports.SemicolonTok = SemicolonTok;
var UnsignedIntegerLiteralTok = /** @class */ (function () {
    function UnsignedIntegerLiteralTok() {
    }
    UnsignedIntegerLiteralTok.PATTERN = /NA/;
    return UnsignedIntegerLiteralTok;
}());
exports.UnsignedIntegerLiteralTok = UnsignedIntegerLiteralTok;
var DefaultTok = /** @class */ (function () {
    function DefaultTok() {
    }
    DefaultTok.PATTERN = /NA/;
    return DefaultTok;
}());
exports.DefaultTok = DefaultTok;
var AsteriskTok = /** @class */ (function () {
    function AsteriskTok() {
    }
    AsteriskTok.PATTERN = /NA/;
    return AsteriskTok;
}());
exports.AsteriskTok = AsteriskTok;
var EntityTok = /** @class */ (function () {
    function EntityTok() {
    }
    EntityTok.PATTERN = /NA/;
    return EntityTok;
}());
exports.EntityTok = EntityTok;
var NamespaceTok = /** @class */ (function () {
    function NamespaceTok() {
    }
    NamespaceTok.PATTERN = /NA/;
    return NamespaceTok;
}());
exports.NamespaceTok = NamespaceTok;
var TypeTok = /** @class */ (function () {
    function TypeTok() {
    }
    TypeTok.PATTERN = /NA/;
    return TypeTok;
}());
exports.TypeTok = TypeTok;
var ConstTok = /** @class */ (function () {
    function ConstTok() {
    }
    ConstTok.PATTERN = /NA/;
    return ConstTok;
}());
exports.ConstTok = ConstTok;
var RequiredTok = /** @class */ (function () {
    function RequiredTok() {
    }
    RequiredTok.PATTERN = /NA/;
    return RequiredTok;
}());
exports.RequiredTok = RequiredTok;
var KeyTok = /** @class */ (function () {
    function KeyTok() {
    }
    KeyTok.PATTERN = /NA/;
    return KeyTok;
}());
exports.KeyTok = KeyTok;
var ElementTok = /** @class */ (function () {
    function ElementTok() {
    }
    ElementTok.PATTERN = /NA/;
    return ElementTok;
}());
exports.ElementTok = ElementTok;
exports.atLeastOneRule = new gast_public_1.Rule({
    name: "atLeastOneRule",
    definition: [
        new gast_public_1.RepetitionMandatory({
            definition: [
                new gast_public_1.RepetitionMandatory({
                    definition: [
                        new gast_public_1.RepetitionMandatory({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: EntityTok })
                            ],
                            idx: 3
                        }),
                        new gast_public_1.Terminal({ terminalType: CommaTok })
                    ],
                    idx: 2
                }),
                new gast_public_1.Terminal({ terminalType: DotTok, idx: 1 })
            ]
        }),
        new gast_public_1.Terminal({ terminalType: DotTok, idx: 2 })
    ]
});
exports.atLeastOneSepRule = new gast_public_1.Rule({
    name: "atLeastOneSepRule",
    definition: [
        new gast_public_1.RepetitionMandatoryWithSeparator({
            definition: [
                new gast_public_1.RepetitionMandatoryWithSeparator({
                    definition: [
                        new gast_public_1.RepetitionMandatoryWithSeparator({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: EntityTok })
                            ],
                            separator: SemicolonTok,
                            idx: 3
                        }),
                        new gast_public_1.Terminal({ terminalType: CommaTok })
                    ],
                    separator: SemicolonTok,
                    idx: 2
                }),
                new gast_public_1.Terminal({ terminalType: DotTok, idx: 1 })
            ],
            separator: SemicolonTok
        }),
        new gast_public_1.Terminal({ terminalType: DotTok, idx: 2 })
    ]
});
exports.qualifiedName = new gast_public_1.Rule({
    name: "qualifiedName",
    definition: [
        new gast_public_1.Terminal({ terminalType: IdentTok }),
        new gast_public_1.Repetition({
            definition: [
                new gast_public_1.Terminal({ terminalType: DotTok }),
                new gast_public_1.Terminal({ terminalType: IdentTok, idx: 2 })
            ]
        })
    ]
});
exports.qualifiedNameSep = new gast_public_1.Rule({
    name: "qualifiedNameSep",
    definition: [
        new gast_public_1.RepetitionMandatoryWithSeparator({
            definition: [new gast_public_1.Terminal({ terminalType: IdentTok, idx: 1 })],
            separator: DotTok
        })
    ]
});
exports.paramSpec = new gast_public_1.Rule({
    name: "paramSpec",
    definition: [
        new gast_public_1.Terminal({ terminalType: IdentTok }),
        new gast_public_1.Terminal({ terminalType: ColonTok }),
        new gast_public_1.NonTerminal({
            nonTerminalName: "qualifiedName",
            referencedRule: exports.qualifiedName
        }),
        new gast_public_1.Option({
            definition: [
                new gast_public_1.Terminal({ terminalType: LSquareTok }),
                new gast_public_1.Terminal({ terminalType: RSquareTok })
            ]
        })
    ]
});
exports.actionDec = new gast_public_1.Rule({
    name: "actionDec",
    definition: [
        new gast_public_1.Terminal({ terminalType: ActionTok }),
        new gast_public_1.Terminal({ terminalType: IdentTok }),
        new gast_public_1.Terminal({ terminalType: LParenTok }),
        new gast_public_1.Option({
            definition: [
                new gast_public_1.NonTerminal({
                    nonTerminalName: "paramSpec",
                    referencedRule: exports.paramSpec
                }),
                new gast_public_1.Repetition({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: CommaTok }),
                        new gast_public_1.NonTerminal({
                            nonTerminalName: "paramSpec",
                            referencedRule: exports.paramSpec,
                            idx: 2
                        })
                    ]
                })
            ]
        }),
        new gast_public_1.Terminal({ terminalType: RParenTok }),
        new gast_public_1.Option({
            definition: [
                new gast_public_1.Terminal({ terminalType: ColonTok }),
                new gast_public_1.NonTerminal({
                    nonTerminalName: "qualifiedName",
                    referencedRule: exports.qualifiedName
                })
            ],
            idx: 2
        }),
        new gast_public_1.Terminal({ terminalType: SemicolonTok })
    ]
});
exports.actionDecSep = new gast_public_1.Rule({
    name: "actionDecSep",
    definition: [
        new gast_public_1.Terminal({ terminalType: ActionTok }),
        new gast_public_1.Terminal({ terminalType: IdentTok }),
        new gast_public_1.Terminal({ terminalType: LParenTok }),
        new gast_public_4.RepetitionWithSeparator({
            definition: [
                new gast_public_1.NonTerminal({
                    nonTerminalName: "paramSpec",
                    referencedRule: exports.paramSpec,
                    idx: 2
                })
            ],
            separator: CommaTok
        }),
        new gast_public_1.Terminal({ terminalType: RParenTok }),
        new gast_public_1.Option({
            definition: [
                new gast_public_1.Terminal({ terminalType: ColonTok }),
                new gast_public_1.NonTerminal({
                    nonTerminalName: "qualifiedName",
                    referencedRule: exports.qualifiedName
                })
            ],
            idx: 2
        }),
        new gast_public_1.Terminal({ terminalType: SemicolonTok })
    ]
});
exports.manyActions = new gast_public_1.Rule({
    name: "manyActions",
    definition: [
        new gast_public_1.Repetition({
            definition: [
                new gast_public_1.NonTerminal({
                    nonTerminalName: "actionDec",
                    referencedRule: exports.actionDec,
                    idx: 1
                })
            ]
        })
    ]
});
exports.cardinality = new gast_public_1.Rule({
    name: "cardinality",
    definition: [
        new gast_public_1.Terminal({ terminalType: LSquareTok }),
        new gast_public_1.Terminal({ terminalType: UnsignedIntegerLiteralTok }),
        new gast_public_1.Terminal({ terminalType: DotDotTok }),
        new gast_public_2.Alternation({
            definition: [
                new gast_public_3.Flat({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: UnsignedIntegerLiteralTok,
                            idx: 2
                        })
                    ]
                }),
                new gast_public_3.Flat({
                    definition: [new gast_public_1.Terminal({ terminalType: AsteriskTok })]
                })
            ]
        }),
        new gast_public_1.Terminal({ terminalType: RSquareTok })
    ]
});
exports.assignedTypeSpec = new gast_public_1.Rule({
    name: "assignedTypeSpec",
    definition: [
        new gast_public_1.Terminal({ terminalType: ColonTok }),
        new gast_public_1.NonTerminal({ nonTerminalName: "assignedType" }),
        new gast_public_1.Option({
            definition: [new gast_public_1.NonTerminal({ nonTerminalName: "enumClause" })]
        }),
        new gast_public_1.Option({
            definition: [
                new gast_public_1.Terminal({ terminalType: DefaultTok }),
                new gast_public_1.NonTerminal({ nonTerminalName: "expression" })
            ],
            idx: 2
        })
    ]
});
exports.lotsOfOrs = new gast_public_1.Rule({
    name: "lotsOfOrs",
    definition: [
        new gast_public_2.Alternation({
            definition: [
                new gast_public_3.Flat({
                    definition: [
                        new gast_public_2.Alternation({
                            definition: [
                                new gast_public_3.Flat({
                                    definition: [
                                        new gast_public_1.Terminal({
                                            terminalType: CommaTok,
                                            idx: 1
                                        })
                                    ]
                                }),
                                new gast_public_3.Flat({
                                    definition: [
                                        new gast_public_1.Terminal({
                                            terminalType: KeyTok,
                                            idx: 1
                                        })
                                    ]
                                })
                            ],
                            idx: 2
                        })
                    ]
                }),
                new gast_public_3.Flat({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: EntityTok,
                            idx: 1
                        })
                    ]
                })
            ]
        }),
        new gast_public_2.Alternation({
            definition: [
                new gast_public_3.Flat({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: DotTok,
                            idx: 1
                        })
                    ]
                })
            ],
            idx: 3
        })
    ]
});
exports.emptyAltOr = new gast_public_1.Rule({
    name: "emptyAltOr",
    definition: [
        new gast_public_2.Alternation({
            definition: [
                new gast_public_3.Flat({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: KeyTok,
                            idx: 1
                        })
                    ]
                }),
                new gast_public_3.Flat({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: EntityTok,
                            idx: 1
                        })
                    ]
                }),
                new gast_public_3.Flat({ definition: [] }) // an empty alternative
            ]
        })
    ]
});
exports.callArguments = new gast_public_1.Rule({
    name: "callArguments",
    definition: [
        new gast_public_4.RepetitionWithSeparator({
            definition: [new gast_public_1.Terminal({ terminalType: IdentTok, idx: 1 })],
            separator: CommaTok
        }),
        new gast_public_4.RepetitionWithSeparator({
            definition: [new gast_public_1.Terminal({ terminalType: IdentTok, idx: 2 })],
            separator: CommaTok,
            idx: 2
        })
    ]
});
//# sourceMappingURL=samples.js.map