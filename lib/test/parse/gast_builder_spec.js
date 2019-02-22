"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var gastBuilder = require("../../src/parse/gast_builder");
var gast_builder_1 = require("../../src/parse/gast_builder");
var matchers_1 = require("../utils/matchers");
var range_1 = require("../../src/text/range");
var tok = require("./grammar/samples");
var samples_1 = require("./grammar/samples");
var utils_1 = require("../../src/utils/utils");
var gast_public_1 = require("../../src/parse/grammar/gast/gast_public");
describe("The GAst Builder namespace", function () {
    var typeDefText = "// parse\r\n" +
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
        '            ], "StructuredType or AssignedTypeSpec").tree';
    var elementDefText = "this.OPTION(this.isRequiredKw, ()=> {\r\n" +
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
        "            let semiColon = this.CONSUME1(SemicolonTok)";
    var literalArrayText = "let lSquare = this.CONSUME1(LSquareTok)\r\n" +
        "            arrValues.push(this.SUBRULE(this.expression))\r\n" +
        "            this.MANY(this.isAdditionalArgument, () => {\r\n" +
        "                    commas.push(this.CONSUME1(CommaTok))\r\n" +
        "                    arrValues.push(this.SUBRULE2(this.expression))\r\n" +
        "                }\r\n" +
        "            )\r\n" +
        "            let rSquare = this.CONSUME1(RSquareTok)";
    it("can extract Terminals IPRODRanges from a text", function () {
        var actual = gast_builder_1.createTerminalRanges(typeDefText);
        expect(actual.length).to.equal(4);
        var terminalTypes = utils_1.map(actual, function (rangeProd) {
            return rangeProd.type;
        });
        expect(utils_1.uniq(terminalTypes).length).to.equal(1);
        expect(terminalTypes[0]).to.equal(gast_builder_1.ProdType.TERMINAL);
        var terminalTexts = utils_1.map(actual, function (rangeProd) {
            return rangeProd.text;
        });
        expect(terminalTexts[0]).to.equal(".CONSUME1(TypeTok");
        expect(terminalTexts[1]).to.equal(".CONSUME1(IdentTok");
        expect(terminalTexts[2]).to.equal(".CONSUME1(SemicolonTok");
        expect(terminalTexts[3]).to.equal(".CONSUME2(SemicolonTok");
    });
    it("can extract SubRule references IPRODRanges from a text", function () {
        var actual = gast_builder_1.createRefsRanges(typeDefText);
        expect(actual.length).to.equal(2);
        var refTypes = utils_1.map(actual, function (rangeProd) {
            return rangeProd.type;
        });
        expect(utils_1.uniq(refTypes).length).to.equal(1);
        expect(refTypes[0]).to.equal(gast_builder_1.ProdType.REF);
        var refText = utils_1.map(actual, function (rangeProd) {
            return rangeProd.text;
        });
        expect(refText[0]).to.equal(".SUBRULE(this.structuredType");
        expect(refText[1]).to.equal(".SUBRULE(this.assignedTypeSpec");
    });
    it("can extract Option IPRODRanges from a text", function () {
        var actual = gast_builder_1.createOptionRanges(elementDefText);
        expect(actual.length).to.equal(2);
        var refTypes = utils_1.map(actual, function (rangeProd) {
            return rangeProd.type;
        });
        expect(utils_1.uniq(refTypes).length).to.equal(1);
        expect(refTypes[0]).to.equal(gast_builder_1.ProdType.OPTION);
        var refText = utils_1.map(actual, function (rangeProd) {
            return rangeProd.text;
        });
        expect(refText[0]).to.equal(".OPTION(this.isRequiredKw, ()=> {\r\n" +
            "                requiredKW = this.CONSUME1(RequiredTok)\r\n" +
            "            })");
        expect(refText[1]).to.equal(".OPTION(this.isKeyKw, ()=> {\r\n" +
            "                keyKW = this.CONSUME1(KeyTok)\r\n" +
            "            })");
    });
    it("can extract 'at least one' IPRODRanges from a text", function () {
        var actual = gast_builder_1.createAtLeastOneRanges("this.MANY(...) this.AT_LEAST_ONE(bamba) this.AT_LEAST_ONE(THIS.OPTION(bisli))");
        expect(actual.length).to.equal(2);
        var refTypes = utils_1.map(actual, function (rangeProd) {
            return rangeProd.type;
        });
        expect(utils_1.uniq(refTypes).length).to.equal(1);
        expect(refTypes[0]).to.equal(gast_builder_1.ProdType.AT_LEAST_ONE);
        var refText = utils_1.map(actual, function (rangeProd) {
            return rangeProd.text;
        });
        expect(refText[0]).to.equal(".AT_LEAST_ONE(bamba)");
        expect(refText[1]).to.equal(".AT_LEAST_ONE(THIS.OPTION(bisli))");
    });
    it("can extract 'many' IPRODRanges from a text", function () {
        var actual = gast_builder_1.createManyRanges(literalArrayText);
        expect(actual.length).to.equal(1);
        var refTypes = utils_1.map(actual, function (rangeProd) {
            return rangeProd.type;
        });
        expect(utils_1.uniq(refTypes).length).to.equal(1);
        expect(refTypes[0]).to.equal(gast_builder_1.ProdType.MANY);
        var refText = utils_1.map(actual, function (rangeProd) {
            return rangeProd.text;
        });
        expect(refText[0]).to.equal(".MANY(this.isAdditionalArgument, () => {\r\n" +
            "                    commas.push(this.CONSUME1(CommaTok))\r\n" +
            "                    arrValues.push(this.SUBRULE2(this.expression))\r\n" +
            "                }\r\n" +
            "            )");
    });
    it("can extract 'or' IPRODRanges from a text", function () {
        var actual = gast_builder_1.createOrRanges(elementDefText);
        // 1 or range + 2 orPart ranges (flat ranges)
        expect(actual.length).to.equal(3);
        var refTypes = utils_1.map(actual, function (rangeProd) {
            return rangeProd.type;
        });
        expect(utils_1.uniq(refTypes).length).to.equal(2);
        matchers_1.setEquality(utils_1.uniq(refTypes), [gast_builder_1.ProdType.OR, gast_builder_1.ProdType.FLAT]);
        var refText = utils_1.map(actual, function (rangeProd) {
            return rangeProd.text;
        });
        expect(refText[0]).to.equal(".OR([\r\n" +
            "                {GATE: this.isAssignedTypeSpec, ALT: ()=> {\r\n" +
            "                    return this.SUBRULE(this.assignedTypeSpec)\r\n" +
            "                }},\r\n" +
            "                {GATE: ()=> {return true}, ALT: ()=> {\r\n" +
            "                    return this.SUBRULE(this.assignedTypeSpecImplicit)\r\n" +
            "                }}\r\n" +
            '            ], "")');
    });
    it("can extract all IPRODRanges from a text", function () {
        var ter = ".CONSUME3(one1";
        var option = ".OPTION(2)";
        var many = ".MANY(3)";
        var many_sep = ".MANY_SEP({SEP:Comma,)";
        var at_least_one_sep = ".AT_LEAST_ONE_SEP({SEP:Comma,)";
        var ref = ".SUBRULE5(this.other";
        var atLeastOne = ".AT_LEAST_ONE(6)";
        var or = ".OR(7)";
        var actual = gast_builder_1.createRanges(ter +
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
            or);
        expect(actual.length).to.equal(8);
        var refTypes = utils_1.map(actual, function (rangeProd) {
            return rangeProd.type;
        });
        expect(utils_1.uniq(refTypes).length).to.equal(8);
        var refText = utils_1.map(actual, function (rangeProd) {
            return rangeProd.text;
        });
        matchers_1.setEquality(refText, [
            ter,
            option,
            many,
            many_sep,
            ref,
            at_least_one_sep,
            atLeastOne,
            or
        ]);
    });
    it("has a utility function that can remove comments(single line and multiline) from texts", function () {
        var input = "// single line comment" +
            "\nhello" +
            "/* multi line comment \n" +
            "* blah blah blah" +
            "*/" +
            " world" +
            "// another single line!";
        var actual = gast_builder_1.removeComments(input);
        expect(actual).to.equal("\nhello world");
    });
    context("has a utility function that can remove string literals from texts", function () {
        it("simple flow", function () {
            var input = "'single quotes string'" +
                "\nhello" +
                '""' +
                '"double quotes string"' +
                " world" +
                "'bam\\'ba\"\"'";
            var actual = gast_builder_1.removeStringLiterals(input);
            expect(actual).to.equal("\nhello world");
        });
        it("won't get suck in infinite loop", function () {
            var input = '   throw new TypeError(`Type hint "${typeHintName}" dosen\'t match real type`);aaaaaa\n' +
                "return aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            var actual = gast_builder_1.removeStringLiterals(input);
        });
    });
    it("can detect missing closing parenthesis in a string", function () {
        var input = " ((()))"; // the input is assumed to start right after an opening parenthesis
        expect(function () { return gast_builder_1.findClosingOffset("(", ")", 0, input); }).to.throw("INVALID INPUT TEXT, UNTERMINATED PARENTHESIS");
    });
    it("can find the direct 'childs' of another Production from an IProd representation", function () {
        var allProdRanges = [
            {
                range: new range_1.Range(1, 10),
                text: "1.1",
                type: gast_builder_1.ProdType.TERMINAL
            },
            {
                range: new range_1.Range(11, 200),
                text: "1.2",
                type: gast_builder_1.ProdType.OR
            },
            {
                range: new range_1.Range(20, 180),
                text: "1.2.1",
                type: gast_builder_1.ProdType.MANY
            },
            {
                range: new range_1.Range(30, 100),
                text: "1.2.1.1",
                type: gast_builder_1.ProdType.TERMINAL
            },
            {
                range: new range_1.Range(101, 170),
                text: "1.2.1.2",
                type: gast_builder_1.ProdType.TERMINAL
            },
            {
                range: new range_1.Range(181, 190),
                text: "1.2.2",
                type: gast_builder_1.ProdType.TERMINAL
            },
            {
                range: new range_1.Range(201, 209),
                text: "1.3",
                type: gast_builder_1.ProdType.TERMINAL
            }
        ];
        var topRange = gast_builder_1.getDirectlyContainedRanges(new range_1.Range(0, 210), allProdRanges);
        expect(topRange.length).to.equal(3);
        expect(topRange[0].text).to.equal("1.1");
        expect(topRange[1].text).to.equal("1.2");
        expect(topRange[2].text).to.equal("1.3");
        var orRange = gast_builder_1.getDirectlyContainedRanges(new range_1.Range(11, 200), allProdRanges);
        expect(orRange.length).to.equal(2);
        expect(orRange[0].text).to.equal("1.2.1");
        expect(orRange[1].text).to.equal("1.2.2");
        var manyRange = gast_builder_1.getDirectlyContainedRanges(new range_1.Range(20, 180), allProdRanges);
        expect(manyRange.length).to.equal(2);
        expect(manyRange[0].text).to.equal("1.2.1.1");
        expect(manyRange[1].text).to.equal("1.2.1.2");
    });
    it("can build a Terminal Production from a RangeProd", function () {
        ;
        gastBuilder.terminalNameToConstructor = tok;
        var actual = gast_builder_1.buildProdGast({
            range: new range_1.Range(1, 2),
            text: "this.CONSUME2(IdentTok)",
            type: gast_builder_1.ProdType.TERMINAL
        }, []);
        expect(actual).to.be.an.instanceof(gast_public_1.Terminal);
        expect(actual.idx).to.equal(2);
        expect(actual.terminalType).to.equal(samples_1.IdentTok);
    });
    it("will fail building a terminal if it cannot find it's constructor", function () {
        ;
        gastBuilder.terminalNameToConstructor = {};
        var buildMissingTerminal = function () {
            return gast_builder_1.buildProdGast({
                range: new range_1.Range(1, 2),
                text: "this.CONSUME2(IdentTok)",
                type: gast_builder_1.ProdType.TERMINAL
            }, []);
        };
        expect(buildMissingTerminal).to.throw("Terminal Token name: " + "IdentTok" + " not found");
    });
    it("can build a Ref Production from a RangeProd", function () {
        var actual = gast_builder_1.buildProdGast({
            range: new range_1.Range(1, 2),
            text: "this.SUBRULE(this.bamba(1))",
            type: gast_builder_1.ProdType.REF
        }, []);
        expect(actual).to.be.an.instanceof(gast_public_1.NonTerminal);
        expect(actual.idx).to.equal(0);
        expect(actual.nonTerminalName).to.equal("bamba");
    });
    it("can build an OR Production from a RangeProd", function () {
        var actual = gast_builder_1.buildProdGast({
            range: new range_1.Range(1, 2),
            text: "this.OR(...)",
            type: gast_builder_1.ProdType.OR
        }, []);
        expect(actual).to.be.an.instanceof(gast_public_1.Alternation);
        expect(actual.definition.length).to.equal(0);
    });
    it("can build a MANY Production from a RangeProd", function () {
        var actual = gast_builder_1.buildProdGast({
            range: new range_1.Range(1, 2),
            text: "this.MANY(...)",
            type: gast_builder_1.ProdType.MANY
        }, []);
        expect(actual).to.be.an.instanceof(gast_public_1.Repetition);
        expect(actual.definition.length).to.equal(0);
    });
    it("can build a MANY_SEP Production from a RangeProd", function () {
        // hack, using "toString" because it exists on plain js object as the "separator".
        var actual = gast_builder_1.buildProdGast({
            range: new range_1.Range(1, 2),
            text: "this.MANY_SEP({SEP:toString...)",
            type: gast_builder_1.ProdType.MANY_SEP
        }, []);
        expect(actual).to.be.an.instanceof(gast_public_1.RepetitionWithSeparator);
        expect(actual.definition.length).to.equal(0);
    });
    it("will fail when building a MANY_SEP Production from a RangeProd in the seperator is not known", function () {
        expect(function () {
            return gast_builder_1.buildProdGast({
                range: new range_1.Range(1, 2),
                text: "this.MANY_SEP({SEP: MISSING...)",
                type: gast_builder_1.ProdType.MANY_SEP
            }, []);
        }).to.throw("Separator Terminal Token name: MISSING not found");
    });
    it("can build an AT_LEAST_ONE Production from a RangeProd", function () {
        var actual = gast_builder_1.buildProdGast({
            range: new range_1.Range(1, 2),
            text: "this.AT_LEAST_ONE(...)",
            type: gast_builder_1.ProdType.AT_LEAST_ONE
        }, []);
        expect(actual).to.be.an.instanceof(gast_public_1.RepetitionMandatory);
        expect(actual.definition.length).to.equal(0);
    });
    it("can build an OPTION Production from a RangeProd", function () {
        var actual = gast_builder_1.buildProdGast({
            range: new range_1.Range(1, 2),
            text: "this.OPTION(...)",
            type: gast_builder_1.ProdType.OPTION
        }, []);
        expect(actual).to.be.an.instanceof(gast_public_1.Option);
        expect(actual.definition.length).to.equal(0);
    });
    it("can build an OR Production from a RangeProd", function () {
        var actual = gast_builder_1.buildProdGast({
            range: new range_1.Range(1, 2),
            text: "this.OR(...)",
            type: gast_builder_1.ProdType.OR
        }, []);
        expect(actual).to.be.an.instanceof(gast_public_1.Alternation);
        expect(actual.definition.length).to.equal(0);
    });
    it("can build The Gast representation of a literalArray Grammar Rule", function () {
        var actual = gast_builder_1.buildTopProduction(literalArrayText, "literalArray", (tok));
        expect(actual.name).to.equal("literalArray");
        expect(actual.orgText).to.equal(literalArrayText);
        var def = actual.definition;
        expect(def.length).to.equal(4);
        expect(def[0]).to.be.an.instanceof(gast_public_1.Terminal);
        expect(def[0].idx).to.equal(1);
        expect(def[0].terminalType).to.equal(samples_1.LSquareTok);
        expect(def[1]).to.be.an.instanceof(gast_public_1.NonTerminal);
        expect(def[1].idx).to.equal(0);
        expect(def[1].nonTerminalName).to.equal("expression");
        expect(def[2]).to.be.an.instanceof(gast_public_1.Repetition);
        // -- MANY part begin
        var manyDef = def[2].definition;
        expect(manyDef.length).to.equal(2);
        expect(manyDef[0]).to.be.an.instanceof(gast_public_1.Terminal);
        expect(manyDef[0].idx).to.equal(1);
        expect(manyDef[0].terminalType).to.equal(samples_1.CommaTok);
        expect(manyDef[1]).to.be.an.instanceof(gast_public_1.NonTerminal);
        expect(manyDef[1].idx).to.equal(2);
        expect(manyDef[1].nonTerminalName).to.equal("expression");
        // -- MANY part end
        expect(def[3]).to.be.an.instanceof(gast_public_1.Terminal);
        expect(def[3].idx).to.equal(1);
        expect(def[3].terminalType).to.equal(samples_1.RSquareTok);
    });
    it("can build The Gast representation of an elementDefinition Grammar Rule", function () {
        var actual = gast_builder_1.buildTopProduction(elementDefText, "elementDef", tok);
        expect(actual.orgText).to.equal(elementDefText);
        expect(actual.name).to.equal("elementDef");
        var def = actual.definition;
        expect(def.length).to.equal(6);
        expect(def[0]).to.be.an.instanceof(gast_public_1.Option);
        var option1Def = def[0].definition;
        expect(option1Def.length).to.equal(1);
        expect(option1Def[0]).to.be.an.instanceof(gast_public_1.Terminal);
        expect(option1Def[0].idx).to.equal(1);
        expect(option1Def[0].terminalType).to.equal(samples_1.RequiredTok);
        expect(def[1]).to.be.an.instanceof(gast_public_1.Option);
        var option2Def = def[1].definition;
        expect(option2Def.length).to.equal(1);
        expect(option2Def[0]).to.be.an.instanceof(gast_public_1.Terminal);
        expect(option2Def[0].idx).to.equal(1);
        expect(option2Def[0].terminalType).to.equal(samples_1.KeyTok);
        expect(def[2]).to.be.an.instanceof(gast_public_1.Terminal);
        expect(def[2].idx).to.equal(1);
        expect(def[2].terminalType).to.equal(samples_1.ElementTok);
        expect(def[3]).to.be.an.instanceof(gast_public_1.Terminal);
        expect(def[3].idx).to.equal(1);
        expect(def[3].terminalType).to.equal(samples_1.IdentTok);
        expect(def[4]).to.be.an.instanceof(gast_public_1.Alternation);
        var orDef = def[4].definition;
        expect(orDef.length).to.equal(2);
        expect(orDef[0]).to.be.an.instanceof(gast_public_1.Flat);
        var orPartDef1 = orDef[0].definition;
        expect(orPartDef1.length).to.equal(1);
        expect(orPartDef1[0]).to.be.an.instanceof(gast_public_1.NonTerminal);
        expect(orPartDef1[0].idx).to.equal(0);
        expect(orPartDef1[0].nonTerminalName).to.equal("assignedTypeSpec");
        expect(orDef[1]).to.be.an.instanceof(gast_public_1.Flat);
        var orPartDef2 = orDef[1].definition;
        expect(orPartDef2.length).to.equal(1);
        expect(orPartDef2[0]).to.be.an.instanceof(gast_public_1.NonTerminal);
        expect(orPartDef2[0].idx).to.equal(0);
        expect(orPartDef2[0].nonTerminalName).to.equal("assignedTypeSpecImplicit");
        expect(def[5]).to.be.an.instanceof(gast_public_1.Terminal);
        expect(def[5].idx).to.equal(1);
        expect(def[5].terminalType).to.equal(samples_1.SemicolonTok);
    });
    it("can build nested OR grammar successfully", function () {
        var input = " let max = this.OR([\n\
                {GATE: isExpression, ALT: ()=> {\n\
                    this.OR([\n\
                            \n\
                        {GATE: isAlias, ALT: ()=> {\n\
                            return PT(this.CONSUME1(ViaTok))\n\
                        }}\n\
                    ], 'Expression or Star Token')\n\
                }}\n\
            ], 'Expression or Star Token').tree ";
        var orRanges = gast_builder_1.createOrRanges(input);
        expect(orRanges.length).to.equal(4);
        var allFlatRanges = utils_1.filter(orRanges, function (prodRange) {
            return prodRange.type === gast_builder_1.ProdType.FLAT;
        });
        expect(allFlatRanges.length).to.equal(2);
        var allOrRanges = utils_1.filter(orRanges, function (prodRange) {
            return prodRange.type === gast_builder_1.ProdType.FLAT;
        });
        expect(allOrRanges.length).to.equal(2);
    });
    it("can serialize and deserialize an elementDefinition Grammar Rule", function () {
        var expected = [
            gast_builder_1.buildTopProduction(typeDefText, "typeDef", tok),
            gast_builder_1.buildTopProduction(literalArrayText, "literalArray", tok),
            gast_builder_1.buildTopProduction(elementDefText, "elementDef", tok)
        ];
        var actual = gast_builder_1.deserializeGrammar(gast_public_1.serializeGrammar(expected), tok);
        expect(expected).to.deep.equal(actual);
    });
});
//# sourceMappingURL=gast_builder_spec.js.map