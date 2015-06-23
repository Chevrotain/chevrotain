/// <reference path="../../../src/scan/tokens.ts" />
/// <reference path="../../../src/parse/grammar/gast.ts" />

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

    export var atLeastOneRule = new gast.TOP_LEVEL("atLeastOneRule", [
        new gast.AT_LEAST_ONE([
            new gast.AT_LEAST_ONE([
                new gast.AT_LEAST_ONE([], 3),
                new gast.Terminal(CommaTok)
            ], 2),
            new gast.Terminal(DotTok, 1)
        ]),
        new gast.Terminal(DotTok, 2)
    ])

    export var qualifiedName = new gast.TOP_LEVEL("qualifiedName", [
        new gast.Terminal(IdentTok),
        new gast.MANY([
            new gast.Terminal(DotTok),
            new gast.Terminal(IdentTok, 2)
        ])
    ])

    export var paramSpec = new gast.TOP_LEVEL("paramSpec", [
        new gast.Terminal(IdentTok),
        new gast.Terminal(ColonTok),
        new gast.ProdRef("qualifiedName", qualifiedName),
        new gast.OPTION([
            new gast.Terminal(LSquareTok),
            new gast.Terminal(RSquareTok)
        ])
    ])

    export var actionDec = new gast.TOP_LEVEL("actionDec", [
        new gast.Terminal(ActionTok),
        new gast.Terminal(IdentTok),
        new gast.Terminal(LParenTok),
        new gast.OPTION([
            new gast.ProdRef("paramSpec", paramSpec),
            new gast.MANY([
                new gast.Terminal(CommaTok),
                new gast.ProdRef("paramSpec", paramSpec, 2)
            ])
        ]),
        new gast.Terminal(RParenTok),
        new gast.OPTION([
            new gast.Terminal(ColonTok),
            new gast.ProdRef("qualifiedName", qualifiedName)
        ], 2),
        new gast.Terminal(SemicolonTok)
    ])

    export var manyActions = new gast.TOP_LEVEL("manyActions", [
        new gast.MANY([
            new gast.ProdRef("actionDec", actionDec, 1)
        ])
    ])

    export var cardinality = new gast.TOP_LEVEL("cardinality", [
        new gast.Terminal(LSquareTok),
        new gast.Terminal(UnsignedIntegerLiteralTok),
        new gast.Terminal(DotDotTok),
        new gast.OR([
            new gast.Terminal(UnsignedIntegerLiteralTok, 2),
            new gast.Terminal(AsteriskTok)
        ]),
        new gast.Terminal(RSquareTok)
    ])

    export var assignedTypeSpec = new gast.TOP_LEVEL("assignedTypeSpec", [
        new gast.Terminal(ColonTok),
        new gast.ProdRef("assignedType"),

        new gast.OPTION([
            new gast.ProdRef("enumClause")
        ]),

        new gast.OPTION([
            new gast.Terminal(DefaultTok),
            new gast.ProdRef("expression")
        ], 2)
    ])

    export var lotsOfOrs = new gast.TOP_LEVEL("lotsOfOrs", [
        new gast.OPTION([
            new gast.OR([
                new gast.FLAT([
                    new gast.OR([
                        new gast.Terminal(CommaTok, 1),
                        new gast.Terminal(KeyTok, 1)
                    ], 2)
                ]),
                new gast.Terminal(EntityTok, 1)
            ]),
            new gast.OR([
                new gast.Terminal(DotTok, 1),
            ], 3)
        ]),
    ])

}
