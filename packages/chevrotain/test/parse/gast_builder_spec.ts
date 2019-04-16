import * as gastBuilder from "../../src/parse/gast_builder"
import {
    createTerminalRanges,
    ProdType,
    createRefsRanges,
    createOptionRanges,
    createAtLeastOneRanges,
    createManyRanges,
    createOrRanges,
    createRanges,
    removeComments,
    getDirectlyContainedRanges,
    removeStringLiterals,
    IProdRange,
    findClosingOffset,
    buildProdGast,
    buildTopProduction,
    deserializeGrammar
} from "../../src/parse/gast_builder"
import { setEquality } from "../utils/matchers"
import { Range } from "../../src/text/range"
import * as tok from "./grammar/samples"
import {
    IdentTok,
    LSquareTok,
    CommaTok,
    RSquareTok,
    RequiredTok,
    SemicolonTok,
    ElementTok,
    KeyTok
} from "./grammar/samples"
import { map, uniq, filter } from "../../src/utils/utils"
import {
    Alternation,
    Flat,
    NonTerminal,
    Option,
    Repetition,
    RepetitionMandatory,
    RepetitionWithSeparator,
    Terminal,
    serializeGrammar
} from "../../src/parse/grammar/gast/gast_public"

describe("The GAst Builder namespace", () => {
    let typeDefText =
        "// parse\r\n" +
        "            let typeKw = this.CONSUME1(TypeTok)\r\n" +
        "            let typeName = this.CONSUME1(IdentTok)\r\n" +
        "            let typeSpec = this.OR([\r\n" +
        "                {ALT: this.isStructType, ALT: ()=> {\r\n" +
        "                    let structType = this.SUBRULE(this.structuredType)\r\n" +
        "                    this.OPTION(()=> {return this.NEXT_TOKEN() instanceof SemicolonTok}, ()=> {\r\n" +
        "                        semiColon = this.CONSUME1(SemicolonTok)\r\n" +
        "                    })\r\n" +
        "                    return structType\r\n" +
        "                }},\r\n" +
        "                {ALT: this.isAssignedTypeSpec, ALT: ()=> {\r\n" +
        "                    let assTypeSpec = this.SUBRULE(this.assignedTypeSpec)\r\n" +
        "                    semiColon = this.CONSUME2(SemicolonTok)\r\n" +
        "                    return assTypeSpec\r\n" +
        "                }}\r\n" +
        '            ], "StructuredType or AssignedTypeSpec").tree'

    let elementDefText =
        "this.OPTION(this.isRequiredKw, ()=> {\r\n" +
        "                requiredKW = this.CONSUME1(RequiredTok)\r\n" +
        "            })\r\n" +
        "            this.OPTION(this.isKeyKw, ()=> {\r\n" +
        "                keyKW = this.CONSUME1(KeyTok)\r\n" +
        "            })\r\n" +
        "            let elementKW = this.CONSUME1(ElementTok)\r\n" +
        "            let elementName = this.CONSUME1(IdentTok)\r\n" +
        "\r\n" +
        "            let assTypeSpec = this.OR([\r\n" +
        "                {GATE: this.isAssignedTypeSpec, ALT: ()=> {\r\n" +
        "                    return this.SUBRULE(this.assignedTypeSpec)\r\n" +
        "                }},\r\n" +
        "                {GATE: ()=> {return true}, ALT: ()=> {\r\n" +
        "                    return this.SUBRULE(this.assignedTypeSpecImplicit)\r\n" +
        "                }}\r\n" +
        '            ], "").tree\r\n' +
        "\r\n" +
        "            let semiColon = this.CONSUME1(SemicolonTok)"

    let literalArrayText =
        "let lSquare = this.CONSUME1(LSquareTok)\r\n" +
        "            arrValues.push(this.SUBRULE(this.expression))\r\n" +
        "            this.MANY(this.isAdditionalArgument, () => {\r\n" +
        "                    commas.push(this.CONSUME1(CommaTok))\r\n" +
        "                    arrValues.push(this.SUBRULE2(this.expression))\r\n" +
        "                }\r\n" +
        "            )\r\n" +
        "            let rSquare = this.CONSUME1(RSquareTok)"

    it("can extract Terminals IPRODRanges from a text", () => {
        let actual = createTerminalRanges(typeDefText)
        expect(actual.length).to.equal(4)
        let terminalTypes = map(actual, rangeProd => {
            return rangeProd.type
        })
        expect(uniq(terminalTypes).length).to.equal(1)
        expect(terminalTypes[0]).to.equal(ProdType.TERMINAL)

        let terminalTexts = map(actual, rangeProd => {
            return rangeProd.text
        })
        expect(terminalTexts[0]).to.equal(".CONSUME1(TypeTok")
        expect(terminalTexts[1]).to.equal(".CONSUME1(IdentTok")
        expect(terminalTexts[2]).to.equal(".CONSUME1(SemicolonTok")
        expect(terminalTexts[3]).to.equal(".CONSUME2(SemicolonTok")
    })

    it("can extract SubRule references IPRODRanges from a text", () => {
        let actual = createRefsRanges(typeDefText)
        expect(actual.length).to.equal(2)
        let refTypes = map(actual, rangeProd => {
            return rangeProd.type
        })
        expect(uniq(refTypes).length).to.equal(1)
        expect(refTypes[0]).to.equal(ProdType.REF)

        let refText = map(actual, rangeProd => {
            return rangeProd.text
        })
        expect(refText[0]).to.equal(".SUBRULE(this.structuredType")
        expect(refText[1]).to.equal(".SUBRULE(this.assignedTypeSpec")
    })

    it("can extract Option IPRODRanges from a text", () => {
        let actual = createOptionRanges(elementDefText)
        expect(actual.length).to.equal(2)
        let refTypes = map(actual, rangeProd => {
            return rangeProd.type
        })
        expect(uniq(refTypes).length).to.equal(1)
        expect(refTypes[0]).to.equal(ProdType.OPTION)

        let refText = map(actual, rangeProd => {
            return rangeProd.text
        })
        expect(refText[0]).to.equal(
            ".OPTION(this.isRequiredKw, ()=> {\r\n" +
                "                requiredKW = this.CONSUME1(RequiredTok)\r\n" +
                "            })"
        )
        expect(refText[1]).to.equal(
            ".OPTION(this.isKeyKw, ()=> {\r\n" +
                "                keyKW = this.CONSUME1(KeyTok)\r\n" +
                "            })"
        )
    })

    it("can extract 'at least one' IPRODRanges from a text", () => {
        let actual = createAtLeastOneRanges(
            "this.MANY(...) this.AT_LEAST_ONE(bamba) this.AT_LEAST_ONE(THIS.OPTION(bisli))"
        )
        expect(actual.length).to.equal(2)
        let refTypes = map(actual, rangeProd => {
            return rangeProd.type
        })
        expect(uniq(refTypes).length).to.equal(1)
        expect(refTypes[0]).to.equal(ProdType.AT_LEAST_ONE)

        let refText = map(actual, rangeProd => {
            return rangeProd.text
        })
        expect(refText[0]).to.equal(".AT_LEAST_ONE(bamba)")
        expect(refText[1]).to.equal(".AT_LEAST_ONE(THIS.OPTION(bisli))")
    })

    it("can extract 'many' IPRODRanges from a text", () => {
        let actual = createManyRanges(literalArrayText)
        expect(actual.length).to.equal(1)
        let refTypes = map(actual, rangeProd => {
            return rangeProd.type
        })
        expect(uniq(refTypes).length).to.equal(1)
        expect(refTypes[0]).to.equal(ProdType.MANY)

        let refText = map(actual, rangeProd => {
            return rangeProd.text
        })
        expect(refText[0]).to.equal(
            ".MANY(this.isAdditionalArgument, () => {\r\n" +
                "                    commas.push(this.CONSUME1(CommaTok))\r\n" +
                "                    arrValues.push(this.SUBRULE2(this.expression))\r\n" +
                "                }\r\n" +
                "            )"
        )
    })

    it("can extract 'or' IPRODRanges from a text", () => {
        let actual = createOrRanges(elementDefText)
        // 1 or range + 2 orPart ranges (flat ranges)
        expect(actual.length).to.equal(3)
        let refTypes = map(actual, rangeProd => {
            return rangeProd.type
        })
        expect(uniq(refTypes).length).to.equal(2)
        setEquality(uniq(refTypes), [ProdType.OR, ProdType.FLAT])

        let refText = map(actual, rangeProd => {
            return rangeProd.text
        })
        expect(refText[0]).to.equal(
            ".OR([\r\n" +
                "                {GATE: this.isAssignedTypeSpec, ALT: ()=> {\r\n" +
                "                    return this.SUBRULE(this.assignedTypeSpec)\r\n" +
                "                }},\r\n" +
                "                {GATE: ()=> {return true}, ALT: ()=> {\r\n" +
                "                    return this.SUBRULE(this.assignedTypeSpecImplicit)\r\n" +
                "                }}\r\n" +
                '            ], "")'
        )
    })

    it("can extract all IPRODRanges from a text", () => {
        let ter = ".CONSUME3(one1"
        let option = ".OPTION(2)"
        let many = ".MANY(3)"
        let many_sep = ".MANY_SEP({SEP:Comma,)"
        let at_least_one_sep = ".AT_LEAST_ONE_SEP({SEP:Comma,)"
        let ref = ".SUBRULE5(this.other"
        let atLeastOne = ".AT_LEAST_ONE(6)"
        let or = ".OR(7)"

        let actual = createRanges(
            ter +
                ") " +
                option +
                many_sep +
                " " +
                at_least_one_sep +
                " " +
                many +
                ref +
                ") " +
                atLeastOne +
                or
        )

        expect(actual.length).to.equal(8)
        let refTypes = map(actual, rangeProd => {
            return rangeProd.type
        })
        expect(uniq(refTypes).length).to.equal(8)

        let refText = map(actual, rangeProd => {
            return rangeProd.text
        })
        setEquality(refText, [
            ter,
            option,
            many,
            many_sep,
            ref,
            at_least_one_sep,
            atLeastOne,
            or
        ])
    })

    it("has a utility function that can remove comments(single line and multiline) from texts", () => {
        let input =
            "// single line comment" +
            "\nhello" +
            "/* multi line comment \n" +
            "* blah blah blah" +
            "*/" +
            " world" +
            "// another single line!"

        let actual = removeComments(input)
        expect(actual).to.equal("\nhello world")
    })

    context(
        "has a utility function that can remove string literals from texts",
        () => {
            it("simple flow", () => {
                let input =
                    "'single quotes string'" +
                    "\nhello" +
                    '""' +
                    '"double quotes string"' +
                    " world" +
                    "'bam\\'ba\"\"'"

                let actual = removeStringLiterals(input)
                expect(actual).to.equal("\nhello world")
            })

            it("won't get suck in infinite loop", () => {
                let input =
                    '   throw new TypeError(`Type hint "${typeHintName}" dosen\'t match real type`);aaaaaa\n' +
                    "return aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

                let actual = removeStringLiterals(input)
            })
        }
    )

    it("can detect missing closing parenthesis in a string", () => {
        let input = " ((()))" // the input is assumed to start right after an opening parenthesis
        expect(() => findClosingOffset("(", ")", 0, input)).to.throw(
            "INVALID INPUT TEXT, UNTERMINATED PARENTHESIS"
        )
    })

    it("can find the direct 'childs' of another Production from an IProd representation", () => {
        let allProdRanges: IProdRange[] = [
            {
                range: new Range(1, 10),
                text: "1.1",
                type: ProdType.TERMINAL
            },
            {
                range: new Range(11, 200),
                text: "1.2",
                type: ProdType.OR
            },
            {
                range: new Range(20, 180),
                text: "1.2.1",
                type: ProdType.MANY
            },
            {
                range: new Range(30, 100),
                text: "1.2.1.1",
                type: ProdType.TERMINAL
            },
            {
                range: new Range(101, 170),
                text: "1.2.1.2",
                type: ProdType.TERMINAL
            },
            {
                range: new Range(181, 190),
                text: "1.2.2",
                type: ProdType.TERMINAL
            },
            {
                range: new Range(201, 209),
                text: "1.3",
                type: ProdType.TERMINAL
            }
        ]

        let topRange = getDirectlyContainedRanges(
            new Range(0, 210),
            allProdRanges
        )
        expect(topRange.length).to.equal(3)
        expect(topRange[0].text).to.equal("1.1")
        expect(topRange[1].text).to.equal("1.2")
        expect(topRange[2].text).to.equal("1.3")

        let orRange = getDirectlyContainedRanges(
            new Range(11, 200),
            allProdRanges
        )
        expect(orRange.length).to.equal(2)
        expect(orRange[0].text).to.equal("1.2.1")
        expect(orRange[1].text).to.equal("1.2.2")

        let manyRange = getDirectlyContainedRanges(
            new Range(20, 180),
            allProdRanges
        )
        expect(manyRange.length).to.equal(2)
        expect(manyRange[0].text).to.equal("1.2.1.1")
        expect(manyRange[1].text).to.equal("1.2.1.2")
    })

    it("can build a Terminal Production from a RangeProd", () => {
        ;(<any>gastBuilder).terminalNameToConstructor = <any>tok
        let actual = buildProdGast(
            {
                range: new Range(1, 2),
                text: "this.CONSUME2(IdentTok)",
                type: ProdType.TERMINAL
            },
            [],
            "someName"
        )
        expect(actual).to.be.an.instanceof(Terminal)
        expect((<Terminal>actual).idx).to.equal(2)
        expect((<Terminal>actual).terminalType).to.equal(IdentTok)
    })

    it("will fail building a terminal if it cannot find it's constructor", () => {
        ;(<any>gastBuilder).terminalNameToConstructor = {}
        let buildMissingTerminal = () =>
            buildProdGast(
                {
                    range: new Range(1, 2),
                    text: "this.CONSUME2(IdentTok)",
                    type: ProdType.TERMINAL
                },
                [],
                "someName"
            )

        expect(buildMissingTerminal).to.throw(
            "Terminal Token name: <IdentTok> not found in rule: <someName>"
        )
    })

    it("can build a Ref Production from a RangeProd", () => {
        let actual = buildProdGast(
            {
                range: new Range(1, 2),
                text: "this.SUBRULE(this.bamba(1))",
                type: ProdType.REF
            },
            [],
            "someName"
        )
        expect(actual).to.be.an.instanceof(NonTerminal)
        expect((<NonTerminal>actual).idx).to.equal(0)
        expect((<NonTerminal>actual).nonTerminalName).to.equal("bamba")
    })

    it("can build an OR Production from a RangeProd", () => {
        let actual = buildProdGast(
            {
                range: new Range(1, 2),
                text: "this.OR(...)",
                type: ProdType.OR
            },
            [],
            "someName"
        )
        expect(actual).to.be.an.instanceof(Alternation)
        expect((<Alternation>actual).definition.length).to.equal(0)
    })

    it("can build a MANY Production from a RangeProd", () => {
        let actual = buildProdGast(
            {
                range: new Range(1, 2),
                text: "this.MANY(...)",
                type: ProdType.MANY
            },
            [],
            "someName"
        )
        expect(actual).to.be.an.instanceof(Repetition)
        expect((<Repetition>actual).definition.length).to.equal(0)
    })

    it("can build a MANY_SEP Production from a RangeProd", () => {
        // hack, using "toString" because it exists on plain js object as the "separator".
        let actual = buildProdGast(
            {
                range: new Range(1, 2),
                text: "this.MANY_SEP({SEP:toString...)",
                type: ProdType.MANY_SEP
            },
            [],
            "someName"
        )
        expect(actual).to.be.an.instanceof(RepetitionWithSeparator)
        expect((<Repetition>actual).definition.length).to.equal(0)
    })

    it("will fail when building a MANY_SEP Production from a RangeProd in the seperator is not known", () => {
        expect(() =>
            buildProdGast(
                {
                    range: new Range(1, 2),
                    text: "this.MANY_SEP({SEP: MISSING...)",
                    type: ProdType.MANY_SEP
                },
                [],
                "someName"
            )
        ).to.throw("Separator Terminal Token name: MISSING not found")
    })

    it("can build an AT_LEAST_ONE Production from a RangeProd", () => {
        let actual = buildProdGast(
            {
                range: new Range(1, 2),
                text: "this.AT_LEAST_ONE(...)",
                type: ProdType.AT_LEAST_ONE
            },
            [],
            "someName"
        )
        expect(actual).to.be.an.instanceof(RepetitionMandatory)
        expect((<RepetitionMandatory>actual).definition.length).to.equal(0)
    })

    it("can build an OPTION Production from a RangeProd", () => {
        let actual = buildProdGast(
            {
                range: new Range(1, 2),
                text: "this.OPTION(...)",
                type: ProdType.OPTION
            },
            [],
            "someName"
        )
        expect(actual).to.be.an.instanceof(Option)
        expect((<Option>actual).definition.length).to.equal(0)
    })

    it("can build an OR Production from a RangeProd", () => {
        let actual = buildProdGast(
            {
                range: new Range(1, 2),
                text: "this.OR(...)",
                type: ProdType.OR
            },
            [],
            "someName"
        )
        expect(actual).to.be.an.instanceof(Alternation)
        expect((<Alternation>actual).definition.length).to.equal(0)
    })

    it("can build The Gast representation of a literalArray Grammar Rule", () => {
        let actual = buildTopProduction(literalArrayText, "literalArray", <any>(
            tok
        ))
        expect(actual.name).to.equal("literalArray")
        expect(actual.orgText).to.equal(literalArrayText)
        let def = actual.definition
        expect(def.length).to.equal(4)
        expect(def[0]).to.be.an.instanceof(Terminal)
        expect((<Terminal>def[0]).idx).to.equal(1)
        expect((<Terminal>def[0]).terminalType).to.equal(LSquareTok)

        expect(def[1]).to.be.an.instanceof(NonTerminal)
        expect((<NonTerminal>def[1]).idx).to.equal(0)
        expect((<NonTerminal>def[1]).nonTerminalName).to.equal("expression")

        expect(def[2]).to.be.an.instanceof(Repetition)
        // -- MANY part begin
        let manyDef = (<Repetition>def[2]).definition
        expect(manyDef.length).to.equal(2)

        expect(manyDef[0]).to.be.an.instanceof(Terminal)
        expect((<Terminal>manyDef[0]).idx).to.equal(1)
        expect((<Terminal>manyDef[0]).terminalType).to.equal(CommaTok)

        expect(manyDef[1]).to.be.an.instanceof(NonTerminal)
        expect((<NonTerminal>manyDef[1]).idx).to.equal(2)
        expect((<NonTerminal>manyDef[1]).nonTerminalName).to.equal("expression")
        // -- MANY part end

        expect(def[3]).to.be.an.instanceof(Terminal)
        expect((<Terminal>def[3]).idx).to.equal(1)
        expect((<Terminal>def[3]).terminalType).to.equal(RSquareTok)
    })

    it("can build The Gast representation of an elementDefinition Grammar Rule", () => {
        let actual = buildTopProduction(elementDefText, "elementDef", <any>tok)
        expect(actual.orgText).to.equal(elementDefText)
        expect(actual.name).to.equal("elementDef")
        let def = actual.definition
        expect(def.length).to.equal(6)
        expect(def[0]).to.be.an.instanceof(Option)
        let option1Def = (<Option>def[0]).definition
        expect(option1Def.length).to.equal(1)
        expect(option1Def[0]).to.be.an.instanceof(Terminal)
        expect((<Terminal>option1Def[0]).idx).to.equal(1)
        expect((<Terminal>option1Def[0]).terminalType).to.equal(RequiredTok)

        expect(def[1]).to.be.an.instanceof(Option)
        let option2Def = (<Option>def[1]).definition
        expect(option2Def.length).to.equal(1)
        expect(option2Def[0]).to.be.an.instanceof(Terminal)
        expect((<Terminal>option2Def[0]).idx).to.equal(1)
        expect((<Terminal>option2Def[0]).terminalType).to.equal(KeyTok)

        expect(def[2]).to.be.an.instanceof(Terminal)
        expect((<Terminal>def[2]).idx).to.equal(1)
        expect((<Terminal>def[2]).terminalType).to.equal(ElementTok)

        expect(def[3]).to.be.an.instanceof(Terminal)
        expect((<Terminal>def[3]).idx).to.equal(1)
        expect((<Terminal>def[3]).terminalType).to.equal(IdentTok)

        expect(def[4]).to.be.an.instanceof(Alternation)
        let orDef = (<Alternation>def[4]).definition
        expect(orDef.length).to.equal(2)
        expect(orDef[0]).to.be.an.instanceof(Flat)
        let orPartDef1 = (<Flat>orDef[0]).definition
        expect(orPartDef1.length).to.equal(1)
        expect(orPartDef1[0]).to.be.an.instanceof(NonTerminal)
        expect((<NonTerminal>orPartDef1[0]).idx).to.equal(0)
        expect((<NonTerminal>orPartDef1[0]).nonTerminalName).to.equal(
            "assignedTypeSpec"
        )

        expect(orDef[1]).to.be.an.instanceof(Flat)
        let orPartDef2 = (<Flat>orDef[1]).definition
        expect(orPartDef2.length).to.equal(1)
        expect(orPartDef2[0]).to.be.an.instanceof(NonTerminal)
        expect((<NonTerminal>orPartDef2[0]).idx).to.equal(0)
        expect((<NonTerminal>orPartDef2[0]).nonTerminalName).to.equal(
            "assignedTypeSpecImplicit"
        )

        expect(def[5]).to.be.an.instanceof(Terminal)
        expect((<Terminal>def[5]).idx).to.equal(1)
        expect((<Terminal>def[5]).terminalType).to.equal(SemicolonTok)
    })

    it("can build nested OR grammar successfully", () => {
        let input =
            " let max = this.OR([\n\
                {GATE: isExpression, ALT: ()=> {\n\
                    this.OR([\n\
                            \n\
                        {GATE: isAlias, ALT: ()=> {\n\
                            return PT(this.CONSUME1(ViaTok))\n\
                        }}\n\
                    ], 'Expression or Star Token')\n\
                }}\n\
            ], 'Expression or Star Token').tree "

        let orRanges = createOrRanges(input)
        expect(orRanges.length).to.equal(4)

        let allFlatRanges = filter(orRanges, (prodRange: IProdRange) => {
            return prodRange.type === ProdType.FLAT
        })
        expect(allFlatRanges.length).to.equal(2)

        let allOrRanges = filter(orRanges, (prodRange: IProdRange) => {
            return prodRange.type === ProdType.FLAT
        })
        expect(allOrRanges.length).to.equal(2)
    })

    it("can serialize and deserialize an elementDefinition Grammar Rule", () => {
        let expected = [
            buildTopProduction(typeDefText, "typeDef", <any>tok),
            buildTopProduction(literalArrayText, "literalArray", <any>tok),
            buildTopProduction(elementDefText, "elementDef", <any>tok)
        ]
        let actual = deserializeGrammar(serializeGrammar(expected), <any>tok)
        expect(expected).to.deep.equal(actual)
    })
})
