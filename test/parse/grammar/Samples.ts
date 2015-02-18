/// <reference path="../../../src/scan/Tokens.ts" />
/// <reference path="../../../src/parse/grammar/GAst.ts" />

module test.parser.grammar.samples {

    import t = chevrotain.scan.tokens;
    import gast = chevrotain.parse.grammar.gast;

    export class IdentTok extends t.Token {}
    export class DotTok extends t.Token {}
    export class DotDotTok extends t.Token {}
    export class ColonTok extends t.Token {}
    export class LSquareTok extends t.Token {}
    export class RSquareTok extends t.Token {}
    export class ActionTok extends t.Token {}
    export class LParenTok extends t.Token {}
    export class RParenTok extends t.Token {}
    export class CommaTok extends t.Token {}
    export class SemicolonTok extends t.Token {}
    export class UnsignedIntegerLiteralTok extends t.Token {}
    export class DefaultTok extends t.Token {}
    export class AsteriskTok extends t.Token {}
    export class EntityTok extends t.Token {}
    export class NamespaceTok extends t.Token {}
    export class TypeTok extends t.Token {}
    export class ConstTok extends t.Token {}
    export class RequiredTok extends t.Token {}
    export class KeyTok extends t.Token {}
    export class ElementTok extends t.Token {}

    export var qualifiedName = new gast.TOP_LEVEL('qualifiedName', [
        new gast.Terminal(IdentTok),
        new gast.MANY([
            new gast.Terminal(DotTok),
            new gast.Terminal(IdentTok, 2)
        ])
    ]);

    export var ParamSpec = new gast.TOP_LEVEL('ParamSpec', [
        new gast.Terminal(IdentTok),
        new gast.Terminal(ColonTok),
        new gast.ProdRef('qualifiedName', qualifiedName),
        new gast.OPTION([
            new gast.Terminal(LSquareTok),
            new gast.Terminal(RSquareTok)
        ])
    ]);

    export var actionDec = new gast.TOP_LEVEL('actionDec', [
        new gast.Terminal(ActionTok),
        new gast.Terminal(IdentTok),
        new gast.Terminal(LParenTok),
        new gast.OPTION([
            new gast.ProdRef('ParamSpec', ParamSpec),
            new gast.MANY([
                new gast.Terminal(CommaTok),
                new gast.ProdRef('ParamSpec', ParamSpec, 2)
            ])
        ]),
        new gast.Terminal(RParenTok),
        new gast.OPTION([
            new gast.Terminal(ColonTok),
            new gast.ProdRef('qualifiedName', qualifiedName)
        ]),
        new gast.Terminal(SemicolonTok)
    ]);

    export var cardinality = new gast.TOP_LEVEL('cardinality', [
        new gast.Terminal(LSquareTok),
        new gast.Terminal(UnsignedIntegerLiteralTok),
        new gast.Terminal(DotDotTok),
        new gast.OR([
            new gast.Terminal(UnsignedIntegerLiteralTok, 2),
            new gast.Terminal(AsteriskTok)
        ]),
        new gast.Terminal(RSquareTok)
    ]);

    export var assignedTypeSpec = new gast.TOP_LEVEL('assignedTypeSpec', [
        new gast.Terminal(ColonTok),
        new gast.ProdRef('assignedType', null),

        new gast.OPTION([
            new gast.ProdRef('enumClause', null)
        ]),

        new gast.OPTION([
            new gast.Terminal(DefaultTok),
            new gast.ProdRef('expression', null)
        ])
    ]);


}
