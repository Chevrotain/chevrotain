module chevrotain.gastBuilder.spec {

    import r = chevrotain.range
    import b = chevrotain.gastBuilder
    import tok = specs.samples
    import matchers = specs.matchers
    import lang = chevrotain.lang

    describe("The GAst Builder module", function () {
        "use strict"

        var typeDefText = "// parse\r\n" +
            "            var typeKw = this.CONSUME1(tok.TypeTok)\r\n" +
            "            var typeName = this.CONSUME1(tok.IdentTok)\r\n" +
            "            var typeSpec = this.OR([\r\n" +
            "                {WHEN: this.isStructType, THEN_DO: ()=> {\r\n" +
            "                    var structType = this.SUBRULE(this.structuredType)\r\n" +
            "                    this.OPTION(()=> {return this.NEXT_TOKEN() instanceof tok.SemicolonTok}, ()=> {\r\n" +
            "                        semiColon = this.CONSUME1(tok.SemicolonTok)\r\n" +
            "                    })\r\n" +
            "                    return structType\r\n" +
            "                }},\r\n" +
            "                {WHEN: this.isAssignedTypeSpec, THEN_DO: ()=> {\r\n" +
            "                    var assTypeSpec = this.SUBRULE(this.assignedTypeSpec)\r\n" +
            "                    semiColon = this.CONSUME2(tok.SemicolonTok)\r\n" +
            "                    return assTypeSpec\r\n" +
            "                }}\r\n" +
            "            ], \"StructuredType or AssignedTypeSpec\").tree"

        var elementDefText = "this.OPTION(this.isRequiredKw, ()=> {\r\n" +
            "                requiredKW = this.CONSUME1(tok.RequiredTok)\r\n" +
            "            })\r\n" +
            "            this.OPTION(this.isKeyKw, ()=> {\r\n" +
            "                keyKW = this.CONSUME1(tok.KeyTok)\r\n" +
            "            })\r\n" +
            "            var elementKW = this.CONSUME1(tok.ElementTok)\r\n" +
            "            var elementName = this.CONSUME1(tok.IdentTok)\r\n" +
            "\r\n" +
            "            var assTypeSpec = this.OR([\r\n" +
            "                {WHEN: this.isAssignedTypeSpec, THEN_DO: ()=> {\r\n" +
            "                    return this.SUBRULE(this.assignedTypeSpec)\r\n" +
            "                }},\r\n" +
            "                {WHEN: ()=> {return true}, THEN_DO: ()=> {\r\n" +
            "                    return this.SUBRULE(this.assignedTypeSpecImplicit)\r\n" +
            "                }}\r\n" +
            "            ], \"\").tree\r\n" +
            "\r\n" +
            "            var semiColon = this.CONSUME1(tok.SemicolonTok)"

        var literalArrayText = "var lSquare = this.CONSUME1(tok.LSquareTok)\r\n" +
            "            arrValues.push(this.SUBRULE(this.expression))\r\n" +
            "            this.MANY(this.isAdditionalArgument, () => {\r\n" +
            "                    commas.push(this.CONSUME1(tok.CommaTok))\r\n" +
            "                    arrValues.push(this.SUBRULE2(this.expression))\r\n" +
            "                }\r\n" +
            "            )\r\n" +
            "            var rSquare = this.CONSUME1(tok.RSquareTok)"


        it("can extract Terminals IPRODRanges from a text", function () {
            var actual = b.createTerminalRanges(typeDefText)
            expect(actual.length).to.equal(4)
            var terminalTypes = _.map(actual, (rangeProd) => { return rangeProd.type})
            expect(_.uniq(terminalTypes).length).to.equal(1)
            expect(terminalTypes[0]).to.equal(b.ProdType.TERMINAL)

            var terminalTexts = _.map(actual, (rangeProd) => { return rangeProd.text})
            expect(terminalTexts[0]).to.equal(".CONSUME1(tok.TypeTok")
            expect(terminalTexts[1]).to.equal(".CONSUME1(tok.IdentTok")
            expect(terminalTexts[2]).to.equal(".CONSUME1(tok.SemicolonTok")
            expect(terminalTexts[3]).to.equal(".CONSUME2(tok.SemicolonTok")
        })

        it("can extract SubRule references IPRODRanges from a text", function () {
            var actual = b.createRefsRanges(typeDefText)
            expect(actual.length).to.equal(2)
            var refTypes = _.map(actual, (rangeProd) => { return rangeProd.type})
            expect(_.uniq(refTypes).length).to.equal(1)
            expect(refTypes[0]).to.equal(b.ProdType.REF)

            var refText = _.map(actual, (rangeProd) => { return rangeProd.text})
            expect(refText[0]).to.equal(".SUBRULE(this.structuredType")
            expect(refText[1]).to.equal(".SUBRULE(this.assignedTypeSpec")
        })

        it("can extract Option IPRODRanges from a text", function () {
            var actual = b.createOptionRanges(elementDefText)
            expect(actual.length).to.equal(2)
            var refTypes = _.map(actual, (rangeProd) => { return rangeProd.type})
            expect(_.uniq(refTypes).length).to.equal(1)
            expect(refTypes[0]).to.equal(b.ProdType.OPTION)

            var refText = _.map(actual, (rangeProd) => { return rangeProd.text})
            expect(refText[0]).to.equal(".OPTION(this.isRequiredKw, ()=> {\r\n" +
                "                requiredKW = this.CONSUME1(tok.RequiredTok)\r\n" +
                "            })")
            expect(refText[1]).to.equal(".OPTION(this.isKeyKw, ()=> {\r\n" +
                "                keyKW = this.CONSUME1(tok.KeyTok)\r\n" +
                "            })")
        })

        it("can extract 'at least one' IPRODRanges from a text", function () {
            var actual = b.createAtLeastOneRanges("this.MANY(...) this.AT_LEAST_ONE(bamba) this.AT_LEAST_ONE(THIS.OPTION(bisli))")
            expect(actual.length).to.equal(2)
            var refTypes = _.map(actual, (rangeProd) => { return rangeProd.type})
            expect(_.uniq(refTypes).length).to.equal(1)
            expect(refTypes[0]).to.equal(b.ProdType.AT_LEAST_ONE)

            var refText = _.map(actual, (rangeProd) => { return rangeProd.text})
            expect(refText[0]).to.equal(".AT_LEAST_ONE(bamba)")
            expect(refText[1]).to.equal(".AT_LEAST_ONE(THIS.OPTION(bisli))")
        })

        it("can extract 'many' IPRODRanges from a text", function () {
            var actual = b.createManyRanges(literalArrayText)
            expect(actual.length).to.equal(1)
            var refTypes = _.map(actual, (rangeProd) => { return rangeProd.type})
            expect(_.uniq(refTypes).length).to.equal(1)
            expect(refTypes[0]).to.equal(b.ProdType.MANY)

            var refText = _.map(actual, (rangeProd) => { return rangeProd.text})
            expect(refText[0]).to.equal(".MANY(this.isAdditionalArgument, () => {\r\n" +
                "                    commas.push(this.CONSUME1(tok.CommaTok))\r\n" +
                "                    arrValues.push(this.SUBRULE2(this.expression))\r\n" +
                "                }\r\n" +
                "            )")
        })

        it("can extract 'or' IPRODRanges from a text", function () {
            var actual = b.createOrRanges(elementDefText)
            // 1 or range + 2 orPart ranges (flat ranges)
            expect(actual.length).to.equal(3)
            var refTypes = _.map(actual, (rangeProd) => { return rangeProd.type})
            expect(_.uniq(refTypes).length).to.equal(2)
            matchers.arrayEqualityNoOrder(_.uniq(refTypes), [b.ProdType.OR, b.ProdType.FLAT])

            var refText = _.map(actual, (rangeProd) => { return rangeProd.text})
            expect(refText[0]).to.equal(".OR([\r\n" +
                "                {WHEN: this.isAssignedTypeSpec, THEN_DO: ()=> {\r\n" +
                "                    return this.SUBRULE(this.assignedTypeSpec)\r\n" +
                "                }},\r\n" +
                "                {WHEN: ()=> {return true}, THEN_DO: ()=> {\r\n" +
                "                    return this.SUBRULE(this.assignedTypeSpecImplicit)\r\n" +
                "                }}\r\n" +
                "            ], \"\")")
        })

        it("can extract all IPRODRanges from a text", function () {
            var ter = ".CONSUME3(tok.one1"
            var option = ".OPTION(2)"
            var many = ".MANY(3)"
            var ref = ".SUBRULE4(this.other"
            var atLeastOne = ".AT_LEAST_ONE(5)"
            var or = ".OR(6)"

            var actual = b.createRanges(
                ter + ") " +
                option +
                many +
                ref + ") " +
                atLeastOne +
                or)

            expect(actual.length).to.equal(6)
            var refTypes = _.map(actual, (rangeProd) => { return rangeProd.type})
            expect(_.uniq(refTypes).length).to.equal(6)

            var refText = _.map(actual, (rangeProd) => { return rangeProd.text})
            matchers.arrayEqualityNoOrder(refText, [ter, option, many, ref, atLeastOne, or])
        })

        it("has a utility function that can remove comments(single line and multiline) from texts", function () {
            var input = "// single line comment" +
                "\nhello" +
                "/* multi line comment \n" +
                "* blah blah blah" +
                "*/" +
                " world" +
                "// another single line!"

            var actual = b.removeComments(input)
            expect(actual).to.equal("\nhello world")
        })

        it("can detect missing closing parenthesis in a string", function () {
            var input = " ((()))" // the input is assumed to start right after an opening parenthesis
            expect(() => b.findClosingOffset("(", ")", 0, input)).to.throw("INVALID INPUT TEXT, UNTERMINATED PARENTHESIS")
        })

        it("can find the direct 'childs' of another Production from an IProd representation", function () {
            var allProdRanges:b.IProdRange[] = [
                {range: new r.Range(1, 10), text: "1.1", type: b.ProdType.TERMINAL},
                {range: new r.Range(11, 200), text: "1.2", type: b.ProdType.OR},
                {range: new r.Range(20, 180), text: "1.2.1", type: b.ProdType.MANY},
                {range: new r.Range(30, 100), text: "1.2.1.1", type: b.ProdType.TERMINAL},
                {range: new r.Range(101, 170), text: "1.2.1.2", type: b.ProdType.TERMINAL},
                {range: new r.Range(181, 190), text: "1.2.2", type: b.ProdType.TERMINAL},
                {range: new r.Range(201, 209), text: "1.3", type: b.ProdType.TERMINAL}
            ]

            var topRange = b.getDirectlyContainedRanges(new r.Range(0, 210), allProdRanges)
            expect(topRange.length).to.equal(3)
            expect(topRange[0].text).to.equal("1.1")
            expect(topRange[1].text).to.equal("1.2")
            expect(topRange[2].text).to.equal("1.3")


            var orRange = b.getDirectlyContainedRanges(new r.Range(11, 200), allProdRanges)
            expect(orRange.length).to.equal(2)
            expect(orRange[0].text).to.equal("1.2.1")
            expect(orRange[1].text).to.equal("1.2.2")

            var manyRange = b.getDirectlyContainedRanges(new r.Range(20, 180), allProdRanges)
            expect(manyRange.length).to.equal(2)
            expect(manyRange[0].text).to.equal("1.2.1.1")
            expect(manyRange[1].text).to.equal("1.2.1.2")
        })

        it("can build a Terminal Production from a RangeProd", function () {
            b.terminalNameToConstructor = <any>tok
            var actual = b.buildProdGast({
                range: new r.Range(1, 2),
                text:  "this.CONSUME2(tok.IdentTok)",
                type:  b.ProdType.TERMINAL
            }, [])
            expect(actual).to.be.an.instanceof(gast.Terminal)
            expect((<gast.Terminal>actual).occurrenceInParent).to.equal(2)
            expect((<gast.Terminal>actual).terminalType).to.equal(tok.IdentTok)
        })

        it("will fail building a terminal if it cannot find it's constructor", function () {
            b.terminalNameToConstructor = {}
            var buildMissingTerminal = () => b.buildProdGast({
                range: new r.Range(1, 2),
                text:  "this.CONSUME2(tok.IdentTok)",
                type:  b.ProdType.TERMINAL
            }, [])

            expect(buildMissingTerminal).to.throw("Terminal Token name: " + "IdentTok" + " not found")
        })

        it("can build a Ref Production from a RangeProd", function () {
            var actual = b.buildProdGast({
                range: new r.Range(1, 2),
                text:  "this.SUBRULE(this.bamba(1))",
                type:  b.ProdType.REF
            }, [])
            expect(actual).to.be.an.instanceof(gast.NonTerminal)
            expect((<gast.NonTerminal>actual).occurrenceInParent).to.equal(1)
            expect((<gast.NonTerminal>actual).nonTerminalName).to.equal("bamba")
        })

        it("can build an OR Production from a RangeProd", function () {
            var actual = b.buildProdGast({range: new r.Range(1, 2), text: "this.OR(...)", type: b.ProdType.OR}, [])
            expect(actual).to.be.an.instanceof(gast.Alternation)
            expect((<gast.Alternation>actual).definition.length).to.equal(0)
        })

        it("can build a MANY Production from a RangeProd", function () {
            var actual = b.buildProdGast({range: new r.Range(1, 2), text: "this.MANY(...)", type: b.ProdType.MANY}, [])
            expect(actual).to.be.an.instanceof(gast.Repetition)
            expect((<gast.Repetition>actual).definition.length).to.equal(0)
        })

        it("can build an AT_LEAST_ONE Production from a RangeProd", function () {
            var actual = b.buildProdGast({
                range: new r.Range(1, 2),
                text:  "this.AT_LEAST_ONE(...)",
                type:  b.ProdType.AT_LEAST_ONE
            }, [])
            expect(actual).to.be.an.instanceof(gast.RepetitionMandatory)
            expect((<gast.RepetitionMandatory>actual).definition.length).to.equal(0)
        })

        it("can build an OPTION Production from a RangeProd", function () {
            var actual = b.buildProdGast({
                range: new r.Range(1, 2),
                text:  "this.OPTION(...)",
                type:  b.ProdType.OPTION
            }, [])
            expect(actual).to.be.an.instanceof(gast.Option)
            expect((<gast.Option>actual).definition.length).to.equal(0)
        })

        it("can build an OR Production from a RangeProd", function () {
            var actual = b.buildProdGast({range: new r.Range(1, 2), text: "this.OR(...)", type: b.ProdType.OR}, [])
            expect(actual).to.be.an.instanceof(gast.Alternation)
            expect((<gast.Alternation>actual).definition.length).to.equal(0)
        })

        it("can build The Gast representation of a literalArray Grammar Rule", function () {
            var actual = b.buildTopProduction(literalArrayText, "literalArray", <any>tok)
            expect(actual.name).to.equal("literalArray")
            expect(actual.orgText).to.equal(literalArrayText)
            var def = actual.definition
            expect(def.length).to.equal(4)
            expect(def[0]).to.be.an.instanceof(gast.Terminal)
            expect((<gast.Terminal>def[0]).occurrenceInParent).to.equal(1)
            expect((<gast.Terminal>def[0]).terminalType).to.equal(tok.LSquareTok)

            expect(def[1]).to.be.an.instanceof(gast.NonTerminal)
            expect((<gast.NonTerminal>def[1]).occurrenceInParent).to.equal(1)
            expect((<gast.NonTerminal>def[1]).nonTerminalName).to.equal("expression")

            expect(def[2]).to.be.an.instanceof(gast.Repetition)
            // -- MANY part begin
            var manyDef = (<gast.Repetition>def[2]).definition
            expect(manyDef.length).to.equal(2)

            expect(manyDef[0]).to.be.an.instanceof(gast.Terminal)
            expect((<gast.Terminal>manyDef[0]).occurrenceInParent).to.equal(1)
            expect((<gast.Terminal>manyDef[0]).terminalType).to.equal(tok.CommaTok)

            expect(manyDef[1]).to.be.an.instanceof(gast.NonTerminal)
            expect((<gast.NonTerminal>manyDef[1]).occurrenceInParent).to.equal(2)
            expect((<gast.NonTerminal>manyDef[1]).nonTerminalName).to.equal("expression")
            // -- MANY part end

            expect(def[3]).to.be.an.instanceof(gast.Terminal)
            expect((<gast.Terminal>def[3]).occurrenceInParent).to.equal(1)
            expect((<gast.Terminal>def[3]).terminalType).to.equal(tok.RSquareTok)
        })


        it("can build The Gast representation of an elementDefinition Grammar Rule", function () {
            var actual = b.buildTopProduction(elementDefText, "elementDef", <any>tok)
            expect(actual.orgText).to.equal(elementDefText)
            expect(actual.name).to.equal("elementDef")
            var def = actual.definition
            expect(def.length).to.equal(6)
            expect(def[0]).to.be.an.instanceof(gast.Option)
            var option1Def = (<gast.Option>def[0]).definition
            expect(option1Def.length).to.equal(1)
            expect(option1Def[0]).to.be.an.instanceof(gast.Terminal)
            expect((<gast.Terminal>option1Def[0]).occurrenceInParent).to.equal(1)
            expect((<gast.Terminal>option1Def[0]).terminalType).to.equal(tok.RequiredTok)

            expect(def[1]).to.be.an.instanceof(gast.Option)
            var option2Def = (<gast.Option>def[1]).definition
            expect(option2Def.length).to.equal(1)
            expect(option2Def[0]).to.be.an.instanceof(gast.Terminal)
            expect((<gast.Terminal>option2Def[0]).occurrenceInParent).to.equal(1)
            expect((<gast.Terminal>option2Def[0]).terminalType).to.equal(tok.KeyTok)

            expect(def[2]).to.be.an.instanceof(gast.Terminal)
            expect((<gast.Terminal>def[2]).occurrenceInParent).to.equal(1)
            expect((<gast.Terminal>def[2]).terminalType).to.equal(tok.ElementTok)

            expect(def[3]).to.be.an.instanceof(gast.Terminal)
            expect((<gast.Terminal>def[3]).occurrenceInParent).to.equal(1)
            expect((<gast.Terminal>def[3]).terminalType).to.equal(tok.IdentTok)

            expect(def[4]).to.be.an.instanceof(gast.Alternation)
            var orDef = (<gast.Alternation>def[4]).definition
            expect(orDef.length).to.equal(2)
            expect(orDef[0]).to.be.an.instanceof(gast.Flat)
            var orPartDef1 = (<gast.Flat>orDef[0]).definition
            expect(orPartDef1.length).to.equal(1)
            expect(orPartDef1[0]).to.be.an.instanceof(gast.NonTerminal)
            expect((<gast.NonTerminal>orPartDef1[0]).occurrenceInParent).to.equal(1)
            expect((<gast.NonTerminal>orPartDef1[0]).nonTerminalName).to.equal("assignedTypeSpec")

            expect(orDef[1]).to.be.an.instanceof(gast.Flat)
            var orPartDef2 = (<gast.Flat>orDef[1]).definition
            expect(orPartDef2.length).to.equal(1)
            expect(orPartDef2[0]).to.be.an.instanceof(gast.NonTerminal)
            expect((<gast.NonTerminal>orPartDef2[0]).occurrenceInParent).to.equal(1)
            expect((<gast.NonTerminal>orPartDef2[0]).nonTerminalName).to.equal("assignedTypeSpecImplicit")

            expect(def[5]).to.be.an.instanceof(gast.Terminal)
            expect((<gast.Terminal>def[5]).occurrenceInParent).to.equal(1)
            expect((<gast.Terminal>def[5]).terminalType).to.equal(tok.SemicolonTok)
        })


        it("can build nested OR grammar successfully", function () {

            var input = " var max = this.OR([\n\
                {WHEN: isExpression, THEN_DO: ()=> {\n\
                    this.OR([\n\
                            \n\
                        {WHEN: isAlias, THEN_DO: ()=> {\n\
                            return PT(this.CONSUME1(tok.ViaTok))\n\
                        }}\n\
                    ], 'Expression or Star Token')\n\
                }}\n\
            ], 'Expression or Star Token').tree "


            var orRanges = b.createOrRanges(input)
            expect(orRanges.length).to.equal(4)

            var allFlatRanges = _.filter(orRanges, (prodRange:b.IProdRange) => {
                return prodRange.type === b.ProdType.FLAT
            })
            expect(allFlatRanges.length).to.equal(2)

            var allOrRanges = _.filter(orRanges, (prodRange:b.IProdRange) => {
                return prodRange.type === b.ProdType.FLAT
            })
            expect(allOrRanges.length).to.equal(2)
        })
    })
}
