import {CHILDREN, ParseTreeToken, PT, SYNTAX_BOX} from "../../pudu/parse_tree"
import {ISimpleTokenOrIToken, Parser} from "chevrotain"
import {
    allTokens,
    Colon,
    Comma,
    FalseLiteral,
    LCurly,
    LSquare,
    NullLiteral,
    NumberLiteral,
    RCurly,
    RSquare,
    StringLiteral,
    TrueLiteral
} from "./lexer"

export class ObjectPT extends ParseTreeToken {}
export class ObjectItemPT extends ParseTreeToken {}
export class ArrayPT extends ParseTreeToken {}
export class ValuePT extends ParseTreeToken {}


export class JsonParser extends Parser {

    constructor(input:ISimpleTokenOrIToken[]) {
        super(input, allTokens)
        Parser.performSelfAnalysis(this)
    }

    public object = this.RULE("object", () => {
        let lCurlyTok, rCurlyTok
        let objectItemPTs = [], commas

        lCurlyTok = this.CONSUME(LCurly)
        commas = this.MANY_SEP({SEP:Comma, DEF:() => {
            objectItemPTs.push(this.SUBRULE2(this.objectItem))
        }}).separators
        rCurlyTok = this.CONSUME(RCurly)

        return PT(ObjectPT, CHILDREN(objectItemPTs,
            SYNTAX_BOX([lCurlyTok].concat(commas, [rCurlyTok]))))
    })

    public objectItem = this.RULE("objectItem", () => {
        let stringLiteralTok, colonTok, valuePT

        stringLiteralTok = this.CONSUME(StringLiteral)
        colonTok = this.CONSUME(Colon)
        valuePT = this.SUBRULE(this.value)

        return PT(ObjectItemPT, CHILDREN(stringLiteralTok, valuePT,
            SYNTAX_BOX([colonTok])))
    })

    public array = this.RULE("array", () => {
        let lSquareTok, rSquareTok
        let valuePTs = [], commas

        lSquareTok = this.CONSUME(LSquare)
        commas = this.MANY_SEP({SEP:Comma, DEF:() => {
            valuePTs.push(this.SUBRULE(this.value))
        }}).separators
        rSquareTok = this.CONSUME(RSquare)

        return PT(ArrayPT, CHILDREN(valuePTs,
            SYNTAX_BOX([lSquareTok].concat(commas, [rSquareTok]))))
    })

    public value = this.RULE("value", () => {
        let valueChildPT = this.OR([
            {ALT: () => PT(this.CONSUME(StringLiteral))},
            {ALT: () => PT(this.CONSUME(NumberLiteral))},
            {ALT: () => this.SUBRULE(this.object)},
            {ALT: () => this.SUBRULE(this.array)},
            {ALT: () => PT(this.CONSUME(TrueLiteral))},
            {ALT: () => PT(this.CONSUME(FalseLiteral))},
            {ALT: () => PT(this.CONSUME(NullLiteral))}
        ])

        return PT(ValuePT, [valueChildPT])
    })
}
