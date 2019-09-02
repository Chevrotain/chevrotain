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

export class IdentTok {
    static PATTERN = /NA/
}
export class DotTok {
    static PATTERN = /NA/
}
export class DotDotTok {
    static PATTERN = /NA/
}
export class ColonTok {
    static PATTERN = /NA/
}
export class LSquareTok {
    static PATTERN = /NA/
}
export class RSquareTok {
    static PATTERN = /NA/
}
export class ActionTok {
    static PATTERN = /NA/
}
export class LParenTok {
    static PATTERN = /NA/
}
export class RParenTok {
    static PATTERN = /NA/
}
export class CommaTok {
    static PATTERN = /NA/
}
export class SemicolonTok {
    static PATTERN = /NA/
}
export class UnsignedIntegerLiteralTok {
    static PATTERN = /NA/
}
export class DefaultTok {
    static PATTERN = /NA/
}
export class AsteriskTok {
    static PATTERN = /NA/
}
export class EntityTok {
    static PATTERN = /NA/
}
export class NamespaceTok {
    static PATTERN = /NA/
}
export class TypeTok {
    static PATTERN = /NA/
}
export class ConstTok {
    static PATTERN = /NA/
}
export class RequiredTok {
    static PATTERN = /NA/
}
export class KeyTok {
    static PATTERN = /NA/
}
export class ElementTok {
    static PATTERN = /NA/
}

// Hack to support legacy tokenTypes as classes in this test (too lazy to convert them to createToken :-)  ...
const tokenTypes: any = filter(
    values(module.exports),
    item => item.PATTERN !== undefined
)
augmentTokenTypes(tokenTypes)

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
