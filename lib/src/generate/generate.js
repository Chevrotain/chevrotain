"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../utils/utils");
var tokens_public_1 = require("../scan/tokens_public");
var gast_public_1 = require("../parse/grammar/gast/gast_public");
/**
 * Missing features
 * 1. Rule arguments
 * 2. Gates
 * 3. embedded actions
 */
var NL = "\n";
function genUmdModule(options) {
    return "\n(function (root, factory) {\n    if (typeof define === 'function' && define.amd) {\n        // AMD. Register as an anonymous module.\n        define(['chevrotain'], factory);\n    } else if (typeof module === 'object' && module.exports) {\n        // Node. Does not work with strict CommonJS, but\n        // only CommonJS-like environments that support module.exports,\n        // like Node.\n        module.exports = factory(require('chevrotain'));\n    } else {\n        // Browser globals (root is window)\n        root.returnExports = factory(root.b);\n    }\n}(typeof self !== 'undefined' ? self : this, function (chevrotain) {\n\n" + genClass(options) + "\n    \nreturn {\n    " + options.name + ": " + options.name + " \n}\n}));\n";
}
exports.genUmdModule = genUmdModule;
function genWrapperFunction(options) {
    return "    \n" + genClass(options) + "\nreturn new " + options.name + "(tokenVocabulary, config)    \n";
}
exports.genWrapperFunction = genWrapperFunction;
function genClass(options) {
    // TODO: how to pass the token vocabulary? Constructor? other?
    // TODO: should outputCst be enabled by default?
    var result = "\nfunction " + options.name + "(tokenVocabulary, config) {\n    // invoke super constructor\n    chevrotain.Parser.call(this, tokenVocabulary, config)\n\n    const $ = this\n\n    " + genAllRules(options.rules) + "\n\n    // very important to call this after all the rules have been defined.\n    // otherwise the parser may not work correctly as it will lack information\n    // derived during the self analysis phase.\n    this.performSelfAnalysis(this)\n}\n\n// inheritance as implemented in javascript in the previous decade... :(\n" + options.name + ".prototype = Object.create(chevrotain.Parser.prototype)\n" + options.name + ".prototype.constructor = " + options.name + "    \n    ";
    return result;
}
exports.genClass = genClass;
function genAllRules(rules) {
    var rulesText = utils_1.map(rules, function (currRule) {
        return genRule(currRule, 1);
    });
    return rulesText.join("\n");
}
exports.genAllRules = genAllRules;
function genRule(prod, n) {
    var result = indent(n, "$.RULE(\"" + prod.name + "\", function() {") + NL;
    result += genDefinition(prod.definition, n + 1);
    result += indent(n + 1, "})") + NL;
    return result;
}
exports.genRule = genRule;
function genTerminal(prod, n) {
    var name = tokens_public_1.tokenName(prod.terminalType);
    // TODO: potential performance optimization, avoid tokenMap Dictionary access
    return indent(n, "$.CONSUME" + prod.idx + "(this.tokensMap." + name + ")" + NL);
}
exports.genTerminal = genTerminal;
function genNonTerminal(prod, n) {
    return indent(n, "$.SUBRULE" + prod.idx + "($." + prod.nonTerminalName + ")" + NL);
}
exports.genNonTerminal = genNonTerminal;
function genAlternation(prod, n) {
    var result = indent(n, "$.OR" + prod.idx + "([") + NL;
    var alts = utils_1.map(prod.definition, function (altDef) { return genSingleAlt(altDef, n + 1); });
    result += alts.join("," + NL);
    result += NL + indent(n, "])" + NL);
    return result;
}
exports.genAlternation = genAlternation;
function genSingleAlt(prod, n) {
    var result = indent(n, "{") + NL;
    if (prod.name) {
        result += indent(n + 1, "NAME: \"" + prod.name + "\",") + NL;
    }
    result += indent(n + 1, "ALT: function() {") + NL;
    result += genDefinition(prod.definition, n + 1);
    result += indent(n + 1, "}") + NL;
    result += indent(n, "}");
    return result;
}
exports.genSingleAlt = genSingleAlt;
function genProd(prod, n) {
    /* istanbul ignore else */
    if (prod instanceof gast_public_1.NonTerminal) {
        return genNonTerminal(prod, n);
    }
    else if (prod instanceof gast_public_1.Option) {
        return genDSLRule("OPTION", prod, n);
    }
    else if (prod instanceof gast_public_1.RepetitionMandatory) {
        return genDSLRule("AT_LEAST_ONE", prod, n);
    }
    else if (prod instanceof gast_public_1.RepetitionMandatoryWithSeparator) {
        return genDSLRule("AT_LEAST_ONE_SEP", prod, n);
    }
    else if (prod instanceof gast_public_1.RepetitionWithSeparator) {
        return genDSLRule("MANY_SEP", prod, n);
    }
    else if (prod instanceof gast_public_1.Repetition) {
        return genDSLRule("MANY", prod, n);
    }
    else if (prod instanceof gast_public_1.Alternation) {
        return genAlternation(prod, n);
    }
    else if (prod instanceof gast_public_1.Terminal) {
        return genTerminal(prod, n);
    }
    else if (prod instanceof gast_public_1.Flat) {
        return genDefinition(prod.definition, n);
    }
    else {
        throw Error("non exhaustive match");
    }
}
function genDSLRule(dslName, prod, n) {
    var result = indent(n, "$." + (dslName + prod.idx) + "(");
    if (prod.name || prod.separator) {
        result += "{" + NL;
        if (prod.name) {
            result += indent(n + 1, "NAME: \"" + prod.name + "\"") + "," + NL;
        }
        if (prod.separator) {
            result +=
                indent(n + 1, "SEP: this.tokensMap." + tokens_public_1.tokenName(prod.separator)) +
                    "," +
                    NL;
        }
        result += "DEF: " + genDefFunction(prod.definition, n + 2) + NL;
        result += indent(n, "}") + NL;
    }
    else {
        result += genDefFunction(prod.definition, n + 1);
    }
    result += indent(n, ")") + NL;
    return result;
}
function genDefFunction(definition, n) {
    var def = "function() {" + NL;
    def += genDefinition(definition, n);
    def += indent(n, "}") + NL;
    return def;
}
function genDefinition(def, n) {
    var result = "";
    utils_1.forEach(def, function (prod) {
        result += genProd(prod, n + 1);
    });
    return result;
}
function indent(howMuch, text) {
    var spaces = Array(howMuch * 4 + 1).join(" ");
    return spaces + text;
}
//# sourceMappingURL=generate.js.map