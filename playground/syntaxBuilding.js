/**
 * @param definitions {rdt.parse.grammar.gast.AbstractProduction[]}
 */
function definitionsToSubDiagrams(definitions) {
    "use strict";
    var subDiagrams = _.map(definitions, function (subProd) {
        return convertProductionToDiagram(subProd);
    });
    return subDiagrams;
}

/**
 * @param prod {rdt.parse.grammar.gast.IProduction}
 * @returns {*}
 */
function convertProductionToDiagram(prod) {

    if (prod instanceof chevrotain.gast.NonTerminal) {
        // must handle ProdRef separately from the other AbstractProductions as we do not want to expand the subDefinition
        // of a reference and cause infinite loops
        return NonTerminal(prod.nonTerminalName)
    }
    else if(!(prod instanceof chevrotain.gast.Terminal)){
        var subDiagrams = definitionsToSubDiagrams(prod.definition);
        if (prod instanceof chevrotain.gast.Rule) {
            return Diagram.apply(this, subDiagrams)
        }
        else if (prod instanceof chevrotain.gast.Flat) {
            return Sequence.apply(this, subDiagrams)
        }
        else if (prod instanceof chevrotain.gast.Option) {
            if (subDiagrams.length > 1) {
                return Optional(Sequence.apply(this, subDiagrams))
            }
            else if (subDiagrams.length === 1) {
                return Optional(_.first(subDiagrams))
            }
            else {
                throw new Error("Empty Optional production, WTF!")
            }
        }
        else if (prod instanceof chevrotain.gast.Repetition) {
            if (subDiagrams.length > 1) {
                return ZeroOrMore(Sequence.apply(this, subDiagrams))
            }
            else if (subDiagrams.length === 1) {
                return ZeroOrMore(_.first(subDiagrams))
            }
            else {
                throw new Error("Empty Optional production, WTF!")
            }
        }
        else if (prod instanceof chevrotain.gast.Alternation) {
            // what does the first argument of choice (the index 0 means?)
            return Choice.apply(this, _.flatten([0, subDiagrams]))
        }
        else if (prod instanceof chevrotain.gast.RepetitionMandatory) {
            if (subDiagrams.length > 1) {
                return OneOrMore(Sequence.apply(this, subDiagrams))
            }
            else if (subDiagrams.length === 1) {
                return OneOrMore(_.first(subDiagrams))
            }
            else {
                throw new Error("Empty Optional production, WTF!")
            }
        }

    }
    else if (prod instanceof chevrotain.gast.Terminal) {
        // we do not have the definition of the terminals inside the grammar, lets just use their names (IdentTok/IntegerTok...)
        return Terminal(prod.terminalType.PATTERN.source)
    }
    else {
        throw Error("non exhaustive match")
    }
}
//
////noinspection JSAccessibilityCheck
//var parserImpl = rdt.parse.parser.impl;
//var rdlParser = new parserImpl.RDLParser();
//var allProductions = parserImpl.RDLParser.RDL_GRAMMAR_PRODUCTIONS;
//var DDLRuleNames = parserImpl.DDLParser.partRulesNames;
//var PLRuleNames = parserImpl.PLParser.partRulesNames;
//var QLRuleNames = parserImpl.QLParser.partRulesNames;
//var ExpRuleNames = parserImpl.ExpressionsParser.partRulesNames;
//var navItems = { };
//var search = document.createElement("input");
//var diagramsDiv = document.getElementById("diagrams");
//var sidebar = document.getElementById("sidebar");
//
//
//function addDiagramsToPage(ruleNames, categoryName) {
//    diagramsDiv.innerHTML += "<h2><!--suppress HtmlDeprecatedTag --><u>" + categoryName + "</u></h2>";
//    sidebar.innerHTML += "<h2><!--suppress HtmlDeprecatedTag --><u>" + categoryName + "</u></h2>";
//    _.forEach(ruleNames, function (currRuleName) {
//        var currProduction = allProductions.get(currRuleName);
//        var currDiag = convertProductionToDiagram(currProduction);
//        var currDiagSvg = currDiag.toSVG();
//        var header = "<h3>" + currRuleName + ":</h3>";
//        var anchor = '<a name=' + currRuleName + '>' + header + '</a>';
//        sidebar.innerHTML += '<a href="#' + currRuleName + '"><h3>' + currRuleName + '</h3></a>';
//        diagramsDiv.innerHTML += anchor;
//        diagramsDiv.appendChild(currDiagSvg);
//    });
//    navItems[categoryName] = ruleNames;
//}
//
////noinspection JSAccessibilityCheck
//var tok = rdt.scan.tokens;
//
//function hasSpecialTerminalText(tokTypeName) {
//    return tok.TokTypeNameToPunctuation[tokTypeName] !== undefined;
//}
//
//function getSpecialTerminalText(tokTypeName) {
//    var punctuationImage = tok.TokTypeNameToPunctuation[tokTypeName];
//    if (punctuationImage) {
//        return punctuationImage;
//    }
//    else {
//        return tokTypeName;
//    }
//}
//
//addDiagramsToPage(DDLRuleNames, "DDL");
//addDiagramsToPage(PLRuleNames, "PL");
//addDiagramsToPage(ExpRuleNames, "Expressions");
//addDiagramsToPage(QLRuleNames, "QL");
//
//
