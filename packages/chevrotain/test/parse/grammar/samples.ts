import {
    NonTerminal,
    Repetition,
    RepetitionMandatory,
    RepetitionMandatoryWithSeparator,
    Rule,
    Option,
    Terminal
} from "../../../src/parse/grammar/gast/gast_public"
import { Alternation } from "../../../src/parse/grammar/gast/gast_public"
import { Flat } from "../../../src/parse/grammar/gast/gast_public"
import { RepetitionWithSeparator } from "../../../src/parse/grammar/gast/gast_public"
import { filter, values } from "../../../src/utils/utils"
import { augmentTokenTypes } from "../../../src/scan/tokens"
import { createToken } from "../../../src/scan/tokens_public"

export const IdentTok = createToken({ name: "IdentTok", pattern: /NA/ })
export const DotTok = createToken({ name: "DotTok", pattern: /NA/ })
export const DotDotTok = createToken({ name: "DotDotTok", pattern: /NA/ })
export const ColonTok = createToken({ name: "ColonTok", pattern: /NA/ })
export const LSquareTok = createToken({ name: "LSquareTok", pattern: /NA/ })
export const RSquareTok = createToken({ name: "RSquareTok", pattern: /NA/ })
export const ActionTok = createToken({ name: "ActionTok", pattern: /NA/ })
export const LParenTok = createToken({ name: "LParenTok", pattern: /NA/ })
export const RParenTok = createToken({ name: "RParenTok", pattern: /NA/ })
export const CommaTok = createToken({ name: "CommaTok", pattern: /NA/ })
export const SemicolonTok = createToken({ name: "SemicolonTok", pattern: /NA/ })
export const UnsignedIntegerLiteralTok = createToken({
    name: "UnsignedIntegerLiteralTok",
    pattern: /NA/
})
export const DefaultTok = createToken({ name: "DefaultTok", pattern: /NA/ })
export const AsteriskTok = createToken({ name: "AsteriskTok", pattern: /NA/ })
export const EntityTok = createToken({ name: "EntityTok", pattern: /NA/ })
export const NamespaceTok = createToken({ name: "NamespaceTok", pattern: /NA/ })
export const TypeTok = createToken({ name: "TypeTok", pattern: /NA/ })
export const ConstTok = createToken({ name: "ConstTok", pattern: /NA/ })
export const RequiredTok = createToken({ name: "RequiredTok", pattern: /NA/ })
export const KeyTok = createToken({ name: "KeyTok", pattern: /NA/ })
export const ElementTok = createToken({ name: "ElementTok", pattern: /NA/ })

export let atLeastOneRule = new Rule({
    name: "atLeastOneRule",
    definition: [
        new RepetitionMandatory({
            definition: [
                new RepetitionMandatory({
                    definition: [
                        new RepetitionMandatory({
                            definition: [
                                new Terminal({ terminalType: EntityTok })
                            ],
                            idx: 3
                        }),
                        new Terminal({ terminalType: CommaTok })
                    ],
                    idx: 2
                }),
                new Terminal({ terminalType: DotTok, idx: 1 })
            ]
        }),
        new Terminal({ terminalType: DotTok, idx: 2 })
    ]
})

export let atLeastOneSepRule = new Rule({
    name: "atLeastOneSepRule",
    definition: [
        new RepetitionMandatoryWithSeparator({
            definition: [
                new RepetitionMandatoryWithSeparator({
                    definition: [
                        new RepetitionMandatoryWithSeparator({
                            definition: [
                                new Terminal({ terminalType: EntityTok })
                            ],
                            separator: SemicolonTok,
                            idx: 3
                        }),
                        new Terminal({ terminalType: CommaTok })
                    ],
                    separator: SemicolonTok,
                    idx: 2
                }),
                new Terminal({ terminalType: DotTok, idx: 1 })
            ],
            separator: SemicolonTok
        }),
        new Terminal({ terminalType: DotTok, idx: 2 })
    ]
})

export let qualifiedName = new Rule({
    name: "qualifiedName",
    definition: [
        new Terminal({ terminalType: IdentTok }),
        new Repetition({
            definition: [
                new Terminal({ terminalType: DotTok }),
                new Terminal({ terminalType: IdentTok, idx: 2 })
            ]
        })
    ]
})

export let qualifiedNameSep = new Rule({
    name: "qualifiedNameSep",
    definition: [
        new RepetitionMandatoryWithSeparator({
            definition: [new Terminal({ terminalType: IdentTok, idx: 1 })],
            separator: DotTok
        })
    ]
})

export let paramSpec = new Rule({
    name: "paramSpec",
    definition: [
        new Terminal({ terminalType: IdentTok }),
        new Terminal({ terminalType: ColonTok }),
        new NonTerminal({
            nonTerminalName: "qualifiedName",
            referencedRule: qualifiedName
        }),
        new Option({
            definition: [
                new Terminal({ terminalType: LSquareTok }),
                new Terminal({ terminalType: RSquareTok })
            ]
        })
    ]
})

export let actionDec = new Rule({
    name: "actionDec",
    definition: [
        new Terminal({ terminalType: ActionTok }),
        new Terminal({ terminalType: IdentTok }),
        new Terminal({ terminalType: LParenTok }),
        new Option({
            definition: [
                new NonTerminal({
                    nonTerminalName: "paramSpec",
                    referencedRule: paramSpec
                }),
                new Repetition({
                    definition: [
                        new Terminal({ terminalType: CommaTok }),
                        new NonTerminal({
                            nonTerminalName: "paramSpec",
                            referencedRule: paramSpec,
                            idx: 2
                        })
                    ]
                })
            ]
        }),
        new Terminal({ terminalType: RParenTok }),
        new Option({
            definition: [
                new Terminal({ terminalType: ColonTok }),
                new NonTerminal({
                    nonTerminalName: "qualifiedName",
                    referencedRule: qualifiedName
                })
            ],
            idx: 2
        }),
        new Terminal({ terminalType: SemicolonTok })
    ]
})

export let actionDecSep = new Rule({
    name: "actionDecSep",
    definition: [
        new Terminal({ terminalType: ActionTok }),
        new Terminal({ terminalType: IdentTok }),
        new Terminal({ terminalType: LParenTok }),

        new RepetitionWithSeparator({
            definition: [
                new NonTerminal({
                    nonTerminalName: "paramSpec",
                    referencedRule: paramSpec,
                    idx: 2
                })
            ],
            separator: CommaTok
        }),

        new Terminal({ terminalType: RParenTok }),
        new Option({
            definition: [
                new Terminal({ terminalType: ColonTok }),
                new NonTerminal({
                    nonTerminalName: "qualifiedName",
                    referencedRule: qualifiedName
                })
            ],
            idx: 2
        }),
        new Terminal({ terminalType: SemicolonTok })
    ]
})

export let manyActions = new Rule({
    name: "manyActions",
    definition: [
        new Repetition({
            definition: [
                new NonTerminal({
                    nonTerminalName: "actionDec",
                    referencedRule: actionDec,
                    idx: 1
                })
            ]
        })
    ]
})

export let cardinality = new Rule({
    name: "cardinality",
    definition: [
        new Terminal({ terminalType: LSquareTok }),
        new Terminal({ terminalType: UnsignedIntegerLiteralTok }),
        new Terminal({ terminalType: DotDotTok }),
        new Alternation({
            definition: [
                new Flat({
                    definition: [
                        new Terminal({
                            terminalType: UnsignedIntegerLiteralTok,
                            idx: 2
                        })
                    ]
                }),
                new Flat({
                    definition: [new Terminal({ terminalType: AsteriskTok })]
                })
            ]
        }),
        new Terminal({ terminalType: RSquareTok })
    ]
})

export let assignedTypeSpec = new Rule({
    name: "assignedTypeSpec",
    definition: [
        new Terminal({ terminalType: ColonTok }),
        new NonTerminal({ nonTerminalName: "assignedType" }),

        new Option({
            definition: [new NonTerminal({ nonTerminalName: "enumClause" })]
        }),

        new Option({
            definition: [
                new Terminal({ terminalType: DefaultTok }),
                new NonTerminal({ nonTerminalName: "expression" })
            ],
            idx: 2
        })
    ]
})

export let lotsOfOrs = new Rule({
    name: "lotsOfOrs",
    definition: [
        new Alternation({
            definition: [
                new Flat({
                    definition: [
                        new Alternation({
                            definition: [
                                new Flat({
                                    definition: [
                                        new Terminal({
                                            terminalType: CommaTok,
                                            idx: 1
                                        })
                                    ]
                                }),
                                new Flat({
                                    definition: [
                                        new Terminal({
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
                new Flat({
                    definition: [
                        new Terminal({
                            terminalType: EntityTok,
                            idx: 1
                        })
                    ]
                })
            ]
        }),
        new Alternation({
            definition: [
                new Flat({
                    definition: [
                        new Terminal({
                            terminalType: DotTok,
                            idx: 1
                        })
                    ]
                })
            ],
            idx: 3
        })
    ]
})

export let emptyAltOr = new Rule({
    name: "emptyAltOr",
    definition: [
        new Alternation({
            definition: [
                new Flat({
                    definition: [
                        new Terminal({
                            terminalType: KeyTok,
                            idx: 1
                        })
                    ]
                }),
                new Flat({
                    definition: [
                        new Terminal({
                            terminalType: EntityTok,
                            idx: 1
                        })
                    ]
                }),
                new Flat({ definition: [] }) // an empty alternative
            ]
        })
    ]
})

export let callArguments = new Rule({
    name: "callArguments",
    definition: [
        new RepetitionWithSeparator({
            definition: [new Terminal({ terminalType: IdentTok, idx: 1 })],
            separator: CommaTok
        }),
        new RepetitionWithSeparator({
            definition: [new Terminal({ terminalType: IdentTok, idx: 2 })],
            separator: CommaTok,
            idx: 2
        })
    ]
})
