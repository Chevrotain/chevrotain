
module test.samples {

    import gast = chevrotain.gast

    export class IdentTok extends chevrotain.Token {}
    export class DotTok extends chevrotain.Token {}
    export class DotDotTok extends chevrotain.Token {}
    export class ColonTok extends chevrotain.Token {}
    export class LSquareTok extends chevrotain.Token {}
    export class RSquareTok extends chevrotain.Token {}
    export class ActionTok extends chevrotain.Token {}
    export class LParenTok extends chevrotain.Token {}
    export class RParenTok extends chevrotain.Token {}
    export class CommaTok extends chevrotain.Token {}
    export class SemicolonTok extends chevrotain.Token {}
    export class UnsignedIntegerLiteralTok extends chevrotain.Token {}
    export class DefaultTok extends chevrotain.Token {}
    export class AsteriskTok extends chevrotain.Token {}
    export class EntityTok extends chevrotain.Token {}
    export class NamespaceTok extends chevrotain.Token {}
    export class TypeTok extends chevrotain.Token {}
    export class ConstTok extends chevrotain.Token {}
    export class RequiredTok extends chevrotain.Token {}
    export class KeyTok extends chevrotain.Token {}
    export class ElementTok extends chevrotain.Token {}

    export var atLeastOneRule = new gast.Rule("atLeastOneRule", [
        new gast.RepetitionMandatory([
            new gast.RepetitionMandatory([
                new gast.RepetitionMandatory([], 3),
                new gast.Terminal(CommaTok)
            ], 2),
            new gast.Terminal(DotTok, 1)
        ]),
        new gast.Terminal(DotTok, 2)
    ])

    export var qualifiedName = new gast.Rule("qualifiedName", [
        new gast.Terminal(IdentTok),
        new gast.Repetition([
            new gast.Terminal(DotTok),
            new gast.Terminal(IdentTok, 2)
        ])
    ])

    export var paramSpec = new gast.Rule("paramSpec", [
        new gast.Terminal(IdentTok),
        new gast.Terminal(ColonTok),
        new gast.NonTerminal("qualifiedName", qualifiedName),
        new gast.Option([
            new gast.Terminal(LSquareTok),
            new gast.Terminal(RSquareTok)
        ])
    ])

    export var actionDec = new gast.Rule("actionDec", [
        new gast.Terminal(ActionTok),
        new gast.Terminal(IdentTok),
        new gast.Terminal(LParenTok),
        new gast.Option([
            new gast.NonTerminal("paramSpec", paramSpec),
            new gast.Repetition([
                new gast.Terminal(CommaTok),
                new gast.NonTerminal("paramSpec", paramSpec, 2)
            ])
        ]),
        new gast.Terminal(RParenTok),
        new gast.Option([
            new gast.Terminal(ColonTok),
            new gast.NonTerminal("qualifiedName", qualifiedName)
        ], 2),
        new gast.Terminal(SemicolonTok)
    ])

    export var manyActions = new gast.Rule("manyActions", [
        new gast.Repetition([
            new gast.NonTerminal("actionDec", actionDec, 1)
        ])
    ])

    export var cardinality = new gast.Rule("cardinality", [
        new gast.Terminal(LSquareTok),
        new gast.Terminal(UnsignedIntegerLiteralTok),
        new gast.Terminal(DotDotTok),
        new gast.Alternation([
            new gast.Terminal(UnsignedIntegerLiteralTok, 2),
            new gast.Terminal(AsteriskTok)
        ]),
        new gast.Terminal(RSquareTok)
    ])

    export var assignedTypeSpec = new gast.Rule("assignedTypeSpec", [
        new gast.Terminal(ColonTok),
        new gast.NonTerminal("assignedType"),

        new gast.Option([
            new gast.NonTerminal("enumClause")
        ]),

        new gast.Option([
            new gast.Terminal(DefaultTok),
            new gast.NonTerminal("expression")
        ], 2)
    ])

    export var lotsOfOrs = new gast.Rule("lotsOfOrs", [
        new gast.Option([
            new gast.Alternation([
                new gast.Flat([
                    new gast.Alternation([
                        new gast.Terminal(CommaTok, 1),
                        new gast.Terminal(KeyTok, 1)
                    ], 2)
                ]),
                new gast.Terminal(EntityTok, 1)
            ]),
            new gast.Alternation([
                new gast.Terminal(DotTok, 1),
            ], 3)
        ]),
    ])

}
