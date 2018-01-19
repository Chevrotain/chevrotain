import { gast } from "../../../src/parse/grammar/gast_public"

let Rule = gast.Rule
let RepetitionMandatory = gast.RepetitionMandatory
let RepetitionMandatoryWithSeparator = gast.RepetitionMandatoryWithSeparator
let Repetition = gast.Repetition
let NonTerminal = gast.NonTerminal
let RepetitionWithSeparator = gast.RepetitionWithSeparator
let Terminal = gast.Terminal
let Option = gast.Option
let Alternation = gast.Alternation
let Flat = gast.Flat

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
                            occurrenceInParent: 3
                        }),
                        new Terminal({ terminalType: CommaTok })
                    ],
                    occurrenceInParent: 2
                }),
                new Terminal({ terminalType: DotTok, occurrenceInParent: 1 })
            ]
        }),
        new Terminal({ terminalType: DotTok, occurrenceInParent: 2 })
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
                            occurrenceInParent: 3
                        }),
                        new Terminal({ terminalType: CommaTok })
                    ],
                    separator: SemicolonTok,
                    occurrenceInParent: 2
                }),
                new Terminal({ terminalType: DotTok, occurrenceInParent: 1 })
            ],
            separator: SemicolonTok
        }),
        new Terminal({ terminalType: DotTok, occurrenceInParent: 2 })
    ]
})

export let qualifiedName = new Rule({
    name: "qualifiedName",
    definition: [
        new Terminal({ terminalType: IdentTok }),
        new Repetition({
            definition: [
                new Terminal({ terminalType: DotTok }),
                new Terminal({ terminalType: IdentTok, occurrenceInParent: 2 })
            ]
        })
    ]
})

export let qualifiedNameSep = new Rule({
    name: "qualifiedNameSep",
    definition: [
        new RepetitionMandatoryWithSeparator({
            definition: [
                new Terminal({ terminalType: IdentTok, occurrenceInParent: 1 })
            ],
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
                            occurrenceInParent: 2
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
            occurrenceInParent: 2
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
                    occurrenceInParent: 2
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
            occurrenceInParent: 2
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
                    occurrenceInParent: 1
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
                            occurrenceInParent: 2
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
            occurrenceInParent: 2
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
                                            occurrenceInParent: 1
                                        })
                                    ]
                                }),
                                new Flat({
                                    definition: [
                                        new Terminal({
                                            terminalType: KeyTok,
                                            occurrenceInParent: 1
                                        })
                                    ]
                                })
                            ],
                            occurrenceInParent: 2
                        })
                    ]
                }),
                new Flat({
                    definition: [
                        new Terminal({
                            terminalType: EntityTok,
                            occurrenceInParent: 1
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
                            occurrenceInParent: 1
                        })
                    ]
                })
            ],
            occurrenceInParent: 3
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
                            occurrenceInParent: 1
                        })
                    ]
                }),
                new Flat({
                    definition: [
                        new Terminal({
                            terminalType: EntityTok,
                            occurrenceInParent: 1
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
            definition: [
                new Terminal({ terminalType: IdentTok, occurrenceInParent: 1 })
            ],
            separator: CommaTok
        }),
        new RepetitionWithSeparator({
            definition: [
                new Terminal({ terminalType: IdentTok, occurrenceInParent: 2 })
            ],
            separator: CommaTok,
            occurrenceInParent: 2
        })
    ]
})
